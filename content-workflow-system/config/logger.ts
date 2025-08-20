/**
 * 统一日志管理系统
 * 基于 12-Factor App 日志原则
 */

import { config } from './environment';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  requestId?: string;
  userId?: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private enableMetrics: boolean;

  private constructor() {
    const logConfig = config.getLogConfig();
    this.logLevel = this.getLogLevelFromString(logConfig.level);
    this.enableMetrics = logConfig.enableMetrics;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getLogLevelFromString(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatLog(entry: LogEntry): string {
    if (config.isProduction()) {
      // 生产环境使用 JSON 格式
      return JSON.stringify(entry);
    } else {
      // 开发环境使用可读格式
      const { timestamp, level, message, context, error } = entry;
      let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      
      if (context && Object.keys(context).length > 0) {
        log += ` | Context: ${JSON.stringify(context)}`;
      }
      
      if (error) {
        log += ` | Error: ${error.message}\n${error.stack}`;
      }
      
      return log;
    }
  }

  private createLogEntry(
    level: string,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      requestId: this.getRequestId(),
      userId: this.getUserId(),
    };
  }

  private getRequestId(): string | undefined {
    // 从异步上下文获取请求ID（如果有的话）
    return (globalThis as any).__REQUEST_ID__;
  }

  private getUserId(): string | undefined {
    // 从异步上下文获取用户ID（如果有的话）
    return (globalThis as any).__USER_ID__;
  }

  public error(message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.createLogEntry('error', message, context, error);
    console.error(this.formatLog(entry));
    
    if (this.enableMetrics) {
      this.recordMetric('log.error', 1);
    }
  }

  public warn(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createLogEntry('warn', message, context);
    console.warn(this.formatLog(entry));
    
    if (this.enableMetrics) {
      this.recordMetric('log.warn', 1);
    }
  }

  public info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createLogEntry('info', message, context);
    console.info(this.formatLog(entry));
    
    if (this.enableMetrics) {
      this.recordMetric('log.info', 1);
    }
  }

  public debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createLogEntry('debug', message, context);
    console.debug(this.formatLog(entry));
    
    if (this.enableMetrics) {
      this.recordMetric('log.debug', 1);
    }
  }

  // API 请求日志
  public apiRequest(method: string, url: string, context?: Record<string, any>): void {
    this.info(`API Request: ${method} ${url}`, {
      type: 'api_request',
      method,
      url,
      ...context,
    });
  }

  // API 响应日志
  public apiResponse(method: string, url: string, status: number, duration: number): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    this[level](`API Response: ${method} ${url} - ${status}`, {
      type: 'api_response',
      method,
      url,
      status,
      duration,
    });
  }

  // 业务操作日志
  public business(operation: string, context?: Record<string, any>): void {
    this.info(`Business Operation: ${operation}`, {
      type: 'business',
      operation,
      ...context,
    });
  }

  // 性能监控日志
  public performance(metric: string, value: number, context?: Record<string, any>): void {
    this.info(`Performance Metric: ${metric} = ${value}`, {
      type: 'performance',
      metric,
      value,
      ...context,
    });
  }

  // 安全事件日志
  public security(event: string, context?: Record<string, any>): void {
    this.warn(`Security Event: ${event}`, {
      type: 'security',
      event,
      ...context,
    });
  }

  private recordMetric(name: string, value: number): void {
    // 这里可以集成到监控系统，如 Prometheus
    // 暂时只记录到控制台
    if (config.isDevelopment()) {
      console.debug(`Metric: ${name} = ${value}`);
    }
  }

  // 设置请求上下文
  public setRequestContext(requestId: string, userId?: string): void {
    (globalThis as any).__REQUEST_ID__ = requestId;
    if (userId) {
      (globalThis as any).__USER_ID__ = userId;
    }
  }

  // 清除请求上下文
  public clearRequestContext(): void {
    delete (globalThis as any).__REQUEST_ID__;
    delete (globalThis as any).__USER_ID__;
  }
}

// 导出单例实例
export const logger = Logger.getInstance();

// 导出便捷方法
export const log = {
  error: (message: string, context?: Record<string, any>, error?: Error) => 
    logger.error(message, context, error),
  warn: (message: string, context?: Record<string, any>) => 
    logger.warn(message, context),
  info: (message: string, context?: Record<string, any>) => 
    logger.info(message, context),
  debug: (message: string, context?: Record<string, any>) => 
    logger.debug(message, context),
  api: {
    request: (method: string, url: string, context?: Record<string, any>) => 
      logger.apiRequest(method, url, context),
    response: (method: string, url: string, status: number, duration: number) => 
      logger.apiResponse(method, url, status, duration),
  },
  business: (operation: string, context?: Record<string, any>) => 
    logger.business(operation, context),
  performance: (metric: string, value: number, context?: Record<string, any>) => 
    logger.performance(metric, value, context),
  security: (event: string, context?: Record<string, any>) => 
    logger.security(event, context),
};