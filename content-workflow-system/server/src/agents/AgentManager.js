/**
 * Agent 管理器
 * 负责 Agent 的注册、调度和监控
 */

const { logger } = require('../config/logger');
const { config } = require('../config/environment');

class AgentManager {
  constructor() {
    this.agents = new Map();
    this.runningTasks = new Map();
    this.taskQueue = [];
    this.isProcessing = false;
    this.maxConcurrentTasks = config.get('MAX_CONCURRENT_AGENTS') || 5;
    this.workflowManager = null;
    
    logger.info('Agent 管理器初始化', {
      maxConcurrentTasks: this.maxConcurrentTasks,
      type: 'agent_manager_lifecycle'
    });
  }

  /**
   * 设置工作流管理器
   */
  setWorkflowManager(workflowManager) {
    this.workflowManager = workflowManager;
    
    // 为所有 Agent 设置事件总线
    this.agents.forEach(agent => {
      if (agent.setEventBus) {
        agent.setEventBus(workflowManager.eventBus);
      }
    });
    
    logger.info('工作流管理器已设置', {
      agentCount: this.agents.size,
      type: 'workflow_integration'
    });
  }

  // 注册 Agent
  register(agent) {
    if (this.agents.has(agent.name)) {
      throw new Error(`Agent ${agent.name} 已存在`);
    }
    
    this.agents.set(agent.name, agent);
    
    // 监听 Agent 事件
    agent.on('start', (data) => {
      this.runningTasks.set(data.executionId, {
        agentName: agent.name,
        startTime: Date.now(),
        ...data
      });
    });
    
    agent.on('success', (data) => {
      this.runningTasks.delete(data.executionId);
    });
    
    agent.on('error', (data) => {
      this.runningTasks.delete(data.executionId);
    });
    
    logger.info(`Agent 注册成功: ${agent.name}`, {
      agentId: agent.id,
      agentName: agent.name,
      totalAgents: this.agents.size,
      type: 'agent_registration'
    });
  }

  // 注销 Agent
  unregister(agentName) {
    const agent = this.agents.get(agentName);
    if (agent) {
      agent.stop();
      this.agents.delete(agentName);
      
      logger.info(`Agent 注销成功: ${agentName}`, {
        agentName,
        totalAgents: this.agents.size,
        type: 'agent_unregistration'
      });
    }
  }

  // 获取 Agent
  getAgent(agentName) {
    return this.agents.get(agentName);
  }

  // 执行 Agent 任务
  async executeAgent(agentName, input, context = {}) {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} 不存在`);
    }

    // 检查并发限制
    if (this.runningTasks.size >= this.maxConcurrentTasks) {
      logger.warn('达到最大并发限制，任务加入队列', {
        agentName,
        currentTasks: this.runningTasks.size,
        maxConcurrent: this.maxConcurrentTasks,
        queueLength: this.taskQueue.length
      });
      
      return this.queueTask(agentName, input, context);
    }

    return agent.run(input, context);
  }

  // 任务队列处理
  async queueTask(agentName, input, context) {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({
        agentName,
        input,
        context,
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      this.processQueue();
    });
  }

  // 处理队列
  async processQueue() {
    if (this.isProcessing || this.taskQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    while (this.taskQueue.length > 0 && this.runningTasks.size < this.maxConcurrentTasks) {
      const task = this.taskQueue.shift();
      
      try {
        const result = await this.executeAgent(task.agentName, task.input, task.context);
        task.resolve(result);
      } catch (error) {
        task.reject(error);
      }
    }
    
    this.isProcessing = false;
  }

  // 批量执行 Agent
  async executeBatch(tasks) {
    const results = [];
    const errors = [];
    
    logger.info('开始批量执行 Agent 任务', {
      taskCount: tasks.length,
      type: 'agent_batch_execution'
    });
    
    const promises = tasks.map(async (task, index) => {
      try {
        const result = await this.executeAgent(task.agentName, task.input, task.context);
        results[index] = { success: true, result };
      } catch (error) {
        errors[index] = { success: false, error: error.message };
        results[index] = { success: false, error: error.message };
      }
    });
    
    await Promise.allSettled(promises);
    
    logger.info('批量执行完成', {
      totalTasks: tasks.length,
      successCount: results.filter(r => r.success).length,
      errorCount: errors.length,
      type: 'agent_batch_completion'
    });
    
    return results;
  }

  // 工作流执行 - Agent 链式调用
  async executeWorkflow(workflow) {
    const { name, steps } = workflow;
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    logger.info(`开始执行工作流: ${name}`, {
      workflowId,
      workflowName: name,
      stepCount: steps.length,
      type: 'workflow_execution_start'
    });
    
    let context = { workflowId, workflowName: name };
    let previousResult = null;
    
    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepInput = step.usesPreviousResult ? previousResult : step.input;
        
        logger.info(`执行工作流步骤: ${step.agentName}`, {
          workflowId,
          stepIndex: i,
          stepName: step.name || step.agentName,
          agentName: step.agentName
        });
        
        const result = await this.executeAgent(step.agentName, stepInput, {
          ...context,
          stepIndex: i,
          stepName: step.name || step.agentName
        });
        
        previousResult = result;
        
        // 如果步骤定义了结果处理器
        if (step.resultProcessor) {
          previousResult = step.resultProcessor(result);
        }
      }
      
      logger.info(`工作流执行成功: ${name}`, {
        workflowId,
        workflowName: name,
        type: 'workflow_execution_success'
      });
      
      return previousResult;
      
    } catch (error) {
      logger.error(`工作流执行失败: ${name}`, {
        workflowId,
        workflowName: name,
        error: error.message,
        type: 'workflow_execution_error'
      }, error);
      
      throw error;
    }
  }

  // 获取所有 Agent 状态
  getAllAgentStatus() {
    const agentStatuses = [];
    
    for (const [name, agent] of this.agents) {
      agentStatuses.push(agent.getStatus());
    }
    
    return {
      totalAgents: this.agents.size,
      runningTasks: this.runningTasks.size,
      queuedTasks: this.taskQueue.length,
      maxConcurrentTasks: this.maxConcurrentTasks,
      agents: agentStatuses
    };
  }

  // 健康检查
  async healthCheck() {
    const agentHealths = [];
    
    for (const [name, agent] of this.agents) {
      try {
        const health = await agent.healthCheck();
        agentHealths.push(health);
      } catch (error) {
        agentHealths.push({
          name,
          status: 'unhealthy',
          message: `健康检查失败: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    const unhealthyCount = agentHealths.filter(h => h.status === 'unhealthy').length;
    
    return {
      name: 'agent_manager',
      status: unhealthyCount === 0 ? 'healthy' : 'degraded',
      message: `${this.agents.size} 个 Agent，${unhealthyCount} 个不健康`,
      timestamp: new Date().toISOString(),
      details: {
        totalAgents: this.agents.size,
        healthyAgents: agentHealths.filter(h => h.status === 'healthy').length,
        unhealthyAgents: unhealthyCount,
        runningTasks: this.runningTasks.size,
        queuedTasks: this.taskQueue.length,
        agents: agentHealths
      }
    };
  }

  // 停止所有 Agent
  async stopAll() {
    logger.info('停止所有 Agent', {
      agentCount: this.agents.size,
      type: 'agent_manager_shutdown'
    });
    
    const stopPromises = [];
    for (const [name, agent] of this.agents) {
      stopPromises.push(agent.stop());
    }
    
    await Promise.allSettled(stopPromises);
    this.agents.clear();
    this.runningTasks.clear();
    this.taskQueue.length = 0;
  }
}

// 创建全局 Agent 管理器实例
const agentManager = new AgentManager();

module.exports = {
  AgentManager,
  agentManager
};
