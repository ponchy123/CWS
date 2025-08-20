const express = require('express');
const Joi = require('joi');
const Inspiration = require('../models/Inspiration');
const { auth } = require('../middleware/auth');
const { fetchNewsNowRealData } = require('../utils/newsNowRealAPI-enhanced');

const router = express.Router();

// 灵感验证规则
const inspirationSchema = Joi.object({
  title: Joi.string().max(200).required().messages({
    'string.max': '标题最多200个字符',
    'any.required': '标题不能为空'
  }),
  content: Joi.string().required().messages({
    'any.required': '内容不能为空'
  }),
  source: Joi.string().optional(),
  sourceUrl: Joi.string().uri().optional(),
  type: Joi.string().valid('article', 'video', 'image', 'audio', 'link').optional(),
  category: Joi.string().valid('职业发展', 'AI工具', '行业分析', '文案技巧', '产品设计', '营销策略').required(),
  tags: Joi.array().items(Joi.string()).optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  status: Joi.string().valid('待处理', '进行中', '已完成', '已放弃').optional(),
  notes: Joi.string().optional()
});

// 获取基于NewsNow真实数据的灵感列表
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      type = 'hottest',
      sources = [],
      useRealData = 'true'
    } = req.query;

    console.log('🎯 获取灵感数据请求:', { page, limit, type, useRealData });

    if (useRealData === 'true') {
      // 使用NewsNow真实数据作为灵感
      console.log('📡 使用NewsNow真实数据获取灵感...');
      
      const realData = await fetchNewsNowRealData(
        type, 
        Array.isArray(sources) ? sources : sources.split(',').filter(Boolean),
        parseInt(limit)
      );

      if (realData && realData.length > 0) {
        // 将NewsNow数据转换为灵感格式
        const inspirations = realData.map((item, index) => ({
          _id: `newsnow-${item.source}-${Date.now()}-${index}`,
          title: item.title,
          content: item.summary || item.title,
          source: item.platform,
          sourceUrl: item.url,
          type: 'link',
          category: mapCategoryToInspiration(item.category),
          tags: item.tags || [],
          priority: item.heat > 10000 ? 'high' : item.heat > 5000 ? 'medium' : 'low',
          status: '待处理',
          isStarred: false,
          isDeleted: false,
          createdAt: item.createdAt,
          updatedAt: item.createdAt,
          heat: item.heat,
          platform: item.platform,
          color: item.color,
          isRealData: true,
          aiAnalysis: item.aiAnalysis
        }));

        console.log(`✅ 成功转换 ${inspirations.length} 条真实数据为灵感`);

        res.json({
          success: true,
          data: {
            inspirations,
            pagination: {
              current: parseInt(page),
              pageSize: parseInt(limit),
              total: inspirations.length,
              pages: 1
            },
            isRealData: true,
            dataSource: 'NewsNow Real API'
          }
        });
        return;
      }
    }

    // 如果真实数据获取失败或用户选择不使用真实数据，返回空数组
    console.log('⚠️ 未获取到真实数据，返回空灵感列表');
    res.json({
      success: true,
      data: {
        inspirations: [],
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: 0,
          pages: 0
        },
        isRealData: false,
        message: '暂无真实数据可用'
      }
    });

  } catch (error) {
    console.error('获取灵感列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取灵感列表失败',
      error: error.message
    });
  }
});

// 将NewsNow分类映射到灵感分类
function mapCategoryToInspiration(newsCategory) {
  const categoryMap = {
    '知识问答': '职业发展',
    '社会热点': '行业分析', 
    '技术社区': 'AI工具',
    '视频内容': '文案技巧',
    '科技工具': 'AI工具',
    '技术分享': 'AI工具',
    '开源项目': 'AI工具',
    '技术讨论': 'AI工具',
    '科技新闻': '行业分析',
    '综合资讯': '行业分析',
    '创业资讯': '营销策略',
    '短视频': '文案技巧',
    '新闻资讯': '行业分析',
    '产品发现': '产品设计',
    '商业分析': '营销策略',
    '港股资讯': '行业分析',
    '财经快讯': '行业分析',
    '生活分享': '文案技巧',
    '影视书籍': '文案技巧',
    '综合新闻': '行业分析',
    '设计创意': '产品设计'
  };
  
  return categoryMap[newsCategory] || '行业分析';
}

// 获取单个灵感 (开发阶段暂时移除认证)
router.get('/:id', async (req, res) => {
  try {
    const inspiration = await Inspiration.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!inspiration) {
      return res.status(404).json({
        success: false,
        message: '灵感不存在'
      });
    }

    res.json({
      success: true,
      data: inspiration
    });
  } catch (error) {
    console.error('获取灵感详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取灵感详情失败'
    });
  }
});

// 创建灵感 (开发阶段暂时移除认证)
router.post('/', async (req, res) => {
  try {
    const { error } = inspirationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const inspirationData = {
      ...req.body,
      // 开发阶段使用默认作者ID
      author: '507f1f77bcf86cd799439011'
    };

    const inspiration = new Inspiration(inspirationData);
    await inspiration.save();

    res.status(201).json({
      success: true,
      message: '灵感创建成功',
      data: inspiration
    });
  } catch (error) {
    console.error('创建灵感错误:', error);
    res.status(500).json({
      success: false,
      message: '创建灵感失败'
    });
  }
});

// 更新灵感 (开发阶段暂时移除认证)
router.put('/:id', async (req, res) => {
  try {
    const { error } = inspirationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const inspiration = await Inspiration.findOneAndUpdate(
      {
        _id: req.params.id,
        isDeleted: false
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!inspiration) {
      return res.status(404).json({
        success: false,
        message: '灵感不存在'
      });
    }

    res.json({
      success: true,
      message: '灵感更新成功',
      data: inspiration
    });
  } catch (error) {
    console.error('更新灵感错误:', error);
    res.status(500).json({
      success: false,
      message: '更新灵感失败'
    });
  }
});

// 切换收藏状态 (开发阶段暂时移除认证)
router.patch('/:id/star', async (req, res) => {
  try {
    const inspiration = await Inspiration.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!inspiration) {
      return res.status(404).json({
        success: false,
        message: '灵感不存在'
      });
    }

    inspiration.isStarred = !inspiration.isStarred;
    await inspiration.save();

    res.json({
      success: true,
      message: inspiration.isStarred ? '已收藏' : '已取消收藏',
      data: { isStarred: inspiration.isStarred }
    });
  } catch (error) {
    console.error('切换收藏状态错误:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

// 删除灵感（软删除） (开发阶段暂时移除认证)
router.delete('/:id', async (req, res) => {
  try {
    const inspiration = await Inspiration.findOneAndUpdate(
      {
        _id: req.params.id,
        isDeleted: false
      },
      { isDeleted: true },
      { new: true }
    );

    if (!inspiration) {
      return res.status(404).json({
        success: false,
        message: '灵感不存在'
      });
    }

    res.json({
      success: true,
      message: '灵感删除成功'
    });
  } catch (error) {
    console.error('删除灵感错误:', error);
    res.status(500).json({
      success: false,
      message: '删除灵感失败'
    });
  }
});

// 获取统计数据 (开发阶段暂时移除认证)
router.get('/stats/overview', async (req, res) => {
  try {
    const [
      totalCount,
      todayCount,
      weekCount,
      completedCount,
      starredCount
    ] = await Promise.all([
      Inspiration.countDocuments({ isDeleted: false }),
      Inspiration.countDocuments({
        isDeleted: false,
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      Inspiration.countDocuments({
        isDeleted: false,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      Inspiration.countDocuments({
        isDeleted: false,
        status: '已完成'
      }),
      Inspiration.countDocuments({
        isDeleted: false,
        isStarred: true
      })
    ]);

    res.json({
      success: true,
      data: {
        total: totalCount,
        today: todayCount,
        week: weekCount,
        completed: completedCount,
        starred: starredCount,
        conversionRate: totalCount > 0 ? ((completedCount / totalCount) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
});

module.exports = router;