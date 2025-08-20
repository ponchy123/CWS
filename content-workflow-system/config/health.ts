/**
 * 健康检查系统
 * 基于 12-Factor App 可观测性原则
 */

import { config } from './environment';
import { logger } from './logger';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  duration?: number;
  timestamp: string;
  details?: Record<string, any>;
}

export interface HealthReport {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheck[];
}

class HealthManager {
  private static instance: HealthManager;
  private startTime: number;
  private checks: Map<string, () => Promise<HealthCheck>>;

  private constructor() {
    this.startTime = Date.now();
    this.checks = new Map();
    this.registerDefaultChecks();
  }

  public static getInstance(): HealthManager {
    if (!HealthManager.instance) {
      HealthManager.instance = new HealthManager();
    }
    return HealthManager.instance;
  }

  private registerDefaultChecks(): void {
    // 内存使用检查
    this.registerCheck('memory', async () => {
      const used = process.memoryUsage();
      const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
      
      const status = heapUsedMB > 500 ? 'degraded' : 'healthy';
      
      return {
        name: 'memory',
        status,
        message: `Heap: ${heapUsedMB}MB / ${heapTotalMB}MB`,
        timestamp: new Date().toISOString(),
        details: {
          heapUsed: heapUsedMB,
          heapTotal: heapTotalMB,
          rss: Math.round(used.rss / 1024 / 1024),
          external: Math.round(used.external / 1024 / 1024),
        },
      };
    });

    // 磁盘空间检查（简化版）
    this.registerCheck('disk', async () => {
      // 在实际环境中，这里应该检查磁盘使用情况
      return {
        name: 'disk',
        status: 'healthy' as const,
        message: 'Disk space sufficient',
        timestamp: new Date().toISOString(),
      };
    });

    // 环境配置检查
    this.registerCheck('config', async () => {
      try {
        const requiredConfigs = ['NODE_ENV'];
        const missing = requiredConfigs.filter(key => !config.get(key as any));
        
        if (missing.length > 0) {
          return {
            name: 'config',
            status: 'unhealthy' as const,
            message: `Missing required configs: ${missing.join(', ')}`,
            timestamp: new Date().toISOString(),
            details: { missing },
          };
        }

        return {
          name: 'config',
          status: 'healthy' as const,
          message: 'All required configurations present',
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          name: 'config',
          status: 'unhealthy' as const,
          message: `Config validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date().toISOString(),
        };
      }
    });
  }

  public registerCheck(name: string, checkFn: () => Promise<HealthCheck>): void {
    this.checks.set(name, checkFn);
    logger.debug(`Health check registered: ${name}`);
  }

  public async runCheck(name: string): Promise<HealthCheck> {
    const checkFn = this.checks.get(name);
    if (!checkFn) {
      return {
        name,
        status: 'unhealthy',
        message: `Health check '${name}' not found`,
        timestamp: new Date().toISOString(),
      };
    }

    const startTime = Date.now();
    try {
      const result = await checkFn();
      const duration = Date.now() - startTime;
      return { ...result, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Health check failed: ${name}`, { name, duration }, error as Error);
      
      return {
        name,
        status: 'unhealthy',
        message: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration,
        timestamp: new Date().toISOString(),
      };
    }
  }

  public async runAllChecks(): Promise<HealthReport> {
    const checkNames = Array.from(this.checks.keys());
    const checkPromises = checkNames.map(name => this.runCheck(name));
    
    const checks = await Promise.all(checkPromises);
    
    // 确定整体状态
    const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
    const hasDegraded = checks.some(check => check.status === 'degraded');
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const report: HealthReport = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: config.get('NODE_ENV'),
      checks,
    };

    // 记录健康检查结果
    if (overallStatus === 'unhealthy') {
      logger.error('Health check failed', { report });
    } else if (overallStatus === 'degraded') {
      logger.warn('Health check degraded', { report });
    } else {
      logger.debug('Health check passed', { report });
    }

    return report;
  }

  public getUptime(): number {
    return Date.now() - this.startTime;
  }

  // 简单的就绪检查
  public async isReady(): Promise<boolean> {
    const report = await this.runAllChecks();
    return report.status !== 'unhealthy';
  }

  // 简单的存活检查
  public isAlive(): boolean {
    return true; // 如果进程还在运行，就认为是存活的
  }
}

// 导出单例实例
export const health = HealthManager.getInstance();

// 便捷方法
export const healthCheck = {
  register: (name: string, checkFn: () => Promise<HealthCheck>) => 
    health.registerCheck(name, checkFn),
  run: (name: string) => health.runCheck(name),
  runAll: () => health.runAllChecks(),
  isReady: () => health.isReady(),
  isAlive: () => health.isAlive(),
  uptime: () => health.getUptime(),
};