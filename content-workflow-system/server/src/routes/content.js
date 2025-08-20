const express = require('express');
const Joi = require('joi');
const Content = require('../models/Content');
const { auth } = require('../middleware/auth');
const { agentManager } = require('../agents');

const router = express.Router();

// 内容验证规则
const contentSchema = Joi.object({
  title: Joi.string().max(200).required().messages({
    'string.max': '标题最多200个字符',
    'any.required': '标题不能为空'
  }),
  content: Joi.string().required().messages({
    'any.required': '内容不能为空'
  }),
  summary: Joi.string().max(500).optional(),
  category: Joi.string().valid('职业发展', 'AI工具', '行业分析', '文案技巧', '产品设计', '营销策略').required(),
  tags: Joi.array().items(Joi.string()).optional(),
  platforms: Joi.array().items(Joi.object({
    name: Joi.string().valid('知乎', 'B站', '公众号', '小红书', '抖音').required(),
    status: Joi.string().valid('draft', 'scheduled', 'published', 'failed').optional()
  })).optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  scheduledAt: Joi.date().optional(),
  coverImage: Joi.string().optional(),
  seo: Joi.object({
    keywords: Joi.array().items(Joi.string()).optional(),
    description: Joi.string().optional()
  }).optional()
});

// AI自动生成内容 (无需认证，用于测试)
router.post('/generate', async (req, res) => {
  try {
    const { category, tags, inspiration, metadata } = req.body;
    
    console.log('🤖 开始AI内容生成...');
    
    // 调用ContentManagementAgentV3的AI生成功能
    const contentAgent = agentManager.getAgent('content_management');
    
    if (!contentAgent) {
      return res.status(500).json({
        success: false,
        message: 'ContentManagementAgentV3未找到'
      });
    }

    // 准备AI生成参数
    const generateParams = {
      operation: 'generateFromInspiration',
      inspiration: inspiration || '基于当前热门话题创作内容',
      category: category || '职业发展',
      tags: tags || ['AI创作', '自动生成'],
      metadata: {
        ...metadata,
        generatedBy: 'AI',
        generatedAt: new Date().toISOString()
      },
      userId: '507f1f77bcf86cd799439011' // 临时用户ID
    };

    console.log('📝 调用AI生成参数:', generateParams);

    // 执行AI内容生成
    const result = await contentAgent.execute(generateParams);
    
    if (result.success) {
      console.log('✅ AI内容生成成功:', result.data.title);
      
      res.json({
        success: true,
        message: 'AI内容生成成功',
        data: result.data
      });
    } else {
      console.log('❌ AI内容生成失败:', result.message);
      
      res.status(400).json({
        success: false,
        message: result.message || 'AI内容生成失败'
      });
    }

  } catch (error) {
    console.error('AI内容生成异常:', error);
    res.status(500).json({
      success: false,
      message: 'AI内容生成异常',
      error: error.message
    });
  }
});

// 获取内容列表 (移除认证要求用于测试)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50, // 增加默认限制到50条
      status,
      category,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // 构建查询条件 - 修复查询条件
    const query = {
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    };

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      });
    }

    console.log('🔍 查询条件:', JSON.stringify(query, null, 2));

    // 排序
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [contents, total] = await Promise.all([
      Content.find(query)
        .populate('author', 'username avatar')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Content.countDocuments(query)
    ]);

    console.log('📊 查询结果: 找到', contents.length, '条内容，总计', total, '条');

    res.json({
      success: true,
      data: {
        contents,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取内容列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取内容列表失败'
    });
  }
});

// 获取单个内容 (移除认证要求用于测试)
router.get('/:id', async (req, res) => {
  try {
    const content = await Content.findOne({
      _id: req.params.id,
      isDeleted: false
    }).populate('author', 'username avatar');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('获取内容详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取内容详情失败'
    });
  }
});

// 创建内容 (移除认证要求用于测试)
router.post('/', async (req, res) => {
  try {
    const { error } = contentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const contentData = {
      ...req.body,
      author: '507f1f77bcf86cd799439011' // 临时用户ID
    };

    const content = new Content(contentData);
    await content.save();
    await content.populate('author', 'username avatar');

    res.status(201).json({
      success: true,
      message: '内容创建成功',
      data: content
    });
  } catch (error) {
    console.error('创建内容错误:', error);
    res.status(500).json({
      success: false,
      message: '创建内容失败'
    });
  }
});

// 更新内容 (移除认证要求用于测试)
router.put('/:id', async (req, res) => {
  try {
    const { error } = contentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const content = await Content.findOneAndUpdate(
      {
        _id: req.params.id,
        isDeleted: false
      },
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'username avatar');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }

    res.json({
      success: true,
      message: '内容更新成功',
      data: content
    });
  } catch (error) {
    console.error('更新内容错误:', error);
    res.status(500).json({
      success: false,
      message: '更新内容失败'
    });
  }
});

// 删除内容（软删除） (移除认证要求用于测试)
router.delete('/:id', async (req, res) => {
  try {
    const content = await Content.findOneAndUpdate(
      {
        _id: req.params.id,
        isDeleted: false
      },
      { isDeleted: true },
      { new: true }
    );

    if (!content) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }

    res.json({
      success: true,
      message: '内容删除成功'
    });
  } catch (error) {
    console.error('删除内容错误:', error);
    res.status(500).json({
      success: false,
      message: '删除内容失败'
    });
  }
});

// 批量操作 (移除认证要求用于测试)
router.post('/batch', async (req, res) => {
  try {
    const { action, ids } = req.body;

    if (!action || !ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: '参数错误'
      });
    }

    let updateData = {};
    switch (action) {
      case 'delete':
        updateData = { isDeleted: true };
        break;
      case 'publish':
        updateData = { status: 'published', publishedAt: new Date() };
        break;
      case 'archive':
        updateData = { status: 'archived' };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '不支持的操作'
        });
    }

    const result = await Content.updateMany(
      {
        _id: { $in: ids },
        isDeleted: false
      },
      updateData
    );

    res.json({
      success: true,
      message: `批量操作成功，影响 ${result.modifiedCount} 条记录`
    });
  } catch (error) {
    console.error('批量操作错误:', error);
    res.status(500).json({
      success: false,
      message: '批量操作失败'
    });
  }
});

module.exports = router;