import { api } from './api';

// 内容相关的类型定义
export interface Content {
  id: string;
  title: string;
  content: string;
  type: 'article' | 'video' | 'image' | 'audio';
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  author: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  platforms: string[];
  analytics?: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: 'article' | 'video' | 'image' | 'audio';
  template: string;
  variables: string[];
  category: string;
  createdAt: string;
}

export interface ContentPlan {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'draft' | 'scheduled' | 'published';
  platforms: string[];
  tags: string[];
}

export interface ContentVersion {
  id: string;
  contentId: string;
  version: string;
  title: string;
  content: string;
  createdAt: string;
  author: string;
}

export interface ContentAnalysis {
  readability: number;
  sentiment: string;
  keywords: string[];
  suggestions: string[];
}

export interface ContentListParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  author?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ContentStats {
  totalContent: number;
  publishedContent: number;
  draftContent: number;
  scheduledContent: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 内容服务类
export class ContentService {
  private static apiClient = api;

  // 获取内容列表
  static async getContentList(
    params: ContentListParams = {}
  ): Promise<PaginationResponse<Content>> {
    const response = await this.apiClient.get('/api/content', { params });
    return response.data;
  }

  // 获取内容详情
  static async getContentById(id: string) {
    const response = await this.apiClient.get(`/api/content/${id}`);
    return response.data;
  }

  // 创建内容
  static async createContent(content: Partial<Content>) {
    const response = await this.apiClient.post('/api/content', content);
    return response.data;
  }

  // 更新内容
  static async updateContent(id: string, content: Partial<Content>) {
    const response = await this.apiClient.put(`/api/content/${id}`, content);
    return response.data;
  }

  // 删除内容
  static async deleteContent(id: string) {
    const response = await this.apiClient.delete(`/api/content/${id}`);
    return response.data;
  }

  // 发布内容
  static async publishContent(data: unknown) {
    const response = await this.apiClient.post('/api/content/publish', data);
    return response.data;
  }

  // 获取内容模板列表
  static async getContentTemplates(params: Record<string, unknown> = {}) {
    const response = await this.apiClient.get('/api/content/templates', {
      params,
    });
    return response.data;
  }

  // 获取内容统计
  static async getContentStats() {
    const response = await this.apiClient.get('/api/content/stats');
    return response.data;
  }

  // 搜索内容
  static async searchContent(
    query: string,
    filters?: Partial<ContentListParams>
  ) {
    const response = await this.apiClient.get('/api/content/search', {
      params: { q: query, ...filters },
    });
    return response.data;
  }

  // 批量操作内容
  static async batchUpdateContent(ids: string[], updates: Partial<Content>) {
    const response = await this.apiClient.post('/api/content/batch', {
      ids,
      updates,
    });
    return response.data;
  }

  // 获取内容分析数据
  static async getContentAnalytics(
    id: string,
    dateRange?: { start: string; end: string }
  ) {
    const response = await this.apiClient.get(`/api/content/${id}/analytics`, {
      params: dateRange,
    });
    return response.data;
  }

  // 获取内容计划
  static async getContentPlans(params: Record<string, unknown> = {}) {
    const response = await this.apiClient.get('/api/content/plans', { params });
    return response.data;
  }

  // 创建内容计划
  static async createContentPlan(data: unknown) {
    const response = await this.apiClient.post('/api/content/plans', data);
    return response.data;
  }

  // 删除内容计划
  static async deleteContentPlan(id: string) {
    const response = await this.apiClient.delete(`/api/content/plans/${id}`);
    return response.data;
  }

  // 更新内容计划状态
  static async updateContentPlanStatus(id: string, status: string) {
    const response = await this.apiClient.put(
      `/api/content/plans/${id}/status`,
      { status }
    );
    return response.data;
  }

  // 获取内容版本
  static async getContentVersions(params: Record<string, unknown> = {}) {
    const response = await this.apiClient.get('/api/content/versions', {
      params,
    });
    return response.data;
  }

  // 获取单个内容版本
  static async getContentVersion(id: string) {
    const response = await this.apiClient.get(`/api/content/versions/${id}`);
    return response.data;
  }

  // 分析内容
  static async analyzeContent(content: string): Promise<ContentAnalysis> {
    const response = await this.apiClient.post('/api/content/analyze', {
      content,
    });
    return response.data;
  }

  // 生成标题
  static async generateTitle(content: string): Promise<string[]> {
    const response = await this.apiClient.post('/api/content/generate-title', {
      content,
    });
    return response.data;
  }

  // 生成大纲
  static async generateOutline(topic: string): Promise<string[]> {
    const response = await this.apiClient.post(
      '/api/content/generate-outline',
      { topic }
    );
    return response.data;
  }

  // 扩展内容
  static async expandContent(outline: string): Promise<string> {
    const response = await this.apiClient.post('/api/content/expand', {
      outline,
    });
    return response.data;
  }

  // SEO优化
  static async optimizeSEO(content: string): Promise<unknown> {
    const response = await this.apiClient.post('/api/content/optimize-seo', {
      content,
    });
    return response.data;
  }

  // 平台适配
  static async adaptToPlatform(
    content: string,
    platform: string
  ): Promise<string> {
    const response = await this.apiClient.post('/api/content/adapt-platform', {
      content,
      platform,
    });
    return response.data;
  }

  // 情感分析
  static async analyzeSentiment(content: string): Promise<unknown> {
    const response = await this.apiClient.post(
      '/api/content/analyze-sentiment',
      { content }
    );
    return response.data;
  }

  // 保存草稿
  static async saveDraft(data: unknown) {
    const response = await this.apiClient.post('/api/content/draft', data);
    return response.data;
  }

  // 获取素材
  static async getMaterials(params: Record<string, unknown> = {}) {
    const response = await this.apiClient.get('/api/content/materials', {
      params,
    });
    return response.data;
  }

  // 上传封面
  static async uploadCover(file: File) {
    const formData = new FormData();
    formData.append('cover', file);
    const response = await this.apiClient.post(
      '/api/content/upload-cover',
      formData
    );
    return response.data;
  }
}

// 创建服务实例
export const contentService = new ContentService();

export default ContentService;
