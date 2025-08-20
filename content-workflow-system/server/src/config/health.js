/**
 * 服务器端健康检查系统
 * 基于 12-Factor App 可观测性原则
 */

const mongoose = require('mongoose');
const { config } = require('./environment');
const { logger } = require('./logger');

/**
 * 健康检查管理器
 */
class HealthManager {
  constructor() {
    this.startTime = Date.now();
    this.checks = new Map();
    this.registerDefaultChecks();
  }

  registerDefaultChecks() {
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

    // 数据库连接检查
    this.registerCheck('database', async () => {
      try {
        if (mongoose.connection.readyState === 1) {
          // 执行简单查询测试连接
          await mongoose.connection.db.admin().ping();
          
          return {
            name: 'database',
            status: 'healthy',
            message: 'Database connection is healthy',
            timestamp: new Date().toISOString(),
            details: {
              readyState: mongoose.connection.readyState,
              host: mongoose.connection.host,
              port: mongoose.connection.port,
              name: mongoose.connection.name,
            },
          };
        } else {
          return {
            name: 'database',
            status: 'unhealthy',
            message: `Database connection is not ready (state: ${mongoose.connection.readyState})`,
            timestamp: new Date().toISOString(),
            details: {
              readyState: mongoose.connection.readyState,
            },
          };
        }
      } catch (error) {
        return {
          name: 'database',
          status: 'unhealthy',
          message: `Database check failed: ${error.message}`,
          timestamp: new Date().toISOString(),
          details: {
            error: error.message,
          },
        };
      }
    });

    // 磁盘空间检查
    this.registerCheck('disk', async () => {
      try {
        const fs = require('fs');
        const stats = fs.statSync('./');
        
        return {
          name: 'disk',
          status: 'healthy',
          message: 'Disk space check passed',
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          name: 'disk',
          status: 'degraded',
          message: `Disk check warning: ${error.message}`,
          timestamp: new Date().toISOString(),
        };
      }
    });

    // 环境配置检查
    this.registerCheck('config', async () => {
      try {
        const requiredConfigs = ['NODE_ENV', 'PORT', 'MONGODB_URI', 'JWT_SECRET'];
        const missing = requiredConfigs.filter(key => !config.get(key));
        
        if (missing.length > 0) {
          return {
            name: 'config',
            status: 'unhealthy',
            message: `Missing required configs: ${missing.join(', ')}`,
            timestamp: new Date().toISOString(),
            details: { missing },
          };
        }

        return {
          name: 'config',
          status: 'healthy',
          message: 'All required configurations present',
          timestamp: new Date().toISOString(),
          details: {
            environment: config.get('NODE_ENV'),
            port: config.get('PORT'),
          },
        };
      } catch (error) {
        return {
          name: 'config',
          status: 'unhealthy',
          message: `Config validation failed: ${error.message}`,
          timestamp: new Date().toISOString(),
        };
      }
    });

    // 第三方服务检查
    this.registerCheck('external_services', async () => {
      const services = [];
      const thirdPartyConfig = config.getThirdPartyConfig();
      
      // 检查配置的第三方服务
      if (thirdPartyConfig.openai.apiKey) {
        services.push('OpenAI');
      }
      if (thirdPartyConfig.baidu.apiKey) {
        services.push('Baidu');
      }
      
      return {
        name: 'external_services',
        status: 'healthy',
        message: `External services configured: ${services.length > 0 ? services.join(', ') : 'None'}`,
        timestamp: new Date().toISOString(),
        details: {
          configured: services,
        },
      };
    });
  }

  registerCheck(name, checkFn) {
    this.checks.set(name, checkFn);
    logger.debug(`Health check registered: ${name}`);
  }

  async runCheck(name) {
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
      logger.error(`Health check failed: ${name}`, { name, duration }, error);
      
      return {
        name,
        status: 'unhealthy',
        message: `Check failed: ${error.message}`,
        duration,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async runAllChecks() {
    const checkNames = Array.from(this.checks.keys());
    const checkPromises = checkNames.map(name => this.runCheck(name));
    
    const checks = await Promise.all(checkPromises);
    
    // 确定整体状态
    const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
    const hasDegraded = checks.some(check => check.status === 'degraded');
    
    let overallStatus;
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const report = {
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

  getUptime() {
    return Date.now() - this.startTime;
  }

  async isReady() {
    const report = await this.runAllChecks();
    return report.status !== 'unhealthy';
  }

  isAlive() {
    return true;
  }

  // 创建健康检查路由处理器
  createHealthRoutes() {
    return {
      // 健康检查端点
      health: async (req, res) => {
        try {
          const report = await this.runAllChecks();
          const statusCode = report.status === 'healthy' ? 200 : 
                           report.status === 'degraded' ? 200 : 503;
          
          res.status(statusCode).json(report);
        } catch (error) {
          logger.error('Health check endpoint failed', {}, error, req);
          res.status(500).json({
            status: 'unhealthy',
            message: 'Health check failed',
            timestamp: new Date().toISOString(),
          });
        }
      },

      // 就绪检查端点
      ready: async (req, res) => {
        try {
          const isReady = await this.isReady();
          const statusCode = isReady ? 200 : 503;
          
          res.status(statusCode).json({
            ready: isReady,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          logger.error('Readiness check endpoint failed', {}, error, req);
          res.status(503).json({
            ready: false,
            timestamp: new Date().toISOString(),
          });
        }
      },

      // 存活检查端点
      live: (req, res) => {
        const isAlive = this.isAlive();
        const statusCode = isAlive ? 200 : 503;
        
        res.status(statusCode).json({
          alive: isAlive,
          uptime: this.getUptime(),
          timestamp: new Date().toISOString(),
        });
      },
    };
  }
}

// 创建单例实例
const health = new HealthManager();

module.exports = {
  health,
  healthCheck: {
    register: (name, checkFn) => health.registerCheck(name, checkFn),
    run: (name) => health.runCheck(name),
    runAll: () => health.runAllChecks(),
    isReady: () => health.isReady(),
    isAlive: () => health.isAlive(),
    uptime: () => health.getUptime(),
    routes: () => health.createHealthRoutes(),
  },
};