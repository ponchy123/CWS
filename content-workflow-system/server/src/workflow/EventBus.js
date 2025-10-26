/**
 * 事件总线 - Agent 间异步通信机制
 */
const EventEmitter = require('events');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // 增加监听器限制
    this.subscribers = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 1000;
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
   * 订阅事件（带元数据）
   */
  subscribe(eventName, handler, metadata = {}) {
    const subscriberId = `${metadata.agentId || 'unknown'}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const wrappedHandler = (data) => {
      try {
        this.logger.debug(`事件处理: ${eventName} by ${metadata.agentId || 'unknown'}`);
        handler(data);
      } catch (error) {
        this.logger.error(`事件处理失败: ${eventName}`, error);
        this.emit('error', {
          eventName,
          subscriberId,
          error: error.message,
          timestamp: new Date()
        });
      }
    };

    this.subscribers.set(subscriberId, {
      eventName,
      handler: wrappedHandler,
      metadata,
      subscribedAt: new Date()
    });

    this.on(eventName, wrappedHandler);
    
    this.logger.info(`事件订阅: ${eventName} by ${metadata.agentId || 'unknown'}`);
    return subscriberId;
  }

  /**
   * 取消订阅
   */
  unsubscribe(subscriberId) {
    const subscription = this.subscribers.get(subscriberId);
    if (subscription) {
      this.off(subscription.eventName, subscription.handler);
      this.subscribers.delete(subscriberId);
      this.logger.info(`取消订阅: ${subscription.eventName} by ${subscription.metadata.agentId || 'unknown'}`);
    }
  }

  /**
   * 发布事件（带历史记录）
   */
  publish(eventName, data, metadata = {}) {
    const eventData = {
      eventName,
      data,
      metadata: {
        ...metadata,
        timestamp: new Date(),
        eventId: `${eventName}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
      }
    };

    // 记录事件历史
    this.addToHistory(eventData);
    
    // 发布事件
    this.emit(eventName, eventData.data);
    
    this.logger.debug(`事件发布: ${eventName}`, { 
      eventId: eventData.metadata.eventId,
      dataKeys: Object.keys(data || {})
    });

    return eventData.metadata.eventId;
  }

  /**
   * 请求-响应模式
   */
  async request(eventName, data, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const responseEvent = `${eventName}.response.${requestId}`;
      
      const timeoutHandle = setTimeout(() => {
        this.off(responseEvent, responseHandler);
        reject(new Error(`请求超时: ${eventName}`));
      }, timeout);

      const responseHandler = (responseData) => {
        clearTimeout(timeoutHandle);
        this.off(responseEvent, responseHandler);
        
        if (responseData.error) {
          reject(new Error(responseData.error));
        } else {
          resolve(responseData.result);
        }
      };

      this.once(responseEvent, responseHandler);
      
      this.publish(eventName, {
        ...data,
        requestId,
        responseEvent
      });
    });
  }

  /**
   * 响应请求
   */
  respond(responseEvent, result, error = null) {
    this.publish(responseEvent, {
      result,
      error: error ? error.message : null,
      timestamp: new Date()
    });
  }

  /**
   * 广播事件到所有 Agent
   */
  broadcast(eventName, data, excludeAgents = []) {
    const broadcastData = {
      ...data,
      broadcast: true,
      excludeAgents,
      timestamp: new Date()
    };

    this.publish(eventName, broadcastData, { type: 'broadcast' });
  }

  /**
   * 添加到事件历史
   */
  addToHistory(eventData) {
    this.eventHistory.push(eventData);
    
    // 限制历史记录大小
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * 获取事件历史
   */
  getEventHistory(filter = {}) {
    let history = this.eventHistory;

    if (filter.eventName) {
      history = history.filter(event => event.eventName === filter.eventName);
    }

    if (filter.agentId) {
      history = history.filter(event => 
        event.metadata.agentId === filter.agentId
      );
    }

    if (filter.since) {
      const since = new Date(filter.since);
      history = history.filter(event => 
        event.metadata.timestamp >= since
      );
    }

    return history.slice(-filter.limit || 100);
  }

  /**
   * 获取订阅者信息
   */
  getSubscribers() {
    return Array.from(this.subscribers.entries()).map(([id, subscription]) => ({
      id,
      eventName: subscription.eventName,
      agentId: subscription.metadata.agentId,
      subscribedAt: subscription.subscribedAt
    }));
  }

  /**
   * 获取事件统计
   */
  getEventStats() {
    const stats = {
      totalEvents: this.eventHistory.length,
      totalSubscribers: this.subscribers.size,
      eventsByName: {},
      eventsByAgent: {}
    };

    this.eventHistory.forEach(event => {
      // 按事件名统计
      stats.eventsByName[event.eventName] = 
        (stats.eventsByName[event.eventName] || 0) + 1;

      // 按 Agent 统计
      const agentId = event.metadata.agentId || 'unknown';
      stats.eventsByAgent[agentId] = 
        (stats.eventsByAgent[agentId] || 0) + 1;
    });

    return stats;
  }

  /**
   * 清理过期事件历史
   */
  cleanupHistory(maxAge = 24 * 60 * 60 * 1000) { // 默认24小时
    const cutoff = new Date(Date.now() - maxAge);
    const originalLength = this.eventHistory.length;
    
    this.eventHistory = this.eventHistory.filter(event => 
      event.metadata.timestamp >= cutoff
    );

    const cleaned = originalLength - this.eventHistory.length;
    if (cleaned > 0) {
      this.logger.info(`清理事件历史: ${cleaned} 条记录`);
    }
  }

  /**
   * 获取事件总线指标
   */
  getMetrics() {
    const stats = this.getEventStats();
    return {
      totalEvents: stats.totalEvents,
      totalSubscribers: stats.totalSubscribers,
      eventsByName: stats.eventsByName,
      eventsByAgent: stats.eventsByAgent,
      historySize: this.eventHistory.length
    };
  }

  /**
   * 健康检查
   */
  healthCheck() {
    return {
      status: 'healthy',
      subscribers: this.subscribers.size,
      eventHistory: this.eventHistory.length,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }
}

module.exports = EventBus;