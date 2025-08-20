import { api } from './api';

// 发布相关类型定义
export interface PublishTask {
  id: string;
  contentId: string;
  title: string;
  platforms: string[];
  scheduledAt?: string;
  status: 'pending' | 'publishing' | 'published' | 'failed' | 'cancelled';
  createdAt: string;
  publishedAt?: string;
  results?: PublishResult[];
}

export interface PublishResult {
  platform: string;
  status: 'success' | 'failed';
  platformId?: string;
  url?: string;
  error?: string;
  publishedAt: string;
}

export interface PublishConfig {
  platform: string;
  settings: Record<string, unknown>;
  enabled: boolean;
}

export interface PublishStats {
  totalTasks: number;
  pendingTasks: number;
  publishedTasks: number;
  failedTasks: number;
  successRate: number;
}

// 发布服务类
export class PublishService {
  private static apiClient = api;

  // 获取发布任务列表
  static async getPublishTasks(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      platform?: string;
    } = {}
  ) {
    const response = await this.apiClient.get('/api/publish/tasks', { params });
    return response.data;
  }

  // 创建发布任务
  static async createPublishTask(data: {
    contentId: string;
    platforms: string[];
    scheduledAt?: string;
  }) {
    const response = await this.apiClient.post('/api/publish/tasks', data);
    return response.data;
  }

  // 取消发布任务
  static async cancelPublishTask(id: string) {
    const response = await this.apiClient.post(
      `/api/publish/tasks/${id}/cancel`
    );
    return response.data;
  }

  // 重试发布任务
  static async retryPublishTask(id: string) {
    const response = await this.apiClient.post(
      `/api/publish/tasks/${id}/retry`
    );
    return response.data;
  }

  // 获取发布配置
  static async getPublishConfigs() {
    const response = await this.apiClient.get('/api/publish/configs');
    return response.data;
  }

  // 更新发布配置
  static async updatePublishConfig(platform: string, config: PublishConfig) {
    const response = await this.apiClient.put(
      `/api/publish/configs/${platform}`,
      config
    );
    return response.data;
  }

  // 获取发布统计
  static async getPublishStats() {
    const response = await this.apiClient.get('/api/publish/stats');
    return response.data;
  }

  // 立即发布
  static async publishNow(contentId: string, platforms: string[]) {
    const response = await this.apiClient.post('/api/publish/now', {
      contentId,
      platforms,
    });
    return response.data;
  }

  // 获取支持的平台列表
  static async getPlatforms() {
    const response = await this.apiClient.get('/api/publish/platforms');
    return response.data;
  }

  // 更新发布任务
  static async updatePublishTask(id: string, data: Partial<PublishTask>) {
    const response = await this.apiClient.put(`/api/publish/tasks/${id}`, data);
    return response.data;
  }

  // 删除发布任务
  static async deletePublishTask(id: string) {
    const response = await this.apiClient.delete(`/api/publish/tasks/${id}`);
    return response.data;
  }

  // 立即发布任务
  static async publishTaskNow(id: string) {
    const response = await this.apiClient.post(
      `/api/publish/tasks/${id}/publish`
    );
    return response.data;
  }

  // 暂停发布任务
  static async pausePublishTask(id: string) {
    const response = await this.apiClient.post(
      `/api/publish/tasks/${id}/pause`
    );
    return response.data;
  }
}

// 创建服务实例
export const publishService = new PublishService();

export default PublishService;
