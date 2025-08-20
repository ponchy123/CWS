const express = require('express');
const router = express.Router();
const { fetchNewsNowRealData, getAvailableRealSources, getRecommendedRealSourceCombinations } = require('../utils/newsNowRealAPI-enhanced');

// 获取热点话题 - 使用 NewsNow 真实数据源
router.get('/', async (req, res) => {
  try {
    const { 
      mode = 'hottest', 
      sources = '', 
      limit = 15
    } = req.query;
    
    console.log(`🔥 获取热点话题请求 - 模式: ${mode}, 限制: ${limit}`);
    
    const targetSources = sources ? sources.split(',').filter(s => s.trim()) : [];
    
    // 直接使用真实 NewsNow 数据
    const hotTopics = await fetchNewsNowRealData(mode, targetSources, parseInt(limit));
    
    // 添加排名
    const rankedTopics = hotTopics.map((topic, index) => ({
      ...topic,
      rank: index + 1
    }));
    
    console.log(`✅ 成功获取 ${rankedTopics.length} 条${mode === 'latest' ? '最新' : '最热'}热点话题`);
    
    res.json({
      success: true,
      data: rankedTopics,
      total: rankedTopics.length,
      mode: mode,
      sources: targetSources,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ 获取热点话题失败:', error);
    res.status(500).json({
      success: false,
      message: '获取热点话题失败',
      error: error.message
    });
  }
});

// 获取可用的数据源列表
router.get('/sources', async (req, res) => {
  try {
    const availableSources = getAvailableRealSources();
    const recommendations = getRecommendedRealSourceCombinations();
    
    res.json({
      success: true,
      data: {
        sources: availableSources,
        recommendations: recommendations,
        total: availableSources.length
      },
      message: '获取数据源列表成功'
    });
  } catch (error) {
    console.error('❌ 获取数据源列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取数据源列表失败',
      error: error.message
    });
  }
});

// 获取最新热点话题
router.get('/latest', async (req, res) => {
  try {
    const { 
      sources = '', 
      limit = 15
    } = req.query;
    
    console.log(`🔥 获取最新热点话题请求 - 限制: ${limit}, 数据源: ${sources}`);
    
    const targetSources = sources ? sources.split(',').filter(s => s.trim()) : [];
    
    // 使用 latest 模式获取最新数据
    const hotTopics = await fetchNewsNowRealData('latest', targetSources, parseInt(limit));
    
    console.log(`✅ 成功获取 ${hotTopics.length} 条最新热点话题`);
    
    res.json(hotTopics);
    
  } catch (error) {
    console.error('❌ 获取最新热点话题失败:', error);
    res.status(500).json({
      success: false,
      message: '获取最新热点话题失败',
      error: error.message
    });
  }
});

// 获取最热话题
router.get('/hottest', async (req, res) => {
  try {
    const { 
      sources = '', 
      limit = 15
    } = req.query;
    
    console.log(`🔥 获取最热话题请求 - 限制: ${limit}, 数据源: ${sources}`);
    
    const targetSources = sources ? sources.split(',').filter(s => s.trim()) : [];
    
    // 使用 hottest 模式获取最热数据
    const hotTopics = await fetchNewsNowRealData('hottest', targetSources, parseInt(limit));
    
    console.log(`✅ 成功获取 ${hotTopics.length} 条最热话题`);
    
    res.json(hotTopics);
    
  } catch (error) {
    console.error('❌ 获取最热话题失败:', error);
    res.status(500).json({
      success: false,
      message: '获取最热话题失败',
      error: error.message
    });
  }
});

// 获取特定数据源的热点
router.get('/source/:sourceId', async (req, res) => {
  try {
    const { sourceId } = req.params;
    const { 
      limit = 10, 
      mode = 'hottest' 
    } = req.query;

    console.log(`🎯 获取 ${sourceId} 数据源的${mode === 'latest' ? '最新' : '最热'}话题`);

    const hotTopics = await fetchNewsNowRealData(mode, [sourceId], parseInt(limit));

    res.json({
      success: true,
      data: hotTopics,
      total: hotTopics.length,
      source: sourceId,
      mode: mode,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ 获取 ${req.params.sourceId} 数据源失败:`, error);
    res.status(500).json({
      success: false,
      message: `获取 ${req.params.sourceId} 数据源失败`,
      error: error.message
    });
  }
});

// 手动获取热点话题 - 前端调用的 fetch 端点
router.post('/fetch', async (req, res) => {
  try {
    const { 
      mode = 'hottest', 
      sources = [], 
      limit = 15
    } = req.body;
    
    console.log(`🔥 手动获取热点话题请求 - 模式: ${mode}, 数据源: ${sources.join(',')}, 限制: ${limit}`);
    
    // 直接使用真实 NewsNow 数据
    const hotTopics = await fetchNewsNowRealData(mode, sources, parseInt(limit));
    
    // 添加排名
    const rankedTopics = hotTopics.map((topic, index) => ({
      ...topic,
      rank: index + 1
    }));
    
    console.log(`✅ 成功获取 ${rankedTopics.length} 条${mode === 'latest' ? '最新' : '最热'}热点话题`);
    
    res.json({
      success: true,
      data: rankedTopics,
      total: rankedTopics.length,
      mode: mode,
      sources: sources,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ 手动获取热点话题失败:', error);
    res.status(500).json({
      success: false,
      message: '获取热点话题失败',
      error: error.message
    });
  }
});

module.exports = router;
