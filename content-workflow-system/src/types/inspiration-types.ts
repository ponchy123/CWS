// 定义类型
export type PlatformType = '微博' | '知乎' | '抖音' | '小红书' | '百度';

export interface PlatformConfig {
  emoji: string;
  color: string;
  url: string;
}

export type CategoryType =
  | '科技'
  | '生活'
  | '娱乐'
  | '财经'
  | '教育'
  | '时尚'
  | '体育'
  | '社会'
  | '汽车'
  | '旅游';

export interface CategoryConfig {
  emoji: string;
  color: string;
  description: string;
}

// 定义接口
export interface HotTopic {
  id: string;
  topic: string;
  platform: PlatformType;
  heat: number;
  trend?: string;
  originalUrl?: string;
  timestamp?: string;
  description?: string;
  publishTime?: string;
  sourceUrl?: string;
  engagement: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
}

export interface AnalysisResult {
  id: string;
  topic: string;
  platform: PlatformType;
  sourceUrl?: string;
  description?: string;
  analysis: {
    sentiment: string;
    difficulty: string;
    keywords: string[];
    targetAudience: string[];
    contentType: string;
    recommendedPlatforms: string[];
    popularity: {
      score: number;
      level: string;
    };
    trend: {
      direction: string;
      detailedDirection: string;
      peakTime: string;
      duration: string;
    };
    competitiveness: number;
    viralPotential: number;
    engagementRate: string;
    bestPostTime: string;
    contentSuggestions: string[];
    riskAssessment: {
      level: string;
      factors: string[];
      score: number;
    };
    commercialValue: {
      monetizationPotential: number;
      brandSafety: string;
      advertisingFriendly: boolean;
    };
    creationComplexity: {
      timeRequired: string;
      resourcesNeeded: string;
      skillLevel: string;
    };
  };
}

export interface CategorizedResult extends AnalysisResult {
  category: CategoryType;
  tags: string[];
  categoryInfo?: {
    emoji: string;
    color: string;
    description: string;
  };
  createdAt: string;
  lastUpdated: string;
}

export interface ContentPlan {
  id: string;
  title: string;
  platform: PlatformType;
  contentType: string;
  priority: string;
  estimatedTime: string;
  targetAudience: string;
  keywords: string;
  publishTime: string;
  expectedEngagement: string;
  status: string;
  description: string;
  tasks: string[];
}
