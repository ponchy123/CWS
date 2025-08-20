import { api } from './api';

// 社交媒体平台类型
export type SocialPlatform = 'twitter' | 'instagram' | 'youtube' | 'tiktok' | 'facebook';

// 社交媒体内容类型
export interface SocialMediaPost {
  id: string;
  platform: SocialPlatform;
  content: string;
  author: {
    name: string;
    username: string;
    avatar?: string;
    verified?: boolean;
  };
  metrics: {
    likes: number;
    shares: number;
    comments: number;
    views?: number;
  };
  createdAt: string;
  url: string;
  media?: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }[];
  hashtags: string[];
  mentions: string[];
}

// 趋势话题
export interface TrendingTopic {
  id: string;
  name: string;
  platform: SocialPlatform;
  volume: number;
  growth: number;
  category: string;
  description?: string;
  relatedHashtags: string[];
}

// 社交媒体分析数据
export interface SocialAnalytics {
  platform: SocialPlatform;
  totalPosts: number;
  totalEngagement: number;
  averageEngagement: number;
  topHashtags: Array<{
    tag: string;
    count: number;
    engagement: number;
  }>;
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  timeDistribution: Array<{
    hour: number;
    posts: number;
    engagement: number;
  }>;
}

// 内容发布计划
export interface PublishPlan {
  id: string;
  content: string;
  platforms: SocialPlatform[];
  scheduledTime: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  media?: {
    type: 'image' | 'video';
    url: string;
  }[];
  hashtags: string[];
  mentions: string[];
}

class SocialMediaService {
  private baseUrl = '/advanced/social';

  // 获取热门内容
  async getTrendingPosts(platform: SocialPlatform, limit: number = 20): Promise<SocialMediaPost[]> {
    try {
      const response = await api.get(`${this.baseUrl}/trending/${platform}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error(`获取${platform}热门内容失败:`, error);
      throw error;
    }
  }

  // 搜索社交媒体内容
  async searchPosts(
    query: string, 
    platforms: SocialPlatform[] = ['twitter', 'instagram'], 
    limit: number = 50
  ): Promise<SocialMediaPost[]> {
    try {
      const response = await api.get(`${this.baseUrl}/search`, {
        params: { 
          query, 
          platforms: platforms.join(','), 
          limit 
        }
      });
      return response.data;
    } catch (error) {
      console.error('搜索社交媒体内容失败:', error);
      throw error;
    }
  }

  // 获取趋势话题
  async getTrendingTopics(platform: SocialPlatform): Promise<TrendingTopic[]> {
    try {
      const response = await api.get(`${this.baseUrl}/trends/${platform}`);
      return response.data;
    } catch (error) {
      console.error(`获取${platform}趋势话题失败:`, error);
      throw error;
    }
  }

  // 获取用户内容
  async getUserPosts(platform: SocialPlatform, username: string, limit: number = 20): Promise<SocialMediaPost[]> {
    try {
      const response = await api.get(`${this.baseUrl}/user/${platform}/${username}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error(`获取用户${username}的${platform}内容失败:`, error);
      throw error;
    }
  }

  // 分析社交媒体数据
  async analyzeSocialData(
    platform: SocialPlatform, 
    timeRange: '24h' | '7d' | '30d' = '7d'
  ): Promise<SocialAnalytics> {
    try {
      const response = await api.get(`${this.baseUrl}/analytics/${platform}`, {
        params: { timeRange }
      });
      return response.data;
    } catch (error) {
      console.error(`分析${platform}数据失败:`, error);
      throw error;
    }
  }

  // 创建发布计划
  async createPublishPlan(plan: Omit<PublishPlan, 'id' | 'status'>): Promise<PublishPlan> {
    try {
      const response = await api.post(`${this.baseUrl}/publish/plan`, plan);
      return response.data;
    } catch (error) {
      console.error('创建发布计划失败:', error);
      throw error;
    }
  }

  // 获取发布计划列表
  async getPublishPlans(status?: PublishPlan['status']): Promise<PublishPlan[]> {
    try {
      const response = await api.get(`${this.baseUrl}/publish/plans`, {
        params: status ? { status } : {}
      });
      return response.data;
    } catch (error) {
      console.error('获取发布计划失败:', error);
      throw error;
    }
  }

  // 执行发布
  async publishContent(planId: string): Promise<{ success: boolean; results: any[] }> {
    try {
      const response = await api.post(`${this.baseUrl}/publish/execute/${planId}`);
      return response.data;
    } catch (error) {
      console.error('发布内容失败:', error);
      throw error;
    }
  }

  // 获取hashtag建议
  async getHashtagSuggestions(content: string, platform: SocialPlatform): Promise<string[]> {
    try {
      const response = await api.post(`${this.baseUrl}/hashtags/suggest`, {
        content,
        platform
      });
      return response.data;
    } catch (error) {
      console.error('获取hashtag建议失败:', error);
      throw error;
    }
  }

  // 分析内容情感
  async analyzeSentiment(content: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    emotions: Array<{
      emotion: string;
      score: number;
    }>;
  }> {
    try {
      const response = await api.post(`${this.baseUrl}/sentiment/analyze`, {
        content
      });
      return response.data;
    } catch (error) {
      console.error('分析内容情感失败:', error);
      throw error;
    }
  }

  // 获取最佳发布时间建议
  async getBestPostTime(platform: SocialPlatform, timezone: string = 'Asia/Shanghai'): Promise<{
    recommendedTimes: Array<{
      hour: number;
      day: number;
      score: number;
      reason: string;
    }>;
    analysis: {
      peakHours: number[];
      peakDays: number[];
      audienceActivity: Array<{
        hour: number;
        activity: number;
      }>;
    };
  }> {
    try {
      const response = await api.get(`${this.baseUrl}/timing/best/${platform}`, {
        params: { timezone }
      });
      return response.data;
    } catch (error) {
      console.error('获取最佳发布时间失败:', error);
      throw error;
    }
  }

  // 内容优化建议
  async getContentOptimization(content: string, platform: SocialPlatform): Promise<{
    score: number;
    suggestions: Array<{
      type: 'length' | 'hashtags' | 'mentions' | 'media' | 'timing';
      message: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    optimizedContent?: string;
  }> {
    try {
      const response = await api.post(`${this.baseUrl}/optimize/content`, {
        content,
        platform
      });
      return response.data;
    } catch (error) {
      console.error('获取内容优化建议失败:', error);
      throw error;
    }
  }

  // 竞品分析
  async analyzeCompetitors(
    competitors: string[], 
    platform: SocialPlatform,
    timeRange: '7d' | '30d' = '30d'
  ): Promise<{
    competitors: Array<{
      username: string;
      followers: number;
      posts: number;
      engagement: number;
      topContent: SocialMediaPost[];
      strategies: string[];
    }>;
    insights: {
      commonHashtags: string[];
      postingPatterns: any;
      contentTypes: any;
      recommendations: string[];
    };
  }> {
    try {
      const response = await api.post(`${this.baseUrl}/competitors/analyze`, {
        competitors,
        platform,
        timeRange
      });
      return response.data;
    } catch (error) {
      console.error('竞品分析失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const socialMediaService = new SocialMediaService();

// 平台配置
export const PLATFORM_CONFIG = {
  twitter: {
    name: 'Twitter',
    maxLength: 280,
    supportsMedia: true,
    supportsHashtags: true,
    supportsMentions: true,
    color: '#1DA1F2'
  },
  instagram: {
    name: 'Instagram',
    maxLength: 2200,
    supportsMedia: true,
    supportsHashtags: true,
    supportsMentions: true,
    color: '#E4405F'
  },
  youtube: {
    name: 'YouTube',
    maxLength: 5000,
    supportsMedia: true,
    supportsHashtags: true,
    supportsMentions: false,
    color: '#FF0000'
  },
  tiktok: {
    name: 'TikTok',
    maxLength: 150,
    supportsMedia: true,
    supportsHashtags: true,
    supportsMentions: true,
    color: '#000000'
  },
  facebook: {
    name: 'Facebook',
    maxLength: 63206,
    supportsMedia: true,
    supportsHashtags: true,
    supportsMentions: true,
    color: '#1877F2'
  }
};

// 工具函数
export const socialMediaUtils = {
  // 提取hashtags
  extractHashtags: (content: string): string[] => {
    const hashtagRegex = /#[\w\u4e00-\u9fff]+/g;
    return content.match(hashtagRegex) || [];
  },

  // 提取mentions
  extractMentions: (content: string): string[] => {
    const mentionRegex = /@[\w\u4e00-\u9fff]+/g;
    return content.match(mentionRegex) || [];
  },

  // 格式化数字
  formatNumber: (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  },

  // 计算参与度
  calculateEngagement: (post: SocialMediaPost): number => {
    const { likes, shares, comments } = post.metrics;
    return likes + shares * 2 + comments * 3;
  },

  // 验证内容长度
  validateContentLength: (content: string, platform: SocialPlatform): boolean => {
    const config = PLATFORM_CONFIG[platform];
    return content.length <= config.maxLength;
  },

  // 生成发布时间建议
  generatePostTimeRecommendations: (analytics: SocialAnalytics) => {
    return analytics.timeDistribution
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 3)
      .map(item => ({
        time: `${item.hour}:00`,
        score: item.engagement,
        reason: `历史数据显示此时段参与度较高`
      }));
  }
};