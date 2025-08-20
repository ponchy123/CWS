/**
 * 工作流路由
 * 提供工作流管理和执行的 API 接口
 */

const express = require('express');
const { getInstance } = require('../workflow');
const { logger } = require('../config/logger');
const { auth } = require('../middleware/auth');

const router = express.Router();

// 获取工作流系统实例
const getWorkflowSystem = () => {
  return getInstance();
};

/**
 * 获取所有工作流定义
 */
router.get('/workflows', async (req, res) => {
  try {
    const workflowSystem = getWorkflowSystem();
    const workflows = workflowSystem.getWorkflowEngine().getWorkflows();
    
    // 转换工作流数据为更友好的格式
    const workflowList = Object.entries(workflows).map(([id, definition]) => ({
      id,
      name: definition.name || id,
      displayName: definition.name || id,
      description: definition.description || '',
      version: definition.version || '1.0.0',
      stepsCount: definition.steps ? definition.steps.length : 0,
      steps: definition.steps ? definition.steps.map(step => ({
        name: step.name,
        type: step.type,
        agentName: step.config?.agentName
      })) : []
    }));
    
    res.json({
      success: true,
      data: workflowList,
      count: workflowList.length,
      total: workflowList.length
    });
  } catch (error) {
    logger.error('获取工作流列表失败', { error: error.message }, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 执行工作流
 */
router.post('/workflows/:workflowId/execute', auth, async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { input = {}, context = {} } = req.body;
    
    const workflowSystem = getWorkflowSystem();
    
    // 添加用户上下文
    const executionContext = {
      ...context,
      userId: req.user.id,
      isAdmin: req.user.role === 'admin'
    };
    
    const result = await workflowSystem.executeWorkflow(workflowId, input, executionContext);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('工作流执行失败', {
      workflowId: req.params.workflowId,
      error: error.message
    }, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取工作流执行状态
 */
router.get('/executions/:executionId', auth, async (req, res) => {
  try {
    const { executionId } = req.params;
    const workflowSystem = getWorkflowSystem();
    
    const status = workflowSystem.getWorkflowEngine().getExecutionStatus(executionId);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('获取执行状态失败', {
      executionId: req.params.executionId,
      error: error.message
    }, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取执行历史
 */
router.get('/executions', auth, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const workflowSystem = getWorkflowSystem();
    
    const history = workflowSystem.getWorkflowEngine().getExecutionHistory(parseInt(limit));
    
    res.json({
      success: true,
      data: history,
      total: history.length
    });
  } catch (error) {
    logger.error('获取执行历史失败', { error: error.message }, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取工作流系统状态
 */
router.get('/status', auth, async (req, res) => {
  try {
    const workflowSystem = getWorkflowSystem();
    const status = workflowSystem.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('获取工作流系统状态失败', { error: error.message }, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 工作流系统健康检查
 */
router.get('/health', async (req, res) => {
  try {
    const workflowSystem = getWorkflowSystem();
    const health = await workflowSystem.healthCheck();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });
  } catch (error) {
    logger.error('工作流系统健康检查失败', { error: error.message }, error);
    res.status(503).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 注册新工作流
 */
router.post('/workflows', auth, async (req, res) => {
  try {
    const { workflowId, definition } = req.body;
    
    if (!workflowId || !definition) {
      return res.status(400).json({
        success: false,
        error: '需要提供 workflowId 和 definition'
      });
    }
    
    const workflowSystem = getWorkflowSystem();
    const registeredId = workflowSystem.getWorkflowEngine().registerWorkflow(workflowId, definition);
    
    res.json({
      success: true,
      data: {
        workflowId: registeredId,
        message: '工作流注册成功'
      }
    });
  } catch (error) {
    logger.error('工作流注册失败', {
      workflowId: req.body.workflowId,
      error: error.message
    }, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 事件总线相关接口
 */

/**
 * 发布事件
 */
router.post('/events', auth, async (req, res) => {
  try {
    const { eventType, data = {}, options = {} } = req.body;
    
    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: '需要提供 eventType'
      });
    }
    
    const workflowSystem = getWorkflowSystem();
    const eventBus = workflowSystem.getEventBus();
    
    const result = await eventBus.emit(eventType, data, {
      ...options,
      source: `user_${req.user.id}`
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('事件发布失败', {
      eventType: req.body.eventType,
      error: error.message
    }, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取事件历史
 */
router.get('/events', auth, async (req, res) => {
  try {
    const { limit = 100, eventType } = req.query;
    const workflowSystem = getWorkflowSystem();
    const eventBus = workflowSystem.getEventBus();
    
    const history = eventBus.getEventHistory(parseInt(limit), eventType);
    
    res.json({
      success: true,
      data: history,
      total: history.length
    });
  } catch (error) {
    logger.error('获取事件历史失败', { error: error.message }, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取事件统计
 */
router.get('/events/metrics', auth, async (req, res) => {
  try {
    const workflowSystem = getWorkflowSystem();
    const eventBus = workflowSystem.getEventBus();
    
    const metrics = eventBus.getMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('获取事件统计失败', { error: error.message }, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 快速工作流执行接口
 */

/**
 * 执行内容创建工作流
 */
router.post('/quick/content-creation', auth, async (req, res) => {
  try {
    const { title, content, category, tags, publishOptions } = req.body;
    
    const workflowSystem = getWorkflowSystem();
    const result = await workflowSystem.executeWorkflow('content_creation_workflow', {
      title,
      content,
      category,
      tags,
      publishOptions
    }, {
      userId: req.user.id,
      isAdmin: req.user.role === 'admin'
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('内容创建工作流执行失败', { error: error.message }, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 执行热点内容工作流
 */
router.post('/quick/trending-content', auth, async (req, res) => {
  try {
    const { platforms = ['weibo', 'zhihu'], category, limit = 10, userId } = req.body;
    
    // 确保 userId 被正确传递
    const inputUserId = userId || req.user?.id || '507f1f77bcf86cd799439011';
    
    logger.info('热点内容工作流输入参数', {
      platforms,
      category,
      limit,
      requestUserId: userId,
      authUserId: req.user?.id,
      finalUserId: inputUserId,
      type: 'trending_workflow_input'
    });
    
    const workflowSystem = getWorkflowSystem();
    const result = await workflowSystem.executeWorkflow('trending_content_workflow', {
      platforms,
      category,
      limit,
      userId: inputUserId
    }, {
      userId: req.user?.id || inputUserId,
      isAdmin: req.user?.role === 'admin'
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('热点内容工作流执行失败', { error: error.message }, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 执行用户分析工作流
 */
router.post('/quick/user-analysis', auth, async (req, res) => {
  try {
    const { timeRange = '30d', includeRecommendations = true, userId } = req.body;
    
    // 确保 userId 被正确传递
    const inputUserId = userId || req.user?.id || '507f1f77bcf86cd799439011';
    
    const workflowSystem = getWorkflowSystem();
    const result = await workflowSystem.executeWorkflow('user_analysis_workflow', {
      timeRange,
      includeRecommendations,
      userId: inputUserId
    }, {
      userId: req.user?.id || inputUserId,
      isAdmin: req.user?.role === 'admin'
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('用户分析工作流执行失败', { error: error.message }, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;