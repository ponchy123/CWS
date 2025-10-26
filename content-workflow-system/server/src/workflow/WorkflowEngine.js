/**
 * 工作流引擎 - Agent 间任务编排和协作核心
 */
class WorkflowEngine {
  constructor() {
    this.workflows = new Map();
    this.runningInstances = new Map();
    this.eventBus = null;
    try {
      this.logger = require('../config/logger').logger || require('../config/logger');
    } catch (error) {
      // 使用默认日志器
      this.logger = {
        info: console.log,
        warn: console.warn,
        error: console.error,
        debug: console.log
      };
    }
  }

  /**
   * 设置事件总线
   */
  setEventBus(eventBus) {
    this.eventBus = eventBus;
  }

  /**
   * 注册工作流定义
   */
  registerWorkflow(workflowId, definition) {
    this.workflows.set(workflowId, {
      id: workflowId,
      name: definition.name,
      description: definition.description,
      steps: definition.steps,
      conditions: definition.conditions || {},
      retryPolicy: definition.retryPolicy || { maxRetries: 3, delay: 1000 },
      timeout: definition.timeout || 30000,
      createdAt: new Date()
    });
    
    this.logger.info(`工作流已注册: ${workflowId}`);
  }

  /**
   * 启动工作流实例
   */
  async startWorkflow(workflowId, initialData = {}, options = {}) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`工作流不存在: ${workflowId}`);
    }

    const instanceId = `${workflowId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const instance = {
      id: instanceId,
      workflowId,
      status: 'running',
      currentStep: 0,
      data: { ...initialData },
      context: {
        startTime: new Date(),
        userId: options.userId,
        priority: options.priority || 'normal'
      },
      history: [],
      errors: []
    };

    this.runningInstances.set(instanceId, instance);
    
    try {
      await this.executeWorkflow(instance);
      return instanceId;
    } catch (error) {
      instance.status = 'failed';
      instance.errors.push({
        step: instance.currentStep,
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * 执行工作流
   */
  async executeWorkflow(instance) {
    const workflow = this.workflows.get(instance.workflowId);
    
    while (instance.currentStep < workflow.steps.length) {
      const step = workflow.steps[instance.currentStep];
      
      try {
        this.logger.info(`执行步骤: ${step.name} (实例: ${instance.id})`);
        
        // 检查条件
        if (step.condition && !this.evaluateCondition(step.condition, instance.data)) {
          this.logger.info(`跳过步骤 ${step.name}: 条件不满足`);
          instance.currentStep++;
          continue;
        }

        // 执行步骤
        const result = await this.executeStep(step, instance);
        
        // 记录历史
        instance.history.push({
          step: instance.currentStep,
          name: step.name,
          result,
          timestamp: new Date()
        });

        // 更新数据
        if (result && typeof result === 'object') {
          Object.assign(instance.data, result);
        }

        // 发送事件
        if (this.eventBus) {
          this.eventBus.emit('workflow.step.completed', {
            instanceId: instance.id,
            workflowId: instance.workflowId,
            step: step.name,
            result
          });
        }

        instance.currentStep++;
        
      } catch (error) {
        await this.handleStepError(step, instance, error);
      }
    }

    instance.status = 'completed';
    instance.context.endTime = new Date();
    
    this.logger.info(`工作流完成: ${instance.id}`);
    
    if (this.eventBus) {
      this.eventBus.emit('workflow.completed', {
        instanceId: instance.id,
        workflowId: instance.workflowId,
        duration: instance.context.endTime - instance.context.startTime
      });
    }
  }

  /**
   * 执行单个步骤
   */
  async executeStep(step, instance) {
    switch (step.type) {
      case 'agent':
        return await this.executeAgentStep(step, instance);
      case 'condition':
        return this.executeConditionStep(step, instance);
      case 'parallel':
        return await this.executeParallelStep(step, instance);
      case 'delay':
        return await this.executeDelayStep(step, instance);
      default:
        throw new Error(`未知步骤类型: ${step.type}`);
    }
  }

  /**
   * 执行 Agent 步骤
   */
  async executeAgentStep(step, instance) {
    if (!this.eventBus) {
      throw new Error('事件总线未设置');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Agent 步骤超时: ${step.agent}`));
      }, step.timeout || 30000);

      // 监听 Agent 响应
      const responseHandler = (data) => {
        if (data.instanceId === instance.id && data.step === step.name) {
          clearTimeout(timeout);
          this.eventBus.off('agent.response', responseHandler);
          
          if (data.error) {
            reject(new Error(data.error));
          } else {
            resolve(data.result);
          }
        }
      };

      this.eventBus.on('agent.response', responseHandler);

      // 发送 Agent 请求
      this.eventBus.emit('agent.request', {
        instanceId: instance.id,
        step: step.name,
        agent: step.agent,
        action: step.action,
        params: {
          ...step.params,
          ...instance.data
        }
      });
    });
  }

  /**
   * 执行条件步骤
   */
  executeConditionStep(step, instance) {
    const result = this.evaluateCondition(step.condition, instance.data);
    
    if (result && step.onTrue) {
      instance.currentStep = this.findStepIndex(step.onTrue) - 1; // -1 因为会自动 +1
    } else if (!result && step.onFalse) {
      instance.currentStep = this.findStepIndex(step.onFalse) - 1;
    }
    
    return { conditionResult: result };
  }

  /**
   * 执行并行步骤
   */
  async executeParallelStep(step, instance) {
    const promises = step.steps.map(parallelStep => 
      this.executeStep(parallelStep, instance)
    );
    
    const results = await Promise.all(promises);
    return { parallelResults: results };
  }

  /**
   * 执行延迟步骤
   */
  async executeDelayStep(step, instance) {
    await new Promise(resolve => setTimeout(resolve, step.delay));
    return { delayed: step.delay };
  }

  /**
   * 评估条件
   */
  evaluateCondition(condition, data) {
    try {
      // 简单的条件评估器
      const func = new Function('data', `return ${condition}`);
      return func(data);
    } catch (error) {
      this.logger.error(`条件评估失败: ${condition}`, error);
      return false;
    }
  }

  /**
   * 处理步骤错误
   */
  async handleStepError(step, instance, error) {
    const workflow = this.workflows.get(instance.workflowId);
    const retryPolicy = step.retryPolicy || workflow.retryPolicy;
    
    instance.errors.push({
      step: instance.currentStep,
      error: error.message,
      timestamp: new Date()
    });

    // 重试逻辑
    const stepErrors = instance.errors.filter(e => e.step === instance.currentStep);
    if (stepErrors.length <= retryPolicy.maxRetries) {
      this.logger.warn(`步骤失败，准备重试 (${stepErrors.length}/${retryPolicy.maxRetries}): ${step.name}`);
      await new Promise(resolve => setTimeout(resolve, retryPolicy.delay));
      return; // 不增加 currentStep，重试当前步骤
    }

    // 超过重试次数
    if (step.onError === 'continue') {
      this.logger.warn(`步骤失败但继续执行: ${step.name}`);
      instance.currentStep++;
    } else {
      instance.status = 'failed';
      throw error;
    }
  }

  /**
   * 获取工作流实例状态
   */
  getInstanceStatus(instanceId) {
    return this.runningInstances.get(instanceId);
  }

  /**
   * 停止工作流实例
   */
  stopWorkflow(instanceId) {
    const instance = this.runningInstances.get(instanceId);
    if (instance) {
      instance.status = 'stopped';
      instance.context.endTime = new Date();
      this.logger.info(`工作流已停止: ${instanceId}`);
    }
  }

  /**
   * 获取所有工作流定义
   */
  getWorkflows() {
    return Array.from(this.workflows.values());
  }

  /**
   * 获取运行中的实例
   */
  getRunningInstances() {
    return Array.from(this.runningInstances.values())
      .filter(instance => instance.status === 'running');
  }

  /**
   * 获取工作流指标
   */
  getMetrics() {
    const workflows = this.getWorkflows();
    const runningInstances = this.getRunningInstances();
    const statusCounts = {
      running: 0,
      completed: 0,
      failed: 0,
      stopped: 0
    };

    for (const instance of this.runningInstances.values()) {
      statusCounts[instance.status] = (statusCounts[instance.status] || 0) + 1;
    }

    return {
      totalWorkflows: workflows.length,
      runningInstances: runningInstances.length,
      instancesByStatus: statusCounts,
      registeredAt: workflows.map(workflow => ({
        id: workflow.id,
        registeredAt: workflow.createdAt
      }))
    };
  }

  /**
   * 查找步骤索引
   */
  findStepIndex(stepName) {
    const workflow = this.workflows.get(this.currentWorkflowId);
    return workflow.steps.findIndex(step => step.name === stepName);
  }
}

module.exports = WorkflowEngine;