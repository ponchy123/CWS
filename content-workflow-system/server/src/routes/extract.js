const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { auth } = require('../middleware/auth');

const router = express.Router();

// 提取网页内容
router.post('/content', auth, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL不能为空'
      });
    }

    // 验证URL格式
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'URL格式不正确'
      });
    }

    // 获取网页内容
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    // 提取基本信息
    const title = $('title').text().trim() || 
                  $('meta[property="og:title"]').attr('content') || 
                  $('h1').first().text().trim() || 
                  '未知标题';

    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       $('p').first().text().trim().substring(0, 200) || 
                       '';

    const image = $('meta[property="og:image"]').attr('content') || 
                  $('img').first().attr('src') || 
                  '';

    // 提取主要内容
    let content = '';
    const contentSelectors = [
      'article',
      '.content',
      '.post-content',
      '.entry-content',
      'main',
      '.main-content'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        break;
      }
    }

    // 如果没有找到主要内容，使用段落文本
    if (!content) {
      content = $('p').map((i, el) => $(el).text().trim()).get().join('\n').substring(0, 1000);
    }

    // 检测内容类型
    let type = 'article';
    if (url.includes('video') || $('video').length > 0) {
      type = 'video';
    } else if ($('img').length > 3) {
      type = 'image';
    }

    // 提取关键词作为标签
    const tags = extractKeywords(title + ' ' + description + ' ' + content);

    res.json({
      success: true,
      data: {
        title: title.substring(0, 200),
        content: content.substring(0, 2000),
        description: description.substring(0, 500),
        image,
        type,
        tags,
        url,
        extractedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('提取网页内容错误:', error);
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(400).json({
        success: false,
        message: '无法访问该网址'
      });
    }
    
    if (error.code === 'ETIMEDOUT') {
      return res.status(400).json({
        success: false,
        message: '请求超时，请稍后重试'
      });
    }

    res.status(500).json({
      success: false,
      message: '提取内容失败'
    });
  }
});

// 批量提取多个URL
router.post('/batch', auth, async (req, res) => {
  try {
    const { urls } = req.body;
    
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'URLs数组不能为空'
      });
    }

    if (urls.length > 10) {
      return res.status(400).json({
        success: false,
        message: '一次最多处理10个URL'
      });
    }

    const results = await Promise.allSettled(
      urls.map(async (url) => {
        const response = await axios.post(`${req.protocol}://${req.get('host')}/api/extract/content`, 
          { url }, 
          { 
            headers: { 
              'Authorization': req.headers.authorization 
            } 
          }
        );
        return response.data;
      })
    );

    const successful = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    const failed = results
      .filter(result => result.status === 'rejected')
      .map((result, index) => ({
        url: urls[index],
        error: result.reason.message
      }));

    res.json({
      success: true,
      data: {
        successful,
        failed,
        total: urls.length,
        successCount: successful.length,
        failCount: failed.length
      }
    });

  } catch (error) {
    console.error('批量提取错误:', error);
    res.status(500).json({
      success: false,
      message: '批量提取失败'
    });
  }
});

// 提取关键词的辅助函数
function extractKeywords(text) {
  const keywords = [];
  
  // 预定义的关键词列表
  const predefinedKeywords = [
    'AI', 'ChatGPT', '人工智能', '机器学习', '深度学习',
    '产品经理', '产品设计', 'UX', 'UI', '用户体验',
    '营销', '推广', 'SEO', '内容营销', '社交媒体',
    '创业', '投资', '商业模式', '战略', '管理',
    '技术', '编程', '开发', '前端', '后端',
    '数据分析', '数据科学', '可视化', '报告',
    '写作', '文案', '创作', '内容', '媒体'
  ];

  // 检查文本中是否包含预定义关键词
  predefinedKeywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      keywords.push(keyword);
    }
  });

  // 提取#标签
  const hashTags = text.match(/#[\u4e00-\u9fa5\w]+/g);
  if (hashTags) {
    keywords.push(...hashTags.map(tag => tag.substring(1)));
  }

  // 去重并限制数量
  return [...new Set(keywords)].slice(0, 8);
}

module.exports = router;