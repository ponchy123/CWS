import { api } from './api';

// 系统设置相关接口定义
export interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    language: string;
    timezone: string;
    dateFormat: string;
    theme: 'light' | 'dark' | 'auto';
  };
  security: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
    sessionTimeout: number;
    twoFactorAuth: boolean;
    loginAttempts: number;
    lockoutDuration: number;
  };
  notification: {
    email: {
      enabled: boolean;
      smtp: {
        host: string;
        port: number;
        username: string;
        password: string;
        encryption: 'none' | 'tls' | 'ssl';
      };
    };
    push: {
      enabled: boolean;
      vapidKey: string;
    };
    sms: {
      enabled: boolean;
      provider: string;
      apiKey: string;
    };
  };
  backup: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    retention: number;
    location: 'local' | 'cloud';
    cloudConfig: {
      provider: string;
      bucket: string;
      accessKey: string;
      secretKey: string;
    };
  };
  api: {
    rateLimit: {
      enabled: boolean;
      requestsPerMinute: number;
      requestsPerHour: number;
    };
    cors: {
      enabled: boolean;
      allowedOrigins: string[];
    };
    authentication: {
      jwtExpiration: number;
      refreshTokenExpiration: number;
    };
  };
  performance: {
    cache: {
      enabled: boolean;
      ttl: number;
      maxSize: number;
    };
    compression: {
      enabled: boolean;
      level: number;
    };
    logging: {
      level: 'debug' | 'info' | 'warn' | 'error';
      retention: number;
    };
  };
}

export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  dashboard: {
    layout: string;
    widgets: string[];
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    activityTracking: boolean;
    dataSharing: boolean;
  };
}

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'social' | 'analytics' | 'storage' | 'payment';
  enabled: boolean;
  config: Record<string, unknown>;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
}

export interface SystemInfo {
  version: string;
  buildDate: string;
  environment: 'development' | 'staging' | 'production';
  database: {
    type: string;
    version: string;
    size: number;
  };
  server: {
    os: string;
    memory: number;
    cpu: string;
    uptime: number;
  };
  dependencies: Array<{
    name: string;
    version: string;
    license: string;
  }>;
}

// 设置服务类 - 简化版，与后端API保持一致
export class SettingsService {
  // 获取系统设置 - 使用现有的 /settings 接口
  static async getSystemSettings(): Promise<SystemSettings> {
    try {
      const response = await api.get('/settings');
      // 返回默认的系统设置结构
      return {
        general: {
          siteName: '内容工作流系统',
          siteDescription: '智能内容创作与发布平台',
          language: response.data?.data?.preferences?.language || 'zh-CN',
          timezone: 'Asia/Shanghai',
          dateFormat: 'YYYY-MM-DD',
          theme: response.data?.data?.preferences?.theme || 'auto',
        },
        security: {
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false,
          },
          sessionTimeout: 3600,
          twoFactorAuth: false,
          loginAttempts: 5,
          lockoutDuration: 300,
        },
        notification: {
          email: {
            enabled: response.data?.data?.preferences?.notifications?.email || true,
            smtp: {
              host: 'smtp.example.com',
              port: 587,
              username: '',
              password: '',
              encryption: 'tls',
            },
          },
          push: { enabled: response.data?.data?.preferences?.notifications?.push || false, vapidKey: '' },
          sms: { enabled: response.data?.data?.preferences?.notifications?.sms || false, provider: '', apiKey: '' },
        },
        backup: {
          enabled: true,
          frequency: 'daily',
          retention: 30,
          location: 'local',
          cloudConfig: {
            provider: '',
            bucket: '',
            accessKey: '',
            secretKey: '',
          },
        },
        api: {
          rateLimit: {
            enabled: true,
            requestsPerMinute: 100,
            requestsPerHour: 1000,
          },
          cors: {
            enabled: true,
            allowedOrigins: ['*'],
          },
          authentication: {
            jwtExpiration: 3600,
            refreshTokenExpiration: 86400,
          },
        },
        performance: {
          cache: {
            enabled: true,
            ttl: 3600,
            maxSize: 100,
          },
          compression: {
            enabled: true,
            level: 6,
          },
          logging: {
            level: 'info',
            retention: 30,
          },
        },
      };
    } catch (error) {
      console.error('获取系统设置失败:', error);
      throw new Error('获取系统设置失败');
    }
  }

  // 获取用户偏好设置
  static async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const response = await api.get('/settings');
      const data = response.data?.data;
      
      return {
        id: '1',
        userId: userId,
        theme: data?.preferences?.theme || 'auto',
        language: data?.preferences?.language || 'zh-CN',
        timezone: 'Asia/Shanghai',
        notifications: data?.preferences?.notifications || {
          email: true,
          push: false,
          sms: false,
        },
        dashboard: {
          layout: 'default',
          widgets: ['overview', 'recent-content', 'analytics'],
        },
        privacy: {
          profileVisibility: 'public',
          activityTracking: true,
          dataSharing: false,
        },
      };
    } catch (error) {
      console.error('获取用户偏好设置失败:', error);
      throw new Error('获取用户偏好设置失败');
    }
  }

  // 更新用户偏好设置
  static async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    try {
      const response = await api.put('/settings', {
        preferences: {
          theme: preferences.theme,
          language: preferences.language,
          notifications: preferences.notifications,
        }
      });
      
      return {
        id: '1',
        userId: userId,
        theme: preferences.theme || 'auto',
        language: preferences.language || 'zh-CN',
        timezone: preferences.timezone || 'Asia/Shanghai',
        notifications: preferences.notifications || {
          email: true,
          push: false,
          sms: false,
        },
        dashboard: preferences.dashboard || {
          layout: 'default',
          widgets: ['overview', 'recent-content', 'analytics'],
        },
        privacy: preferences.privacy || {
          profileVisibility: 'public',
          activityTracking: true,
          dataSharing: false,
        },
      };
    } catch (error) {
      console.error('更新用户偏好设置失败:', error);
      throw new Error('更新用户偏好设置失败');
    }
  }

  // 获取集成配置 - 返回模拟数据
  static async getIntegrations(): Promise<IntegrationConfig[]> {
    // 返回模拟的集成配置数据
    return [
      {
        id: '1',
        name: '知乎',
        type: 'social',
        enabled: true,
        config: {},
        status: 'connected',
        lastSync: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'B站',
        type: 'social',
        enabled: true,
        config: {},
        status: 'connected',
        lastSync: new Date().toISOString(),
      },
      {
        id: '3',
        name: '小红书',
        type: 'social',
        enabled: false,
        config: {},
        status: 'error',
        lastSync: new Date().toISOString(),
      },
    ];
  }

  // 更新集成配置 - 模拟实现
  static async updateIntegration(
    id: string,
    config: Partial<IntegrationConfig>
  ): Promise<IntegrationConfig> {
    // 模拟更新成功
    return {
      id,
      name: config.name || '未知平台',
      type: config.type || 'social',
      enabled: config.enabled || false,
      config: config.config || {},
      status: config.status || 'disconnected',
      lastSync: new Date().toISOString(),
    };
  }

  // 重置系统设置
  static async resetSystemSettings(): Promise<SystemSettings> {
    try {
      const response = await api.post('/settings/reset');
      return await this.getSystemSettings();
    } catch (error) {
      console.error('重置系统设置失败:', error);
      throw new Error('重置系统设置失败');
    }
  }

  // 导出设置
  static async exportSettings(): Promise<string> {
    try {
      const response = await api.get('/settings/export');
      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error('导出设置失败:', error);
      throw new Error('导出设置失败');
    }
  }

  // 导入设置 - 模拟实现
  static async importSettings(
    file: File
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 模拟文件读取和导入
      return {
        success: true,
        message: '设置导入成功'
      };
    } catch (error) {
      console.error('导入设置失败:', error);
      return {
        success: false,
        message: '导入设置失败'
      };
    }
  }
}
