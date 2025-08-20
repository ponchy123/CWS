/**
 * 12-Factor App 配置管理
 * 统一环境变量管理和验证
 */

import { z } from 'zod';

// 环境变量验证模式
const envSchema = z.object({
  // 应用基础配置
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  
  // API 配置
  VITE_API_BASE_URL: z.string().url().optional(),
  VITE_NEWSNOW_API_KEY: z.string().optional(),
  
  // 数据库配置
  MONGODB_URI: z.string().optional(),
  
  // 认证配置
  JWT_SECRET: z.string().min(32).optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // 第三方服务配置
  OPENAI_API_KEY: z.string().optional(),
  BAIDU_API_KEY: z.string().optional(),
  BAIDU_SECRET_KEY: z.string().optional(),
  
  // 支付配置
  ALIPAY_APP_ID: z.string().optional(),
  ALIPAY_PRIVATE_KEY: z.string().optional(),
  WECHAT_PAY_MCH_ID: z.string().optional(),
  WECHAT_PAY_API_KEY: z.string().optional(),
  
  // 监控配置
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  ENABLE_METRICS: z.string().transform(Boolean).default('false'),
});

// 环境变量类型
export type Environment = z.infer<typeof envSchema>;

// 配置验证和加载
class ConfigManager {
  private static instance: ConfigManager;
  private config: Environment;

  private constructor() {
    this.config = this.loadAndValidateConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadAndValidateConfig(): Environment {
    try {
      // 浏览器环境的默认配置
      const defaultConfig = {
        NODE_ENV: 'development',
        PORT: '3004',
        VITE_API_BASE_URL: 'http://localhost:3004/api',
        LOG_LEVEL: 'info',
        JWT_EXPIRES_IN: '7d',
        ENABLE_METRICS: 'false'
      };

      // 在浏览器环境中使用默认配置和 Vite 环境变量
      const envVars = typeof window !== 'undefined' 
        ? { ...defaultConfig, ...import.meta.env }
        : { ...defaultConfig, ...import.meta.env };

      // 验证配置
      const result = envSchema.safeParse(envVars);
      
      if (!result.success) {
        console.warn('配置验证失败，使用默认配置:', result.error.format());
        // 返回符合类型的默认配置
        return {
          NODE_ENV: 'development' as const,
          PORT: 3004,
          VITE_API_BASE_URL: 'http://localhost:3004/api',
          LOG_LEVEL: 'info' as const,
          JWT_EXPIRES_IN: '7d',
          ENABLE_METRICS: false
        };
      }

      return result.data;
    } catch (error) {
      console.warn('配置加载失败，使用默认配置:', error);
      // 返回符合类型的默认配置
      return {
        NODE_ENV: 'development' as const,
        PORT: 3004,
        VITE_API_BASE_URL: 'http://localhost:3004/api',
        LOG_LEVEL: 'info' as const,
        JWT_EXPIRES_IN: '7d',
        ENABLE_METRICS: false
      };
    }
  }

  public get<K extends keyof Environment>(key: K): Environment[K] {
    return this.config[key];
  }

  public getAll(): Environment {
    return { ...this.config };
  }

  public isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  public isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  public isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }

  // 获取 API 配置
  public getApiConfig() {
    return {
      baseURL: this.config.VITE_API_BASE_URL || `http://localhost:${this.config.PORT}`,
      timeout: 30000,
      retries: 3,
    };
  }

  // 获取数据库配置
  public getDatabaseConfig() {
    return {
      uri: this.config.MONGODB_URI || 'mongodb://localhost:27017/content-workflow',
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      },
    };
  }

  // 获取认证配置
  public getAuthConfig() {
    return {
      jwtSecret: this.config.JWT_SECRET || 'default-secret-key-for-development',
      jwtExpiresIn: this.config.JWT_EXPIRES_IN,
      bcryptRounds: 12,
    };
  }

  // 获取日志配置
  public getLogConfig() {
    return {
      level: this.config.LOG_LEVEL,
      enableMetrics: this.config.ENABLE_METRICS,
      format: this.isProduction() ? 'json' : 'pretty',
    };
  }
}

// 导出单例实例
export const config = ConfigManager.getInstance();

// 导出便捷方法
export const isDev = () => config.isDevelopment();
export const isProd = () => config.isProduction();
export const isTest = () => config.isTest();