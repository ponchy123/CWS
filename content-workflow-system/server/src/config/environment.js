/**
 * 服务器端 12-Factor App 配置管理
 * 统一环境变量管理和验证
 */

const Joi = require('joi');

// 环境变量验证模式
const envSchema = Joi.object({
  // 应用基础配置
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3003),
  
  // 数据库配置
  MONGODB_URI: Joi.string().required(),
  
  // 认证配置
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  
  // 前端配置
  CLIENT_URL: Joi.string().uri().default('http://localhost:5173'),
  
  // 文件上传配置
  UPLOAD_PATH: Joi.string().default('./uploads'),
  MAX_FILE_SIZE: Joi.number().default(10485760), // 10MB
  
  // 日志配置
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FILE: Joi.string().default('./logs/app.log'),
  
  // 第三方服务配置
  OPENAI_API_KEY: Joi.string().allow('').optional(),
  BAIDU_API_KEY: Joi.string().allow('').optional(),
  BAIDU_SECRET_KEY: Joi.string().allow('').optional(),
  
  // 支付配置
  ALIPAY_APP_ID: Joi.string().allow('').optional(),
  ALIPAY_PRIVATE_KEY: Joi.string().allow('').optional(),
  WECHAT_PAY_MCH_ID: Joi.string().allow('').optional(),
  WECHAT_PAY_API_KEY: Joi.string().allow('').optional(),
  
  // 监控配置
  ENABLE_METRICS: Joi.boolean().default(false),
  METRICS_PORT: Joi.number().default(9090),
}).unknown(); // 允许其他环境变量

/**
 * 配置管理器
 */
class ConfigManager {
  constructor() {
    this.config = this.loadAndValidateConfig();
  }

  loadAndValidateConfig() {
    try {
      // 验证环境变量
      const { error, value } = envSchema.validate(process.env);
      
      if (error) {
        console.error('配置验证失败:', error.details);
        throw new Error(`环境变量配置无效: ${error.message}`);
      }

      return value;
    } catch (error) {
      console.error('配置加载失败:', error);
      throw error;
    }
  }

  get(key) {
    return this.config[key];
  }

  getAll() {
    return { ...this.config };
  }

  isDevelopment() {
    return this.config.NODE_ENV === 'development';
  }

  isProduction() {
    return this.config.NODE_ENV === 'production';
  }

  isTest() {
    return this.config.NODE_ENV === 'test';
  }

  // 获取数据库配置
  getDatabaseConfig() {
    return {
      uri: this.config.MONGODB_URI,
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // 使用 IPv4
      },
    };
  }

  // 获取认证配置
  getAuthConfig() {
    return {
      jwtSecret: this.config.JWT_SECRET,
      jwtExpiresIn: this.config.JWT_EXPIRES_IN,
      bcryptRounds: 12,
    };
  }

  // 获取CORS配置
  getCorsConfig() {
    return {
      origin: this.config.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    };
  }

  // 获取文件上传配置
  getUploadConfig() {
    return {
      path: this.config.UPLOAD_PATH,
      maxFileSize: this.config.MAX_FILE_SIZE,
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    };
  }

  // 获取日志配置
  getLogConfig() {
    return {
      level: this.config.LOG_LEVEL,
      file: this.config.LOG_FILE,
      enableMetrics: this.config.ENABLE_METRICS,
      format: this.isProduction() ? 'json' : 'pretty',
    };
  }

  // 获取第三方服务配置
  getThirdPartyConfig() {
    return {
      openai: {
        apiKey: this.config.OPENAI_API_KEY,
      },
      baidu: {
        apiKey: this.config.BAIDU_API_KEY,
        secretKey: this.config.BAIDU_SECRET_KEY,
      },
    };
  }

  // 获取支付配置
  getPaymentConfig() {
    return {
      alipay: {
        appId: this.config.ALIPAY_APP_ID,
        privateKey: this.config.ALIPAY_PRIVATE_KEY,
      },
      wechatPay: {
        mchId: this.config.WECHAT_PAY_MCH_ID,
        apiKey: this.config.WECHAT_PAY_API_KEY,
      },
    };
  }

  // 获取监控配置
  getMonitoringConfig() {
    return {
      enableMetrics: this.config.ENABLE_METRICS,
      metricsPort: this.config.METRICS_PORT,
    };
  }
}

// 创建单例实例
const config = new ConfigManager();

// 导出便捷方法
module.exports = {
  config,
  isDev: () => config.isDevelopment(),
  isProd: () => config.isProduction(),
  isTest: () => config.isTest(),
};