const express = require('express');
const Content = require('../models/Content');
const Inspiration = require('../models/Inspiration');
const { auth } = require('../middleware/auth');

const router = express.Router();

// 获取概览统计
router.get('/overview', auth, async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    // 计算时间范围
    let startDate;
    switch (timeRange) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    const [
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      publishedCount,
      newFollowers
    ] = await Promise.all([
      Content.aggregate([
        { $match: { author: req.user._id, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$analytics.totalViews' } } }
      ]),
      Content.aggregate([
        { $match: { author: req.user._id, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$analytics.totalLikes' } } }
      ]),
      Content.aggregate([
        { $match: { author: req.user._id, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$analytics.totalComments' } } }
      ]),
      Content.aggregate([
        { $match: { author: req.user._id, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$analytics.totalShares' } } }
      ]),
      Content.countDocuments({
        author: req.user._id,
        status: 'published',
        publishedAt: { $gte: startDate },
        isDeleted: false
      }),
      // 新增粉丝数据 - 暂时返回0，等待真实数据源
      0
    ]);

    const stats = {
      totalViews: totalViews[0]?.total || 0,
      totalLikes: totalLikes[0]?.total || 0,
      totalComments: totalComments[0]?.total || 0,
      totalShares: totalShares[0]?.total || 0,
      publishedCount,
      newFollowers,
      conversionRate: totalViews[0]?.total > 0 ? 
        ((totalLikes[0]?.total || 0) / (totalViews[0]?.total || 1) * 100).toFixed(2) : 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取概览统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
});

// 获取平台数据分析
router.get('/platforms', auth, async (req, res) => {
  try {
    const platformStats = await Content.aggregate([
      { $match: { author: req.user._id, isDeleted: false } },
      { $unwind: '$platforms' },
      {
        $group: {
          _id: '$platforms.name',
          totalViews: { $sum: '$platforms.metrics.views' },
          totalLikes: { $sum: '$platforms.metrics.likes' },
          totalComments: { $sum: '$platforms.metrics.comments' },
          totalShares: { $sum: '$platforms.metrics.shares' },
          contentCount: { $sum: 1 }
        }
      },
      {
        $project: {
          platform: '$_id',
          totalViews: 1,
          totalLikes: 1,
          totalComments: 1,
          totalShares: 1,
          contentCount: 1,
          avgViews: { $divide: ['$totalViews', '$contentCount'] }
        }
      },
      { $sort: { totalViews: -1 } }
    ]);

    res.json({
      success: true,
      data: platformStats
    });
  } catch (error) {
    console.error('获取平台数据错误:', error);
    res.status(500).json({
      success: false,
      message: '获取平台数据失败'
    });
  }
});

// 获取内容表现排行
router.get('/content-performance', auth, async (req, res) => {
  try {
    const { limit = 10, sortBy = 'totalViews' } = req.query;

    const contents = await Content.find({
      author: req.user._id,
      status: 'published',
      isDeleted: false
    })
    .select('title category publishedAt analytics platforms')
    .sort({ [`analytics.${sortBy}`]: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: contents
    });
  } catch (error) {
    console.error('获取内容表现错误:', error);
    res.status(500).json({
      success: false,
      message: '获取内容表现数据失败'
    });
  }
});

// 获取趋势数据
router.get('/trends', auth, async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    let days;
    switch (timeRange) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      default: days = 7;
    }

    const trendData = await Content.aggregate([
      {
        $match: {
          author: req.user._id,
          publishedAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$publishedAt'
            }
          },
          views: { $sum: '$analytics.totalViews' },
          likes: { $sum: '$analytics.totalLikes' },
          comments: { $sum: '$analytics.totalComments' },
          shares: { $sum: '$analytics.totalShares' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    console.error('获取趋势数据错误:', error);
    res.status(500).json({
      success: false,
      message: '获取趋势数据失败'
    });
  }
});

// 获取用户画像数据
router.get('/audience', auth, async (req, res) => {
  try {
    // 用户画像数据 - 暂时返回空数据，等待真实数据源集成
    const audienceData = {
      totalFollowers: 0,
      activeUsers: 0,
      userRetention: '0.0',
      ageDistribution: [],
      occupationDistribution: [],
      genderDistribution: [],
      message: '用户画像数据需要集成真实的社交媒体API'
    };

    res.json({
      success: true,
      data: audienceData
    });
  } catch (error) {
    console.error('获取用户画像错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户画像失败'
    });
  }
});

// 导出数据
router.get('/export', auth, async (req, res) => {
  try {
    const { type = 'all', format = 'json' } = req.query;

    let data = {};

    if (type === 'all' || type === 'content') {
      data.contents = await Content.find({
        author: req.user._id,
        isDeleted: false
      }).select('-__v');
    }

    if (type === 'all' || type === 'inspiration') {
      data.inspirations = await Inspiration.find({
        author: req.user._id,
        isDeleted: false
      }).select('-__v');
    }

    if (format === 'csv') {
      // 这里可以实现CSV格式导出
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-data.csv');
      // 简化处理，实际应该转换为CSV格式
      res.send('CSV格式导出功能开发中...');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-data.json');
      res.json({
        success: true,
        exportTime: new Date().toISOString(),
        data
      });
    }
  } catch (error) {
    console.error('导出数据错误:', error);
    res.status(500).json({
      success: false,
      message: '导出数据失败'
    });
  }
});

module.exports = router;