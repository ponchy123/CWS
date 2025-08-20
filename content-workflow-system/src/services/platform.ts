import { api } from './api';

// 平台集成相关接口
interface PlatformIntegration {
  id: number;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  apiVersion: string;
  lastSync: string | null;
  totalPosts: number;
  monthlyQuota: number;
  usedQuota: number;
  features: string[];
  icon: string;
  color: string;
  health: number;
  error?: string;
}

interface ApiLog {
  id: number;
  platform: string;
  action: string;
  status: 'success' | 'error';
  timestamp: string;
  responseTime: number;
  details: string;
}

interface WebhookEvent {
  id: number;
  platform: string;
  event: string;
  url: string;
  status: 'active' | 'inactive';
  lastTriggered: string;
}

interface PlatformStats {
  connectedPlatforms: number;
  totalApiCalls: number;
  totalPosts: number;
  averageHealth: number;
}

interface ConnectionTestResult {
  success: boolean;
  message: string;
}

export const platformService = {
  // 获取平台集成列表
  async getPlatformIntegrations(): Promise<PlatformIntegration[]> {
    const response = await api.get('/api/platforms/integrations');
    return response.data;
  },

  // 获取API调用日志
  async getApiLogs(): Promise<ApiLog[]> {
    const response = await api.get('/api/platforms/logs');
    return response.data;
  },

  // 获取Webhook事件
  async getWebhookEvents(): Promise<WebhookEvent[]> {
    const response = await api.get('/api/platforms/webhooks');
    return response.data;
  },

  // 获取平台统计数据
  async getPlatformStats(): Promise<PlatformStats> {
    const response = await api.get('/api/platforms/stats');
    return response.data;
  },

  // 连接平台
  async connectPlatform(platformId: number): Promise<void> {
    await api.post(`/api/platforms/${platformId}/connect`);
  },

  // 断开平台连接
  async disconnectPlatform(platformId: number): Promise<void> {
    await api.post(`/api/platforms/${platformId}/disconnect`);
  },

  // 刷新平台数据
  async refreshPlatform(platformId: number): Promise<void> {
    await api.post(`/api/platforms/${platformId}/refresh`);
  },

  // 测试连接
  async testConnection(platformId: number): Promise<ConnectionTestResult> {
    const response = await api.post(`/api/platforms/${platformId}/test`);
    return response.data;
  },

  // 添加平台集成
  async addPlatformIntegration(platformData: unknown): Promise<void> {
    await api.post('/api/platforms/integrations', platformData);
  },

  // 更新平台设置
  async updatePlatformSettings(
    platformId: number,
    settings: unknown
  ): Promise<void> {
    await api.put(`/api/platforms/${platformId}/settings`, settings);
  },

  // 切换Webhook状态
  async toggleWebhook(webhookId: number, enabled: boolean): Promise<void> {
    await api.put(`/api/platforms/webhooks/${webhookId}`, { enabled });
  },

  // 更新系统设置
  async updateSystemSettings(settings: unknown): Promise<void> {
    await api.put('/api/platforms/system-settings', settings);
  },

  // 添加Webhook
  async addWebhook(webhookData: unknown): Promise<void> {
    await api.post('/api/platforms/webhooks', webhookData);
  },

  // 删除Webhook
  async deleteWebhook(webhookId: number): Promise<void> {
    await api.delete(`/api/platforms/webhooks/${webhookId}`);
  },

  // 获取平台详情
  async getPlatformDetails(platformId: number): Promise<PlatformIntegration> {
    const response = await api.get(`/api/platforms/${platformId}`);
    return response.data;
  },

  // 重新授权平台
  async reauthorizePlatform(platformId: number, authData: unknown): Promise<void> {
    await api.post(`/api/platforms/${platformId}/reauthorize`, authData);
  },

  // 获取平台配置模板
  async getPlatformConfigTemplate(platformType: string): Promise<unknown> {
    const response = await api.get(
      `/api/platforms/config-template/${platformType}`
    );
    return response.data;
  },

  // 验证API密钥
  async validateApiKey(platformType: string, apiKey: string): Promise<boolean> {
    const response = await api.post('/api/platforms/validate-key', {
      platformType,
      apiKey,
    });
    return response.data.valid;
  },
};
