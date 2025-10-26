/**
 * 简化的日志配置
 * 用于测试环境，避免复杂的环境变量依赖
 */

class SimpleLogger {
  constructor(name = 'System') {
    this.name = name;
  }

  info(message, meta = {}) {
    console.log(`[INFO] [${this.name}] ${message}`, meta);
  }

  error(message, meta = {}) {
    console.error(`[ERROR] [${this.name}] ${message}`, meta);
  }

  warn(message, meta = {}) {
    console.warn(`[WARN] [${this.name}] ${message}`, meta);
  }

  debug(message, meta = {}) {
    console.log(`[DEBUG] [${this.name}] ${message}`, meta);
  }

  security(message, meta = {}) {
    console.warn(`[SECURITY] [${this.name}] ${message}`, meta);
  }

  performance(metric, value, meta = {}) {
    console.log(`[PERFORMANCE] [${this.name}] ${metric}: ${value}`, meta);
  }
}

const logger = new SimpleLogger();

// HTTP logging middleware - simplified version
const httpLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[HTTP] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

module.exports = { logger, httpLogger };