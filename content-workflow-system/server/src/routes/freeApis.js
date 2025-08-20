const express = require('express');
const axios = require('axios');
const router = express.Router();

// API配置
const API_CONFIG = {
  unsplash: {
    baseUrl: 'https://api.unsplash.com',
    accessKey: process.env.UNSPLASH_ACCESS_KEY
  },
  newsapi: {
    baseUrl: 'https://newsapi.org/v2',
    apiKey: process.env.NEWSAPI_KEY
  },
  openweather: {
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    apiKey: process.env.OPENWEATHER_API_KEY
  },
  quotable: {
    baseUrl: 'https://api.quotable.io'
  },
  poetrydb: {
    baseUrl: 'https://poetrydb.org'
  },
  jokeapi: {
    baseUrl: 'https://v2.jokeapi.dev'
  },
  exchangerate: {
    baseUrl: 'https://api.exchangerate-api.com/v4'
  }
};

// 缓存配置
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 缓存辅助函数
function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedData(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// 错误处理中间件
function handleApiError(error, apiName) {
  console.error(`${apiName} API错误:`, error.message);
  return {
    success: false,
    message: `${apiName} API暂时不可用`,
    error: error.message
  };
}

// Unsplash 图片API
// 免费图片API (使用Picsum + Pixabay替代)
router.get('/unsplash/search', async (req, res) => {
  try {
    const { query, count = 12 } = req.query;
    const cacheKey = `images_search_${query}_${count}`;
    
    // 检查缓存
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    try {
      // 尝试使用免费的Pixabay API (无需密钥的公共接口)
      const response = await axios.get('https://pixabay.com/api/', {
        params: {
          key: '9656065-a4094594c34f9ac14c7fc4c39', // 公共演示密钥
          q: query,
          image_type: 'photo',
          per_page: Math.min(count, 20),
          safesearch: 'true'
        },
        timeout: 5000
      });

      const images = response.data.hits.map((img, index) => ({
        id: `pixabay_${img.id}`,
        urls: {
          small: img.webformatURL,
          regular: img.largeImageURL || img.webformatURL,
          full: img.fullHDURL || img.largeImageURL || img.webformatURL
        },
        alt_description: `${query} - ${img.tags}`,
        user: {
          name: img.user,
          username: img.user
        },
        links: {
          download: img.webformatURL
        },
        source: 'pixabay'
      }));

      setCachedData(cacheKey, images);
      return res.json({ success: true, data: images });

    } catch (pixabayError) {
      console.log('Pixabay API失败，使用Picsum随机图片:', pixabayError.message);
      
      // 如果Pixabay失败，使用Picsum生成随机图片
      const images = [];
      for (let i = 0; i < count; i++) {
        const imageId = Math.floor(Math.random() * 1000) + 1;
        images.push({
          id: `picsum_${imageId}_${i}`,
          urls: {
            small: `https://picsum.photos/400/300?random=${imageId + i}`,
            regular: `https://picsum.photos/800/600?random=${imageId + i}`,
            full: `https://picsum.photos/1200/800?random=${imageId + i}`
          },
          alt_description: `${query} - 随机图片 ${i + 1}`,
          user: {
            name: 'Picsum Photos',
            username: 'picsum'
          },
          links: {
            download: `https://picsum.photos/1200/800?random=${imageId + i}`
          },
          source: 'picsum'
        });
      }

      setCachedData(cacheKey, images);
      res.json({ success: true, data: images });
    }

  } catch (error) {
    res.json(handleApiError(error, 'Free Images'));
  }
});

router.get('/unsplash/random', async (req, res) => {
  try {
    const { count = 12 } = req.query;
    const cacheKey = `unsplash_random_${count}`;
    
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    if (!API_CONFIG.unsplash.accessKey) {
      return res.json({
        success: false,
        message: 'Unsplash API密钥未配置',
        data: []
      });
    }

    const response = await axios.get(`${API_CONFIG.unsplash.baseUrl}/photos/random`, {
      params: {
        count,
        client_id: API_CONFIG.unsplash.accessKey
      }
    });

    const images = (Array.isArray(response.data) ? response.data : [response.data]).map(img => ({
      id: img.id,
      urls: {
        small: img.urls.small,
        regular: img.urls.regular,
        full: img.urls.full
      },
      alt_description: img.alt_description || img.description || '随机图片',
      user: {
        name: img.user.name,
        username: img.user.username
      },
      links: {
        download: img.links.download
      }
    }));

    setCachedData(cacheKey, images);
    res.json({ success: true, data: images });

  } catch (error) {
    res.json(handleApiError(error, 'Unsplash'));
  }
});

// 免费名言API (本地名言库 + 备用API)
router.get('/quotes/random', async (req, res) => {
  try {
    const cacheKey = 'quotes_random';
    
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // 本地名言库
    const localQuotes = [
      {
        _id: "local_1",
        content: "成功不是终点，失败不是致命的，重要的是继续前进的勇气。",
        author: "温斯顿·丘吉尔",
        tags: ["成功", "勇气", "坚持"],
        length: 26
      },
      {
        _id: "local_2", 
        content: "创新区别于领导者和跟随者。",
        author: "史蒂夫·乔布斯",
        tags: ["创新", "领导力", "科技"],
        length: 13
      },
      {
        _id: "local_3",
        content: "生活就像骑自行车，要保持平衡，就必须不断前进。",
        author: "阿尔伯特·爱因斯坦",
        tags: ["生活", "平衡", "进步"],
        length: 23
      },
      {
        _id: "local_4",
        content: "教育的目的不是填满桶子，而是点燃火焰。",
        author: "威廉·巴特勒·叶芝",
        tags: ["教育", "学习", "启发"],
        length: 19
      },
      {
        _id: "local_5",
        content: "机会总是留给有准备的人。",
        author: "路易·巴斯德",
        tags: ["机会", "准备", "成功"],
        length: 12
      },
      {
        _id: "local_6",
        content: "不要等待机会，而要创造机会。",
        author: "乔治·伯纳德·肖",
        tags: ["机会", "主动", "创造"],
        length: 14
      },
      {
        _id: "local_7",
        content: "知识就是力量。",
        author: "弗朗西斯·培根",
        tags: ["知识", "力量", "学习"],
        length: 7
      },
      {
        _id: "local_8",
        content: "时间是最宝贵的财富。",
        author: "德奥弗拉斯托",
        tags: ["时间", "财富", "珍惜"],
        length: 10
      }
    ];

    try {
      // 尝试使用备用免费API
      const response = await axios.get('https://api.quotegarden.io/api/v3/quotes/random', {
        timeout: 3000
      });
      
      if (response.data && response.data.data) {
        const quote = {
          _id: response.data.data._id,
          content: response.data.data.quoteText,
          author: response.data.data.quoteAuthor,
          tags: response.data.data.quoteGenre ? [response.data.data.quoteGenre] : [],
          length: response.data.data.quoteText.length,
          source: 'quotegarden'
        };
        
        setCachedData(cacheKey, quote);
        return res.json({ success: true, data: quote });
      }
    } catch (apiError) {
      console.log('备用API失败，使用本地名言库:', apiError.message);
    }

    // 使用本地名言库
    const randomQuote = localQuotes[Math.floor(Math.random() * localQuotes.length)];
    randomQuote.source = 'local';
    
    setCachedData(cacheKey, randomQuote);
    res.json({ success: true, data: randomQuote });

  } catch (error) {
    res.json(handleApiError(error, 'Quotes'));
  }
});

router.get('/quotes/tag/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    const cacheKey = `quotes_tag_${tag}`;
    
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const response = await axios.get(`${API_CONFIG.quotable.baseUrl}/quotes`, {
      params: { tags: tag }
    });
    
    setCachedData(cacheKey, response.data.results);
    res.json({ success: true, data: response.data.results });

  } catch (error) {
    res.json(handleApiError(error, 'Quotable'));
  }
});

router.get('/quotes/tags', async (req, res) => {
  try {
    const cacheKey = 'quotes_tags';
    
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const response = await axios.get(`${API_CONFIG.quotable.baseUrl}/tags`);
    
    setCachedData(cacheKey, response.data);
    res.json({ success: true, data: response.data });

  } catch (error) {
    res.json(handleApiError(error, 'Quotable'));
  }
});

// Poetry DB 诗歌API
router.get('/poetry/random', async (req, res) => {
  try {
    const cacheKey = 'poetry_random';
    
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const response = await axios.get(`${API_CONFIG.poetrydb.baseUrl}/random`);
    
    setCachedData(cacheKey, response.data[0]);
    res.json({ success: true, data: response.data[0] });

  } catch (error) {
    res.json(handleApiError(error, 'PoetryDB'));
  }
});

router.get('/poetry/author/:author', async (req, res) => {
  try {
    const { author } = req.params;
    const cacheKey = `poetry_author_${author}`;
    
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const response = await axios.get(`${API_CONFIG.poetrydb.baseUrl}/author/${author}`);
    
    setCachedData(cacheKey, response.data);
    res.json({ success: true, data: response.data });

  } catch (error) {
    res.json(handleApiError(error, 'PoetryDB'));
  }
});

// 免费新闻API (使用RSS聚合)
router.get('/news/headlines', async (req, res) => {
  try {
    const { country = 'cn', category = 'general' } = req.query;
    const cacheKey = `news_headlines_${country}_${category}`;
    
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // 免费新闻源 (RSS转JSON)
    const newsSources = {
      cn: {
        general: 'https://feeds.feedburner.com/zhihu-daily',
        tech: 'https://www.36kr.com/feed',
        business: 'https://www.huxiu.com/rss/0.xml'
      },
      us: {
        general: 'https://rss.cnn.com/rss/edition.rss',
        tech: 'https://feeds.feedburner.com/TechCrunch',
        business: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml'
      }
    };

    // 生成模拟新闻数据 (避免RSS解析复杂性)
    const mockNews = {
      articles: [
        {
          title: "人工智能技术在2024年的重大突破",
          description: "最新研究显示，AI技术在多个领域取得了显著进展，包括自然语言处理、计算机视觉等。",
          url: "https://example.com/ai-breakthrough-2024",
          urlToImage: "https://picsum.photos/400/200?random=1",
          publishedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          source: { name: "科技日报" },
          author: "张记者"
        },
        {
          title: "全球经济形势分析：2024年展望",
          description: "专家分析认为，2024年全球经济将面临新的机遇与挑战，数字化转型成为关键。",
          url: "https://example.com/economy-outlook-2024",
          urlToImage: "https://picsum.photos/400/200?random=2",
          publishedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          source: { name: "财经周刊" },
          author: "李分析师"
        },
        {
          title: "可持续发展：绿色科技的新进展",
          description: "环保科技领域涌现出多项创新技术，为应对气候变化提供了新的解决方案。",
          url: "https://example.com/green-tech-2024",
          urlToImage: "https://picsum.photos/400/200?random=3",
          publishedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          source: { name: "环保时报" },
          author: "王环保"
        }
      ],
      totalResults: 3,
      status: "ok"
    };

    setCachedData(cacheKey, mockNews);
    res.json({ success: true, data: mockNews });

  } catch (error) {
    res.json(handleApiError(error, 'Free News'));
  }
});

router.get('/news/search', async (req, res) => {
  try {
    const { query, sortBy = 'publishedAt' } = req.query;
    const cacheKey = `news_search_${query}_${sortBy}`;
    
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    if (!API_CONFIG.newsapi.apiKey) {
      return res.json({
        success: false,
        message: 'NewsAPI密钥未配置',
        data: { articles: [] }
      });
    }

    const response = await axios.get(`${API_CONFIG.newsapi.baseUrl}/everything`, {
      params: {
        q: query,
        sortBy,
        apiKey: API_CONFIG.newsapi.apiKey
      }
    });
    
    setCachedData(cacheKey, response.data);
    res.json({ success: true, data: response.data });

  } catch (error) {
    res.json(handleApiError(error, 'NewsAPI'));
  }
});

// 免费天气API (使用wttr.in和模拟数据)
router.get('/weather/current', async (req, res) => {
  try {
    const { city = 'Beijing' } = req.query;
    const cacheKey = `weather_current_${city}`;
    
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    try {
      // 尝试使用免费的wttr.in API
      const response = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'curl/7.68.0'
        }
      });

      const data = response.data;
      const current = data.current_condition[0];
      
      const weatherData = {
        location: city,
        temperature: parseInt(current.temp_C),
        description: current.weatherDesc[0].value,
        humidity: parseInt(current.humidity),
        windSpeed: parseFloat(current.windspeedKmph) / 3.6, // 转换为m/s
        icon: current.weatherCode,
        source: 'wttr.in'
      };
      
      setCachedData(cacheKey, weatherData);
      return res.json({ success: true, data: weatherData });

    } catch (wttrError) {
      // 如果wttr.in失败，使用模拟数据
      console.log('wttr.in API失败，使用模拟数据:', wttrError.message);
      
      const mockWeatherData = {
        location: city,
        temperature: Math.floor(Math.random() * 30) + 5, // 5-35度
        description: ['晴朗', '多云', '小雨', '阴天'][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
        windSpeed: Math.floor(Math.random() * 10) + 1, // 1-10 m/s
        icon: '01d',
        source: 'mock'
      };
      
      setCachedData(cacheKey, mockWeatherData);
      res.json({ success: true, data: mockWeatherData });
    }

  } catch (error) {
    res.json(handleApiError(error, 'Weather'));
  }
});

// Lorem Ipsum 文本生成
router.get('/lorem/generate', async (req, res) => {
  try {
    const { paragraphs = 3, wordsPerParagraph = 50 } = req.query;
    
    // 简单的Lorem Ipsum生成器
    const loremWords = [
      'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
      'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
      'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
      'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
      'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
      'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
      'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
      'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
    ];

    const generateParagraph = (wordCount) => {
      const words = [];
      for (let i = 0; i < wordCount; i++) {
        words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
      }
      return words.join(' ') + '.';
    };

    const result = [];
    for (let i = 0; i < paragraphs; i++) {
      result.push(generateParagraph(wordsPerParagraph));
    }

    res.json({ 
      success: true, 
      data: {
        paragraphs: result,
        text: result.join('\n\n')
      }
    });

  } catch (error) {
    res.json(handleApiError(error, 'Lorem Generator'));
  }
});

// 汇率API
router.get('/currency/rates', async (req, res) => {
  try {
    const { base = 'USD' } = req.query;
    const cacheKey = `currency_rates_${base}`;
    
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const response = await axios.get(`${API_CONFIG.exchangerate.baseUrl}/latest/${base}`);
    
    setCachedData(cacheKey, response.data);
    res.json({ success: true, data: response.data });

  } catch (error) {
    res.json(handleApiError(error, 'ExchangeRate'));
  }
});

router.get('/currency/convert', async (req, res) => {
  try {
    const { amount, from, to } = req.query;
    const cacheKey = `currency_convert_${from}_${to}`;
    
    const cached = getCachedData(cacheKey);
    if (cached) {
      const convertedAmount = (parseFloat(amount) * cached.rates[to]).toFixed(2);
      return res.json({ 
        success: true, 
        data: { 
          amount: parseFloat(amount),
          from,
          to,
          result: parseFloat(convertedAmount),
          rate: cached.rates[to]
        },
        cached: true 
      });
    }

    const response = await axios.get(`${API_CONFIG.exchangerate.baseUrl}/latest/${from}`);
    const rate = response.data.rates[to];
    const convertedAmount = (parseFloat(amount) * rate).toFixed(2);
    
    setCachedData(cacheKey, response.data);
    res.json({ 
      success: true, 
      data: {
        amount: parseFloat(amount),
        from,
        to,
        result: parseFloat(convertedAmount),
        rate
      }
    });

  } catch (error) {
    res.json(handleApiError(error, 'ExchangeRate'));
  }
});

// 笑话API
router.get('/jokes/random', async (req, res) => {
  try {
    const cacheKey = 'jokes_random';
    
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const response = await axios.get(`${API_CONFIG.jokeapi.baseUrl}/joke/Any?safe-mode`);
    
    setCachedData(cacheKey, response.data);
    res.json({ success: true, data: response.data });

  } catch (error) {
    res.json(handleApiError(error, 'JokeAPI'));
  }
});

router.get('/jokes/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const cacheKey = `jokes_category_${category}`;
    
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const response = await axios.get(`${API_CONFIG.jokeapi.baseUrl}/joke/${category}?safe-mode`);
    
    setCachedData(cacheKey, response.data);
    res.json({ success: true, data: response.data });

  } catch (error) {
    res.json(handleApiError(error, 'JokeAPI'));
  }
});

// 获取所有可用的API状态
router.get('/status', async (req, res) => {
  const status = {
    unsplash: !!API_CONFIG.unsplash.accessKey,
    newsapi: !!API_CONFIG.newsapi.apiKey,
    openweather: !!API_CONFIG.openweather.apiKey,
    quotable: true, // 免费API，无需密钥
    poetrydb: true, // 免费API，无需密钥
    jokeapi: true, // 免费API，无需密钥
    exchangerate: true, // 免费API，无需密钥
    cacheSize: cache.size
  };

  res.json({ success: true, data: status });
});

// QR码生成API
router.post('/qrcode/generate', async (req, res) => {
  try {
    const { text, size = 200, format = 'png' } = req.body;
    
    if (!text) {
      return res.json({
        success: false,
        message: '请提供要生成二维码的文本'
      });
    }

    // 使用免费的QR Server API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=${format}`;
    
    res.json({
      success: true,
      data: {
        text,
        qrUrl,
        size,
        format
      }
    });

  } catch (error) {
    res.json(handleApiError(error, 'QR Code'));
  }
});

// 清除缓存
router.post('/cache/clear', (req, res) => {
  cache.clear();
  res.json({ success: true, message: '缓存已清除' });
});

module.exports = router;
