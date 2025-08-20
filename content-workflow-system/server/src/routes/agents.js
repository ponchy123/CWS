/**
 * Agent 系统 API 路由
 * 提供 Agent 执行、管理和监控的 REST API
 */

const express = require('express');
const { agentManager } = require('../agents');
const { createWorkflows } = require('../agents');
const { logger } = require('../config/logger');

const router = express.Router();

// 获取所有 Agent 状态
router.get('/status', async (req, res) => {
  try {
    const status = agentManager.getAllAgentStatus();
    
    logger.info('获取 Agent 状态', {
      totalAgents: status.totalAgents,
      runningTasks: status.runningTasks,
      type: 'agent_status_request'
    });
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('获取 Agent 状态失败', {
      error: error.message
    }, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 执行单个 Agent
router.post('/execute/:agentName', async (req, res) => {
  const { agentName } = req.params;
  const { input, context = {} } = req.body;
  
  try {
    logger.info(`执行 Agent: ${agentName}`, {
      agentName,
      hasInput: !!input,
      type: 'agent_execute_request'
    });
    
    const result = await agentManager.executeAgent(agentName, input, context);
    
    res.json({
      success: true,
      data: result,
      agentName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Agent 执行失败: ${agentName}`, {
      agentName,
      error: error.message
    }, error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      agentName
    });
  }
});

// 批量执行 Agent
router.post('/batch', async (req, res) => {
  const { tasks } = req.body;
  
  if (!Array.isArray(tasks)) {
    return res.status(400).json({
      success: false,
      error: '任务列表必须是数组格式'
    });
  }
  
  try {
    logger.info('批量执行 Agent 任务', {
      taskCount: tasks.length,
      type: 'agent_batch_request'
    });
    
    const results = await agentManager.executeBatch(tasks);
    
    res.json({
      success: true,
      data: results,
      taskCount: tasks.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('批量执行失败', {
      error: error.message,
      taskCount: tasks.length
    }, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 执行工作流
router.post('/workflow/:workflowName', async (req, res) => {
  const { workflowName } = req.params;
  const { input = {} } = req.body;
  
  try {
    const workflows = createWorkflows();
    const workflow = workflows[workflowName];
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: `工作流 ${workflowName} 不存在`,
        availableWorkflows: Object.keys(workflows)
      });
    }
    
    logger.info(`执行工作流: ${workflowName}`, {
      workflowName,
      stepCount: workflow.steps.length,
      type: 'workflow_execute_request'
    });
    
    // 为工作流步骤注入输入数据
    const workflowWithInput = {
      ...workflow,
      steps: workflow.steps.map(step => ({
        ...step,
        input: step.input || input
      }))
    };
    
    const result = await agentManager.executeWorkflow(workflowWithInput);
    
    res.json({
      success: true,
      data: result,
      workflowName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`工作流执行失败: ${workflowName}`, {
      workflowName,
      error: error.message
    }, error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      workflowName
    });
  }
});

// 获取可用工作流列表
router.get('/workflows', (req, res) => {
  try {
    const workflows = createWorkflows();
    const workflowList = Object.entries(workflows).map(([name, workflow]) => ({
      name,
      displayName: workflow.name,
      stepCount: workflow.steps.length,
      steps: workflow.steps.map(step => ({
        name: step.name,
        agentName: step.agentName,
        usesPreviousResult: step.usesPreviousResult
      }))
    }));
    
    res.json({
      success: true,
      data: workflowList,
      count: workflowList.length
    });
  } catch (error) {
    logger.error('获取工作流列表失败', {
      error: error.message
    }, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Agent 健康检查
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await agentManager.healthCheck();
    
    const httpStatus = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 206 : 503;
    
    res.status(httpStatus).json({
      success: healthStatus.status !== 'unhealthy',
      data: healthStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Agent 健康检查失败', {
      error: error.message
    }, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取特定 Agent 的详细信息
router.get('/:agentName', (req, res) => {
  const { agentName } = req.params;
  
  try {
    const agent = agentManager.getAgent(agentName);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent ${agentName} 不存在`
      });
    }
    
    const status = agent.getStatus();
    
    res.json({
      success: true,
      data: status,
      agentName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`获取 Agent 信息失败: ${agentName}`, {
      agentName,
      error: error.message
    }, error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      agentName
    });
  }
});

// 内容分析 Agent 专用接口
router.post('/content-analysis', async (req, res) => {
  const { content, analysisTypes = ['sentiment', 'keywords', 'summary'] } = req.body;
  
  if (!content) {
    return res.status(400).json({
      success: false,
      error: '需要提供要分析的内容'
    });
  }
  
  try {
    const result = await agentManager.executeAgent('content_analysis', {
      content,
      analysisTypes
    });
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('内容分析失败', {
      contentLength: content.length,
      analysisTypes,
      error: error.message
    }, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 热点监控 Agent 专用接口
router.post('/hot-topics', async (req, res) => {
  const { 
    platforms = ['weibo', 'zhihu'], 
    limit = 20, 
    category, 
    timeRange = '1h' 
  } = req.body;
  
  try {
    const result = await agentManager.executeAgent('hot_topics', {
      platforms,
      limit,
      category,
      timeRange
    });
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('热点监控失败', {
      platforms,
      limit,
      category,
      error: error.message
    }, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 发布调度 Agent 专用接口
router.post('/publish-schedule', async (req, res) => {
  const { 
    content, 
    platforms, 
    scheduleType = 'optimal', 
    customTime, 
    priority = 'normal' 
  } = req.body;
  
  if (!content || !platforms) {
    return res.status(400).json({
      success: false,
      error: '需要提供内容和发布平台'
    });
  }
  
  try {
    const result = await agentManager.executeAgent('publish_scheduler', {
      content,
      platforms,
      scheduleType,
      customTime,
      priority
    });
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('发布调度失败', {
      platforms,
      scheduleType,
      priority,
      error: error.message
    }, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 用户行为分析 Agent 专用接口
router.post('/user-behavior', async (req, res) => {
  const { 
    userId, 
    sessionId, 
    analysisType = 'profile', 
    timeRange = '7d',
    includeRecommendations = true 
  } = req.body;
  
  if (!userId && !sessionId) {
    return res.status(400).json({
      success: false,
      error: '需要提供用户ID或会话ID'
    });
  }
  
  try {
    const result = await agentManager.executeAgent('user_behavior', {
      userId,
      sessionId,
      analysisType,
      timeRange,
      includeRecommendations
    });
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('用户行为分析失败', {
      userId,
      sessionId,
      analysisType,
      error: error.message
    }, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 内容管理 Agent 专用接口
router.post('/content-management', async (req, res) => {
  const { 
    operation = 'create',
    title,
    content,
    category,
    tags,
    userId = '507f1f77bcf86cd799439011' // 默认用户ID
  } = req.body;
  
  if (!title && !content && operation !== 'search') {
    return res.status(400).json({
      success: false,
      error: '需要提供标题或内容'
    });
  }
  
  try {
    const result = await agentManager.executeAgent('content_management', {
      operation,
      title,
      content,
      category,
      tags,
      userId
    });
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('内容管理失败', {
      operation,
      title: title?.substring(0, 50),
      error: error.message
    }, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 智能推荐接口
router.post('/recommendations/:userId', async (req, res) => {
  const { userId } = req.params;
  const { timeRange = '7d', contentLimit = 10 } = req.body;
  
  try {
    // 执行个性化推荐工作流
    const workflow = createWorkflows().personalizationWorkflow;
    
    // 为工作流注入用户ID
    const workflowWithUser = {
      ...workflow,
      steps: workflow.steps.map(step => ({
        ...step,
        input: step.agentName === 'user_behavior' 
          ? { userId, analysisType: step.name === 'analyze_user_behavior' ? 'profile' : 'recommendation', timeRange }
          : step.input
      }))
    };
    
    const result = await agentManager.executeWorkflow(workflowWithUser);
    
    res.json({
      success: true,
      data: {
        userId,
        recommendations: result,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('智能推荐失败', {
      userId,
      error: error.message
    }, error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;