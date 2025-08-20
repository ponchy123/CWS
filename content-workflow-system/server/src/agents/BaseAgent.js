/**
 * 基础 Agent 类
 * 实现 12-Factor Agents 架构的核心功能
 */

const { logger } = require('../config/logger');
const { config } = require('../config/environment');

class BaseAgent {
  constructor(name, options = {}) {
    this.name = name;
    this.id = this.generateId();
    this.status = 'idle'; // idle, running, error, stopped
    this.options = {
      maxRetries: 3,
      timeout: 30000,
      enableMetrics: true,
      ...options
    };
    
    this.metrics = {
      tasksCompleted: 0,
      tasksError: 0,
      totalExecutionTime: 0,
      lastExecutionTime: null,
      averageExecutionTime: 0
    };
    
    this.eventHandlers = new Map();
    this.middleware = [];
    
    logger.info(`Agent 初始化: ${this.name}`, {
      agentId: this.id,
      type: 'agent_lifecycle'
    });
  }

  generateId() {
    return `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 注册事件处理器
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  // 触发事件
  emit(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        logger.error(`Agent 事件处理失败: ${event}`, {
          agentId: this.id,
          agentName: this.name,
          event,
          error: error.message
        }, error);
      }
    });
  }

  // 添加中间件
  use(middleware) {
    this.middleware.push(middleware);
  }

  // 执行中间件链 - 简化版本
  async executeMiddleware(context) {
    let processedContext = { ...context };
    
    // 顺序执行所有中间件
    for (let i = 0; i < this.middleware.length; i++) {
      const middleware = this.middleware[i];
      let nextCalled = false;
      
      await middleware(processedContext, async () => {
        nextCalled = true;
      });
      
      if (!nextCalled) {
        throw new Error(`中间件 ${i} 没有调用 next()`);
      }
    }
    
    return processedContext;
  }

  // 核心执行方法 - 子类需要实现
  async execute(input, context = {}) {
    throw new Error(`Agent ${this.name} 必须实现 execute 方法`);
  }

  // 带有完整生命周期的执行方法
  async run(input, context = {}) {
    const startTime = Date.now();
    const executionId = this.generateExecutionId();
    
    try {
      this.status = 'running';
      
      logger.info(`Agent 开始执行: ${this.name}`, {
        agentId: this.id,
        agentName: this.name,
        executionId,
        input: this.sanitizeInput(input),
        type: 'agent_execution_start'
      });

      this.emit('start', { input, context, executionId });

      // 执行中间件和核心逻辑
      const result = await this.executeWithTimeout(async () => {
        // 先执行中间件
        const middlewareContext = { input, context, agent: this };
        const processedContext = await this.executeMiddleware(middlewareContext);
        
        // 然后执行核心逻辑
        return await this.execute(processedContext.input, processedContext.context);
      });

      const executionTime = Date.now() - startTime;
      this.updateMetrics(executionTime, true);

      logger.info(`Agent 执行成功: ${this.name}`, {
        agentId: this.id,
        agentName: this.name,
        executionId,
        executionTime,
        type: 'agent_execution_success'
      });

      this.emit('success', { result, executionTime, executionId });
      this.status = 'idle';
      
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateMetrics(executionTime, false);
      this.status = 'error';

      logger.error(`Agent 执行失败: ${this.name}`, {
        agentId: this.id,
        agentName: this.name,
        executionId,
        executionTime,
        error: error.message,
        type: 'agent_execution_error'
      }, error);

      this.emit('error', { error, executionTime, executionId });
      
      throw error;
    }
  }

  // 带超时的执行
  async executeWithTimeout(fn) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Agent ${this.name} 执行超时 (${this.options.timeout}ms)`));
      }, this.options.timeout);

      fn()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  // 重试机制
  async executeWithRetry(fn, retries = this.options.maxRetries) {
    let lastError;
    
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (i < retries) {
          const delay = Math.pow(2, i) * 1000; // 指数退避
          logger.warn(`Agent 重试: ${this.name} (${i + 1}/${retries + 1})`, {
            agentId: this.id,
            agentName: this.name,
            attempt: i + 1,
            maxAttempts: retries + 1,
            delay,
            error: error.message
          });
          
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  // 更新指标
  updateMetrics(executionTime, success) {
    if (success) {
      this.metrics.tasksCompleted++;
    } else {
      this.metrics.tasksError++;
    }
    
    this.metrics.totalExecutionTime += executionTime;
    this.metrics.lastExecutionTime = executionTime;
    
    const totalTasks = this.metrics.tasksCompleted + this.metrics.tasksError;
    this.metrics.averageExecutionTime = this.metrics.totalExecutionTime / totalTasks;

    if (this.options.enableMetrics) {
      logger.performance(`agent_${this.name}_execution_time`, executionTime, {
        agentId: this.id,
        agentName: this.name,
        success
      });
    }
  }

  // 获取 Agent 状态
  getStatus() {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      metrics: { ...this.metrics },
      options: { ...this.options },
      uptime: Date.now() - this.startTime
    };
  }

  // 健康检查
  async healthCheck() {
    try {
      // 子类可以重写此方法进行特定的健康检查
      return {
        name: this.name,
        status: 'healthy',
        message: 'Agent 运行正常',
        timestamp: new Date().toISOString(),
        metrics: this.metrics
      };
    } catch (error) {
      return {
        name: this.name,
        status: 'unhealthy',
        message: `健康检查失败: ${error.message}`,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // 停止 Agent
  async stop() {
    this.status = 'stopped';
    this.emit('stop');
    
    logger.info(`Agent 停止: ${this.name}`, {
      agentId: this.id,
      agentName: this.name,
      type: 'agent_lifecycle'
    });
  }

  // 工具方法
  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  sanitizeInput(input) {
    // 移除敏感信息用于日志记录
    if (typeof input === 'object' && input !== null) {
      const sanitized = { ...input };
      const sensitiveKeys = ['password', 'token', 'key', 'secret'];
      
      sensitiveKeys.forEach(key => {
        if (sanitized[key]) {
          sanitized[key] = '***';
        }
      });
      
      return sanitized;
    }
    
    return input;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = BaseAgent;