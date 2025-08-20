const express = require('express');
const Content = require('../models/Content');
const { auth } = require('../middleware/auth');
const cron = require('node-cron');

const router = express.Router();

// 获取发布任务列表
router.get('/tasks', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      platform,
      priority,
      search
    } = req.query;

    // 构建查询条件
    const query = {
      author: req.user._id,
      isDeleted: false
    };

    if (status) {
      query['platforms.status'] = status;
    }
    if (platform) {
      query['platforms.name'] = platform;
    }
    if (priority) {
      query.priority = priority;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tasks, total] = await Promise.all([
      Content.find(query)
        .populate('author', 'username avatar')
        .sort({ scheduledAt: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Content.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取发布任务错误:', error);
    res.status(500).json({
      success: false,
      message: '获取发布任务失败'
    });
  }
});

// 创建发布任务
router.post('/tasks', auth, async (req, res) => {
  try {
    const {
      contentId,
      platforms,
      scheduledAt,
      priority = 'medium'
    } = req.body;

    if (!contentId || !platforms || !Array.isArray(platforms)) {
      return res.status(400).json({
        success: false,
        message: '参数错误'
      });
    }

    const content = await Content.findOne({
      _id: contentId,
      author: req.user._id,
      isDeleted: false
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }

    // 更新内容的发布平台信息
    content.platforms = platforms.map(platform => ({
      name: platform.name,
      status: scheduledAt ? 'scheduled' : 'draft'
    }));
    content.priority = priority;
    if (scheduledAt) {
      content.scheduledAt = new Date(scheduledAt);
    }

    await content.save();

    res.json({
      success: true,
      message: '发布任务创建成功',
      data: content
    });
  } catch (error) {
    console.error('创建发布任务错误:', error);
    res.status(500).json({
      success: false,
      message: '创建发布任务失败'
    });
  }
});

// 立即发布
router.post('/tasks/:id/publish', auth, async (req, res) => {
  try {
    const { platforms } = req.body;

    const content = await Content.findOne({
      _id: req.params.id,
      author: req.user._id,
      isDeleted: false
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }

    // 模拟发布过程
    const publishResults = [];
    
    for (const platformName of platforms || content.platforms.map(p => p.name)) {
      try {
        // 这里应该调用实际的平台API
        const result = await simulatePublish(content, platformName);
        
        // 更新平台状态
        const platformIndex = content.platforms.findIndex(p => p.name === platformName);
        if (platformIndex !== -1) {
          content.platforms[platformIndex].status = 'published';
          content.platforms[platformIndex].publishedAt = new Date();
          content.platforms[platformIndex].url = result.url;
          content.platforms[platformIndex].metrics = {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0
          };
        } else {
          content.platforms.push({
            name: platformName,
            status: 'published',
            publishedAt: new Date(),
            url: result.url,
            metrics: { views: 0, likes: 0, comments: 0, shares: 0 }
          });
        }

        publishResults.push({
          platform: platformName,
          success: true,
          url: result.url
        });
      } catch (error) {
        // 发布失败
        const platformIndex = content.platforms.findIndex(p => p.name === platformName);
        if (platformIndex !== -1) {
          content.platforms[platformIndex].status = 'failed';
        }

        publishResults.push({
          platform: platformName,
          success: false,
          error: error.message
        });
      }
    }

    // 更新内容状态
    const allPublished = content.platforms.every(p => p.status === 'published');
    if (allPublished) {
      content.status = 'published';
      content.publishedAt = new Date();
    }

    await content.save();

    res.json({
      success: true,
      message: '发布完成',
      data: {
        content,
        publishResults
      }
    });
  } catch (error) {
    console.error('发布内容错误:', error);
    res.status(500).json({
      success: false,
      message: '发布失败'
    });
  }
});

// 暂停发布任务
router.patch('/tasks/:id/pause', auth, async (req, res) => {
  try {
    const content = await Content.findOneAndUpdate(
      {
        _id: req.params.id,
        author: req.user._id,
        isDeleted: false
      },
      {
        $set: {
          'platforms.$[].status': 'paused'
        }
      },
      { new: true }
    );

    if (!content) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    res.json({
      success: true,
      message: '任务已暂停',
      data: content
    });
  } catch (error) {
    console.error('暂停任务错误:', error);
    res.status(500).json({
      success: false,
      message: '暂停任务失败'
    });
  }
});

// 恢复发布任务
router.patch('/tasks/:id/resume', auth, async (req, res) => {
  try {
    const content = await Content.findOne({
      _id: req.params.id,
      author: req.user._id,
      isDeleted: false
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    // 恢复为计划状态
    content.platforms.forEach(platform => {
      if (platform.status === 'paused') {
        platform.status = content.scheduledAt ? 'scheduled' : 'draft';
      }
    });

    await content.save();

    res.json({
      success: true,
      message: '任务已恢复',
      data: content
    });
  } catch (error) {
    console.error('恢复任务错误:', error);
    res.status(500).json({
      success: false,
      message: '恢复任务失败'
    });
  }
});

// 重试失败的发布任务
router.post('/tasks/:id/retry', auth, async (req, res) => {
  try {
    const { platforms } = req.body;

    const content = await Content.findOne({
      _id: req.params.id,
      author: req.user._id,
      isDeleted: false
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }

    // 只重试失败的平台
    const failedPlatforms = platforms || 
      content.platforms.filter(p => p.status === 'failed').map(p => p.name);

    if (failedPlatforms.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有需要重试的平台'
      });
    }

    // 重新发布
    const retryResults = [];
    
    for (const platformName of failedPlatforms) {
      try {
        const result = await simulatePublish(content, platformName);
        
        const platformIndex = content.platforms.findIndex(p => p.name === platformName);
        if (platformIndex !== -1) {
          content.platforms[platformIndex].status = 'published';
          content.platforms[platformIndex].publishedAt = new Date();
          content.platforms[platformIndex].url = result.url;
        }

        retryResults.push({
          platform: platformName,
          success: true,
          url: result.url
        });
      } catch (error) {
        retryResults.push({
          platform: platformName,
          success: false,
          error: error.message
        });
      }
    }

    await content.save();

    res.json({
      success: true,
      message: '重试完成',
      data: {
        content,
        retryResults
      }
    });
  } catch (error) {
    console.error('重试发布错误:', error);
    res.status(500).json({
      success: false,
      message: '重试失败'
    });
  }
});

// 获取发布统计
router.get('/stats', auth, async (req, res) => {
  try {
    const [
      scheduledCount,
      publishedCount,
      failedCount,
      monthlyCount
    ] = await Promise.all([
      Content.countDocuments({
        author: req.user._id,
        'platforms.status': 'scheduled',
        isDeleted: false
      }),
      Content.countDocuments({
        author: req.user._id,
        status: 'published',
        isDeleted: false
      }),
      Content.countDocuments({
        author: req.user._id,
        'platforms.status': 'failed',
        isDeleted: false
      }),
      Content.countDocuments({
        author: req.user._id,
        status: 'published',
        publishedAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        },
        isDeleted: false
      })
    ]);

    res.json({
      success: true,
      data: {
        scheduled: scheduledCount,
        published: publishedCount,
        failed: failedCount,
        monthly: monthlyCount
      }
    });
  } catch (error) {
    console.error('获取发布统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
});

// 模拟发布函数
async function simulatePublish(content, platform) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // 模拟发布成功/失败
  if (Math.random() > 0.1) { // 90% 成功率
    return {
      success: true,
      url: `https://${platform.toLowerCase()}.com/post/${Date.now()}`,
      id: `${platform}_${Date.now()}`
    };
  } else {
    throw new Error(`${platform} API 连接失败`);
  }
}

// 定时任务：检查并执行计划发布
cron.schedule('*/5 * * * *', async () => {
  try {
    // 检查MongoDB连接状态
    if (global.USE_MOCK_DATA) {
      console.log('使用模拟数据，跳过定时发布任务');
      return;
    }
    
    console.log('检查计划发布任务...');
    
    const scheduledContents = await Content.find({
      'platforms.status': 'scheduled',
      scheduledAt: { $lte: new Date() },
      isDeleted: false
    });

    for (const content of scheduledContents) {
      try {
        const scheduledPlatforms = content.platforms
          .filter(p => p.status === 'scheduled')
          .map(p => p.name);

        // 执行发布
        for (const platformName of scheduledPlatforms) {
          try {
            const result = await simulatePublish(content, platformName);
            
            const platformIndex = content.platforms.findIndex(p => p.name === platformName);
            if (platformIndex !== -1) {
              content.platforms[platformIndex].status = 'published';
              content.platforms[platformIndex].publishedAt = new Date();
              content.platforms[platformIndex].url = result.url;
            }
          } catch (error) {
            const platformIndex = content.platforms.findIndex(p => p.name === platformName);
            if (platformIndex !== -1) {
              content.platforms[platformIndex].status = 'failed';
            }
          }
        }

        // 更新内容状态
        const allPublished = content.platforms.every(p => 
          p.status === 'published' || p.status === 'failed'
        );
        if (allPublished) {
          content.status = 'published';
          content.publishedAt = new Date();
        }

        await content.save();
        console.log(`内容 ${content.title} 发布完成`);
      } catch (error) {
        console.error(`发布内容 ${content.title} 失败:`, error);
      }
    }
  } catch (error) {
    console.error('定时发布任务错误:', error);
  }
});

module.exports = router;