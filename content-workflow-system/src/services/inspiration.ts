import { api } from './api';

// 灵感相关类型定义
export interface Inspiration {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'link' | 'idea';
  category: string;
  tags: string[];
  source?: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  isUsed: boolean;
}

export interface InspirationCategory {
  id: string;
  name: string;
  description: string;
  count: number;
  color: string;
}

export interface InspirationStats {
  totalInspiration: number;
  favoriteCount: number;
  usedCount: number;
  categoryCounts: Record<string, number>;
}

export interface AIInspirationRequest {
  topic: string;
  type: 'article' | 'video' | 'social' | 'general';
  count?: number;
  style?: string;
  audience?: string;
}

// 灵感服务类
export class InspirationService {
  private static apiClient = api;

  // 获取灵感列表
  static async getInspirationList(
    params: {
      page?: number;
      limit?: number;
      category?: string;
      type?: string;
      search?: string;
      isFavorite?: boolean;
    } = {}
  ) {
    const response = await this.apiClient.get('/api/inspiration', { params });
    return response.data;
  }

  // 创建灵感
  static async createInspiration(data: Partial<Inspiration>) {
    const response = await this.apiClient.post('/api/inspiration', data);
    return response.data;
  }

  // 更新灵感
  static async updateInspiration(id: string, data: Partial<Inspiration>) {
    const response = await this.apiClient.put(`/api/inspiration/${id}`, data);
    return response.data;
  }

  // 删除灵感
  static async deleteInspiration(id: string) {
    const response = await this.apiClient.delete(`/api/inspiration/${id}`);
    return response.data;
  }

  // 收藏/取消收藏灵感
  static async toggleFavorite(id: string) {
    const response = await this.apiClient.post(
      `/api/inspiration/${id}/favorite`
    );
    return response.data;
  }

  // 标记为已使用
  static async markAsUsed(id: string) {
    const response = await this.apiClient.post(`/api/inspiration/${id}/used`);
    return response.data;
  }

  // 获取灵感分类
  static async getCategories() {
    const response = await this.apiClient.get('/api/inspiration/categories');
    return response.data;
  }

  // 创建分类
  static async createCategory(data: Partial<InspirationCategory>) {
    const response = await this.apiClient.post(
      '/api/inspiration/categories',
      data
    );
    return response.data;
  }

  // 获取灵感统计
  static async getInspirationStats() {
    const response = await this.apiClient.get('/api/inspiration/stats');
    return response.data;
  }

  // AI 生成灵感
  static async generateAIInspiration(request: AIInspirationRequest) {
    const response = await this.apiClient.post(
      '/api/inspiration/ai-generate',
      request
    );
    return response.data;
  }

  // 批量导入灵感
  static async batchImport(inspirations: Partial<Inspiration>[]) {
    const response = await this.apiClient.post(
      '/api/inspiration/batch-import',
      {
        inspirations,
      }
    );
    return response.data;
  }

  // 搜索灵感
  static async searchInspiration(
    query: string,
    filters?: {
      category?: string;
      type?: string;
      dateRange?: { start: string; end: string };
    }
  ) {
    const response = await this.apiClient.get('/api/inspiration/search', {
      params: { q: query, ...filters },
    });
    return response.data;
  }

  // 获取热点话题
  static async getHotTopics() {
    const response = await this.apiClient.get('/api/inspiration/hot-topics');
    return response.data;
  }

  // 分析话题
  static async analyzeTopics(topicIds: string[]) {
    const response = await this.apiClient.post(
      '/api/inspiration/analyze-topics',
      {
        topicIds,
      }
    );
    return response.data;
  }

  // 内容分类
  static async categorizeContent(analysisIds: string[]) {
    const response = await this.apiClient.post(
      '/api/inspiration/categorize-content',
      {
        analysisIds,
      }
    );
    return response.data;
  }

  // 创建内容计划
  static async createContentPlans(categoryIds: string[]) {
    const response = await this.apiClient.post(
      '/api/inspiration/create-content-plans',
      {
        categoryIds,
      }
    );
    return response.data;
  }
}

// 创建服务实例
export const inspirationService = new InspirationService();

export default InspirationService;
