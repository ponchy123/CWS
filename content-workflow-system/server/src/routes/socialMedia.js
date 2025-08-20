const express = require('express');
const axios = require('axios');
const router = express.Router();

// 缓存配置
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10分钟缓存

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

// 错误处理
function handleApiError(error, apiName) {
  console.error(`${apiName} API错误:`, error.message);
  return {
    success: false,
    message: `${apiName} API暂时不可用`,
    error: error.message
  };
}

// 模拟数据生成器
function generateMockSocialPost(platform, index = 0) {
  const platforms = {
    twitter: {
      name: 'Twitter',
      color: '#1DA1F2',
      maxLength: 280
    },
    instagram: {
      name: 'Instagram', 
      color: '#E4405F',
      maxLength: 2200
    },
    youtube: {
      name: 'YouTube',
      color: '#FF0000',
      maxLength: 5000
    },
    tiktok: {
      name: 'TikTok',
      color: '#000000',
      maxLength: 150
    },
    facebook: {
      name: 'Facebook',
      color: '#1877F2',
      maxLength: 63206
    }
  };

  const sampleContent = {
    twitter: [
      "刚刚发现了一个超棒的AI工具，效率提升了300%！#AI #效率 #科技",
      "今天的日落太美了，忍不住分享给大家 🌅 #日落 #美景 #生活",
      "新的一周开始了，让我们一起加油！💪 #周一 #动力 #奋斗"
    ],
    instagram: [
      "今天尝试了新的咖啡店，环境超棒！☕️ #咖啡 #生活方式 #探店",
      "健身第30天打卡，坚持就是胜利！💪 #健身 #坚持 #自律",
      "周末的阅读时光，推荐这本好书 📚 #阅读 #书籍推荐 #知识"
    ],
    youtube: [
      "【教程】如何在30分钟内学会React基础 - 完整指南",
      "我的一天Vlog：程序员的真实生活记录",
      "2024年最值得学习的5个编程语言推荐"
    ],
    tiktok: [
      "3秒学会这个生活小技巧！#生活技巧 #实用",
      "今日穿搭分享 ✨ #穿搭 #时尚 #OOTD",
      "简单易学的料理教程 🍳 #料理 #美食 #教程"
    ],
    facebook: [
      "分享一些关于时间管理的心得，希望对大家有帮助。时间是我们最宝贵的资源...",
      "今天参加了一个很有意义的志愿活动，感受到了帮助他人的快乐。",
      "推荐几本最近读过的好书，每一本都让我受益匪浅。"
    ]
  };

  const authors = [
    { name: '张小明', username: 'zhangxm', verified: true },
    { name: '李美丽', username: 'limeili', verified: false },
    { name: '王大力', username: 'wangdali', verified: true },
    { name: '刘小红', username: 'liuxh', verified: false },
    { name: '陈建国', username: 'chenjianguo', verified: true }
  ];

  const hashtags = {
    twitter: ['#AI', '#科技', '#生活', '#学习', '#分享'],
    instagram: ['#生活方式', '#美食', '#旅行', '#健身', '#摄影'],
    youtube: ['#教程', '#技术', '#生活', '#娱乐', '#学习'],
    tiktok: ['#搞笑', '#生活技巧', '#美食', '#舞蹈', '#创意'],
    facebook: ['#分享', '#生活感悟', '#学习', '#工作', '#家庭']
  };

  const author = authors[index % authors.length];
  const content = sampleContent[platform][index % sampleContent[platform].length];
  
  return {
    id: `${platform}_${Date.now()}_${index}`,
    platform,
    content,
    author: {
      ...author,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.username}`
    },
    metrics: {
      likes: Math.floor(Math.random() * 10000) + 100,
      shares: Math.floor(Math.random() * 1000) + 10,
      comments: Math.floor(Math.random() * 500) + 5,
      views: Math.floor(Math.random() * 100000) + 1000
    },
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    url: `https://${platform}.com/${author.username}/status/${Date.now()}`,
    hashtags: hashtags[platform].slice(0, Math.floor(Math.random() * 3) + 1),
    mentions: []
  };
}

// 获取支持的平台列表
router.get('/platforms', (req, res) => {
  const platforms = [
    {
      id: 'twitter',
      name: 'Twitter',
      icon: '🐦',
      color: '#1DA1F2',
      enabled: true,
      features: ['posts', 'trends', 'analytics']
    },
    {
      id: 'instagram', 
      name: 'Instagram',
      icon: '📷',
      color: '#E4405F',
      enabled: true,
      features: ['posts', 'stories', 'analytics']
    },
    {
      id: 'youtube',
      name: 'YouTube', 
      icon: '📺',
      color: '#FF0000',
      enabled: true,
      features: ['videos', 'analytics', 'comments']
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: '🎵',
      color: '#000000', 
      enabled: true,
      features: ['videos', 'trends', 'analytics']
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '👥',
      color: '#1877F2',
      enabled: true,
      features: ['posts', 'pages', 'analytics']
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      color: '#0077B5',
      enabled: false,
      features: ['posts', 'articles', 'analytics']
    }
  ];

  res.json({ success: true, data: platforms });
});

// 获取热门内容
router.get('/trending/:platform', (req, res) => {
  try {
    const { platform } = req.params;
    const { limit = 20 } = req.query;
    const cacheKey = `trending_${platform}_${limit}`;

    // 检查缓存
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // 生成模拟数据
    const posts = [];
    for (let i = 0; i < parseInt(limit); i++) {
      posts.push(generateMockSocialPost(platform, i));
    }

    // 按参与度排序
    posts.sort((a, b) => {
      const engagementA = a.metrics.likes + a.metrics.shares * 2 + a.metrics.comments * 3;
      const engagementB = b.metrics.likes + b.metrics.shares * 2 + b.metrics.comments * 3;
      return engagementB - engagementA;
    });

    setCachedData(cacheKey, posts);
    res.json({ success: true, data: posts });

  } catch (error) {
    res.json(handleApiError(error, 'Social Media'));
  }
});

// 搜索社交媒体内容
router.get('/search', (req, res) => {
  try {
    const { query, platforms = 'twitter,instagram', limit = 50 } = req.query;
    const platformList = platforms.split(',');
    const cacheKey = `search_${query}_${platforms}_${limit}`;

    // 检查缓存
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // 生成模拟搜索结果
    const allPosts = [];
    platformList.forEach(platform => {
      const postsPerPlatform = Math.ceil(limit / platformList.length);
      for (let i = 0; i < postsPerPlatform; i++) {
        const post = generateMockSocialPost(platform.trim(), i);
        // 在内容中包含搜索关键词
        post.content = post.content.replace(/AI|科技|生活/, query);
        allPosts.push(post);
      }
    });

    // 随机排序并限制数量
    const shuffled = allPosts.sort(() => 0.5 - Math.random()).slice(0, parseInt(limit));

    setCachedData(cacheKey, shuffled);
    res.json({ success: true, data: shuffled });

  } catch (error) {
    res.json(handleApiError(error, 'Social Media Search'));
  }
});

// 获取趋势话题
router.get('/trends/:platform', (req, res) => {
  try {
    const { platform } = req.params;
    const cacheKey = `trends_${platform}`;

    // 检查缓存
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // 生成模拟趋势话题
    const trendTopics = {
      twitter: [
        { name: '#AI革命', volume: 125000, growth: 15.2, category: '科技' },
        { name: '#可持续发展', volume: 89000, growth: 8.7, category: '环保' },
        { name: '#远程工作', volume: 67000, growth: 12.1, category: '工作' },
        { name: '#数字化转型', volume: 54000, growth: 6.8, category: '商业' },
        { name: '#健康生活', volume: 43000, growth: 9.3, category: '生活' }
      ],
      instagram: [
        { name: '#生活美学', volume: 234000, growth: 18.5, category: '生活方式' },
        { name: '#美食探店', volume: 187000, growth: 14.2, category: '美食' },
        { name: '#健身打卡', volume: 156000, growth: 11.7, category: '健康' },
        { name: '#旅行日记', volume: 134000, growth: 7.9, category: '旅行' },
        { name: '#穿搭分享', volume: 98000, growth: 13.4, category: '时尚' }
      ],
      youtube: [
        { name: '编程教程', volume: 78000, growth: 22.1, category: '教育' },
        { name: 'AI工具测评', volume: 65000, growth: 19.8, category: '科技' },
        { name: '生活Vlog', volume: 54000, growth: 8.3, category: '生活' },
        { name: '理财知识', volume: 43000, growth: 15.6, category: '财经' },
        { name: '游戏攻略', volume: 39000, growth: 6.7, category: '游戏' }
      ],
      tiktok: [
        { name: '#生活技巧', volume: 345000, growth: 25.3, category: '生活' },
        { name: '#搞笑日常', volume: 298000, growth: 12.8, category: '娱乐' },
        { name: '#美食制作', volume: 234000, growth: 16.4, category: '美食' },
        { name: '#舞蹈挑战', volume: 187000, growth: 9.2, category: '娱乐' },
        { name: '#学习方法', volume: 156000, growth: 18.7, category: '教育' }
      ],
      facebook: [
        { name: '家庭生活', volume: 123000, growth: 7.4, category: '生活' },
        { name: '职场分享', volume: 98000, growth: 11.2, category: '工作' },
        { name: '育儿心得', volume: 87000, growth: 9.8, category: '家庭' },
        { name: '投资理财', volume: 76000, growth: 13.5, category: '财经' },
        { name: '健康养生', volume: 65000, growth: 6.9, category: '健康' }
      ]
    };

    const trends = (trendTopics[platform] || []).map((topic, index) => ({
      id: `trend_${platform}_${index}`,
      name: topic.name,
      platform,
      volume: topic.volume,
      growth: topic.growth,
      category: topic.category,
      description: `${topic.name}相关内容在${platform}上的热度持续上升`,
      relatedHashtags: [`#${topic.category}`, `#热门`, `#趋势`]
    }));

    setCachedData(cacheKey, trends);
    res.json({ success: true, data: trends });

  } catch (error) {
    res.json(handleApiError(error, 'Trends'));
  }
});

// 获取用户内容
router.get('/user/:platform/:username', (req, res) => {
  try {
    const { platform, username } = req.params;
    const { limit = 20 } = req.query;
    const cacheKey = `user_${platform}_${username}_${limit}`;

    // 检查缓存
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // 生成模拟用户内容
    const posts = [];
    for (let i = 0; i < parseInt(limit); i++) {
      const post = generateMockSocialPost(platform, i);
      post.author.username = username;
      post.author.name = username.charAt(0).toUpperCase() + username.slice(1);
      posts.push(post);
    }

    setCachedData(cacheKey, posts);
    res.json({ success: true, data: posts });

  } catch (error) {
    res.json(handleApiError(error, 'User Content'));
  }
});

// 分析社交媒体数据
router.get('/analytics/:platform', (req, res) => {
  try {
    const { platform } = req.params;
    const { timeRange = '7d' } = req.query;
    const cacheKey = `analytics_${platform}_${timeRange}`;

    // 检查缓存
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // 生成模拟分析数据
    const analytics = {
      platform,
      totalPosts: Math.floor(Math.random() * 10000) + 1000,
      totalEngagement: Math.floor(Math.random() * 100000) + 10000,
      averageEngagement: Math.floor(Math.random() * 1000) + 100,
      topHashtags: [
        { tag: '#AI', count: 1250, engagement: 15600 },
        { tag: '#科技', count: 980, engagement: 12300 },
        { tag: '#生活', count: 876, engagement: 9800 },
        { tag: '#学习', count: 654, engagement: 8900 },
        { tag: '#分享', count: 543, engagement: 7600 }
      ],
      sentimentAnalysis: {
        positive: Math.floor(Math.random() * 30) + 50,
        neutral: Math.floor(Math.random() * 20) + 20,
        negative: Math.floor(Math.random() * 15) + 5
      },
      timeDistribution: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        posts: Math.floor(Math.random() * 100) + 10,
        engagement: Math.floor(Math.random() * 1000) + 100
      }))
    };

    setCachedData(cacheKey, analytics);
    res.json({ success: true, data: analytics });

  } catch (error) {
    res.json(handleApiError(error, 'Analytics'));
  }
});

// Hashtag建议
router.post('/hashtags/suggest', (req, res) => {
  try {
    const { content, platform } = req.body;

    // 基于内容和平台生成hashtag建议
    const suggestions = {
      twitter: ['#AI', '#科技', '#创新', '#效率', '#学习'],
      instagram: ['#生活方式', '#美好生活', '#日常', '#分享', '#记录'],
      youtube: ['#教程', '#知识分享', '#学习', '#技能', '#成长'],
      tiktok: ['#创意', '#有趣', '#生活技巧', '#分享', '#推荐'],
      facebook: ['#生活感悟', '#分享', '#学习', '#成长', '#思考']
    };

    const platformSuggestions = suggestions[platform] || suggestions.twitter;
    
    res.json({ 
      success: true, 
      data: platformSuggestions.slice(0, Math.floor(Math.random() * 3) + 3)
    });

  } catch (error) {
    res.json(handleApiError(error, 'Hashtag Suggestions'));
  }
});

// 情感分析
router.post('/sentiment/analyze', (req, res) => {
  try {
    const { content } = req.body;

    // 简单的情感分析模拟
    const positiveWords = ['好', '棒', '优秀', '喜欢', '开心', '成功', '美好'];
    const negativeWords = ['坏', '差', '失败', '难过', '糟糕', '问题', '困难'];

    let positiveScore = 0;
    let negativeScore = 0;

    positiveWords.forEach(word => {
      if (content.includes(word)) positiveScore++;
    });

    negativeWords.forEach(word => {
      if (content.includes(word)) negativeScore++;
    });

    let sentiment = 'neutral';
    let confidence = 0.6;

    if (positiveScore > negativeScore) {
      sentiment = 'positive';
      confidence = Math.min(0.9, 0.6 + (positiveScore - negativeScore) * 0.1);
    } else if (negativeScore > positiveScore) {
      sentiment = 'negative';
      confidence = Math.min(0.9, 0.6 + (negativeScore - positiveScore) * 0.1);
    }

    const result = {
      sentiment,
      confidence,
      emotions: [
        { emotion: '快乐', score: sentiment === 'positive' ? confidence : 0.2 },
        { emotion: '中性', score: sentiment === 'neutral' ? confidence : 0.3 },
        { emotion: '悲伤', score: sentiment === 'negative' ? confidence : 0.1 }
      ]
    };

    res.json({ success: true, data: result });

  } catch (error) {
    res.json(handleApiError(error, 'Sentiment Analysis'));
  }
});

// 最佳发布时间
router.get('/timing/best/:platform', (req, res) => {
  try {
    const { platform } = req.params;
    const { timezone = 'Asia/Shanghai' } = req.query;
    const cacheKey = `timing_${platform}_${timezone}`;

    // 检查缓存
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // 生成最佳发布时间建议
    const result = {
      recommendedTimes: [
        { hour: 9, day: 1, score: 0.85, reason: '工作日早晨，用户活跃度高' },
        { hour: 12, day: 1, score: 0.78, reason: '午休时间，浏览社交媒体' },
        { hour: 19, day: 1, score: 0.92, reason: '下班后黄金时段' },
        { hour: 21, day: 6, score: 0.88, reason: '周末晚上休闲时光' }
      ],
      analysis: {
        peakHours: [9, 12, 19, 21],
        peakDays: [1, 2, 3, 6, 7],
        audienceActivity: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          activity: Math.random() * 100
        }))
      }
    };

    setCachedData(cacheKey, result);
    res.json({ success: true, data: result });

  } catch (error) {
    res.json(handleApiError(error, 'Timing Analysis'));
  }
});

// 内容优化建议
router.post('/optimize/content', (req, res) => {
  try {
    const { content, platform } = req.body;

    const suggestions = [];
    let score = 70;

    // 长度检查
    const platformLimits = {
      twitter: 280,
      instagram: 2200,
      youtube: 5000,
      tiktok: 150,
      facebook: 63206
    };

    const limit = platformLimits[platform] || 280;
    if (content.length > limit) {
      suggestions.push({
        type: 'length',
        message: `内容过长，建议控制在${limit}字符以内`,
        priority: 'high'
      });
      score -= 20;
    }

    // Hashtag检查
    const hashtagCount = (content.match(/#/g) || []).length;
    if (hashtagCount === 0) {
      suggestions.push({
        type: 'hashtags',
        message: '建议添加相关hashtag提高曝光度',
        priority: 'medium'
      });
      score -= 10;
    } else if (hashtagCount > 5) {
      suggestions.push({
        type: 'hashtags',
        message: 'Hashtag过多，建议控制在3-5个',
        priority: 'medium'
      });
      score -= 5;
    }

    // 媒体建议
    if (!content.includes('图片') && !content.includes('视频')) {
      suggestions.push({
        type: 'media',
        message: '建议添加图片或视频增加吸引力',
        priority: 'low'
      });
      score -= 5;
    }

    const result = {
      score: Math.max(0, score),
      suggestions,
      optimizedContent: suggestions.length > 0 ? content + ' #优化建议' : content
    };

    res.json({ success: true, data: result });

  } catch (error) {
    res.json(handleApiError(error, 'Content Optimization'));
  }
});

// 发布计划管理
router.post('/publish/plan', (req, res) => {
  try {
    const plan = {
      id: `plan_${Date.now()}`,
      ...req.body,
      status: 'draft',
      createdAt: new Date().toISOString()
    };

    res.json({ success: true, data: plan });

  } catch (error) {
    res.json(handleApiError(error, 'Publish Plan'));
  }
});

router.get('/publish/plans', (req, res) => {
  try {
    const { status } = req.query;
    
    // 生成模拟发布计划
    const plans = [
      {
        id: 'plan_1',
        content: '分享今天学到的新技能 #学习 #成长',
        platforms: ['twitter', 'instagram'],
        scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        hashtags: ['#学习', '#成长'],
        mentions: []
      },
      {
        id: 'plan_2', 
        content: '周末的美食制作教程 #美食 #教程',
        platforms: ['youtube', 'tiktok'],
        scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'draft',
        hashtags: ['#美食', '#教程'],
        mentions: []
      }
    ];

    const filteredPlans = status ? plans.filter(p => p.status === status) : plans;
    res.json({ success: true, data: filteredPlans });

  } catch (error) {
    res.json(handleApiError(error, 'Publish Plans'));
  }
});

// 执行发布
router.post('/publish/execute/:planId', (req, res) => {
  try {
    const { planId } = req.params;

    const result = {
      success: true,
      results: [
        { platform: 'twitter', success: true, postId: 'tw_123456' },
        { platform: 'instagram', success: true, postId: 'ig_789012' }
      ]
    };

    res.json({ success: true, data: result });

  } catch (error) {
    res.json(handleApiError(error, 'Publish Execute'));
  }
});

// 竞品分析
router.post('/competitors/analyze', (req, res) => {
  try {
    const { competitors, platform, timeRange } = req.body;

    const result = {
      competitors: competitors.map((username, index) => ({
        username,
        followers: Math.floor(Math.random() * 100000) + 10000,
        posts: Math.floor(Math.random() * 1000) + 100,
        engagement: Math.floor(Math.random() * 10000) + 1000,
        topContent: [generateMockSocialPost(platform, index)],
        strategies: ['定期发布', '互动回复', '话题营销']
      })),
      insights: {
        commonHashtags: ['#科技', '#创新', '#分享', '#学习'],
        postingPatterns: {
          bestTimes: ['9:00', '12:00', '19:00'],
          frequency: '每日1-2次'
        },
        contentTypes: {
          text: 40,
          image: 35,
          video: 25
        },
        recommendations: [
          '增加视频内容比例',
          '优化发布时间',
          '提高互动频率',
          '关注热门话题'
        ]
      }
    };

    res.json({ success: true, data: result });

  } catch (error) {
    res.json(handleApiError(error, 'Competitor Analysis'));
  }
});

// 获取API状态
router.get('/status', (req, res) => {
  const status = {
    platforms: {
      twitter: true,
      instagram: true,
      youtube: true,
      tiktok: true,
      facebook: true,
      linkedin: false
    },
    features: {
      trending: true,
      search: true,
      analytics: true,
      publishing: true,
      optimization: true
    },
    cacheSize: cache.size,
    lastUpdate: new Date().toISOString()
  };

  res.json({ success: true, data: status });
});

// 清除缓存
router.post('/cache/clear', (req, res) => {
  cache.clear();
  res.json({ success: true, message: '社交媒体缓存已清除' });
});

module.exports = router;