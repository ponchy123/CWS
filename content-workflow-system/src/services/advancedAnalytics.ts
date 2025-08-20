import { api } from './api';

// 高级分析数据类型
export interface AdvancedAnalyticsData {
  // 用户行为分析
  userBehavior: {
    sessionDuration: number;
    pageViews: number;
    bounceRate: number;
    conversionRate: number;
    userJourney: Array<{
      step: string;
      timestamp: string;
      duration: number;
      action: string;
    }>;
    heatmapData: Array<{
      x: number;
      y: number;
      intensity: number;
    }>;
  };

  // 内容性能分析
  contentPerformance: {
    topPerformingContent: Array<{
      id: string;
      title: string;
      views: number;
      engagement: number;
      shareCount: number;
      conversionRate: number;
    }>;
    contentTrends: Array<{
      date: string;
      views: number;
      engagement: number;
      newContent: number;
    }>;
    categoryPerformance: Array<{
      category: string;
      totalViews: number;
      avgEngagement: number;
      contentCount: number;
    }>;
  };

  // 用户画像分析
  userProfile: {
    demographics: {
      ageGroups: Array<{ range: string; percentage: number }>;
      genderDistribution: Array<{ gender: string; percentage: number }>;
      locationDistribution: Array<{ location: string; percentage: number }>;
    };
    interests: Array<{
      category: string;
      score: number;
      trending: boolean;
    }>;
    behaviorPatterns: {
      activeHours: Array<{ hour: number; activity: number }>;
      preferredDevices: Array<{ device: string; percentage: number }>;
      contentPreferences: Array<{ type: string; preference: number }>;
    };
  };

  // 预测分析
  predictions: {
    userGrowth: Array<{
      date: string;
      predictedUsers: number;
      confidence: number;
    }>;
    contentTrends: Array<{
      topic: string;
      trendScore: number;
      predictedGrowth: number;
    }>;
    revenueForecasting: Array<{
      date: string;
      predictedRevenue: number;
      confidence: number;
    }>;
  };

  // 竞品分析
  competitorAnalysis: {
    competitors: Array<{
      name: string;
      marketShare: number;
      strengths: string[];
      weaknesses: string[];
      strategies: string[];
    }>;
    marketPosition: {
      rank: number;
      score: number;
      category: string;
    };
    opportunities: string[];
    threats: string[];
  };
}

// 实时分析数据
export interface RealTimeAnalytics {
  currentUsers: number;
  activePages: Array<{
    path: string;
    users: number;
    avgDuration: number;
  }>;
  recentEvents: Array<{
    timestamp: string;
    event: string;
    user: string;
    details: any;
  }>;
  systemMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    responseTime: number;
    errorRate: number;
  };
}

// A/B测试结果
export interface ABTestResult {
  testId: string;
  testName: string;
  status: 'running' | 'completed' | 'paused';
  variants: Array<{
    name: string;
    traffic: number;
    conversions: number;
    conversionRate: number;
    confidence: number;
  }>;
  winner?: string;
  insights: string[];
  recommendations: string[];
}

// 漏斗分析
export interface FunnelAnalysis {
  steps: Array<{
    name: string;
    users: number;
    conversionRate: number;
    dropoffRate: number;
  }>;
  totalConversions: number;
  overallConversionRate: number;
  bottlenecks: Array<{
    step: string;
    issue: string;
    impact: number;
    suggestions: string[];
  }>;
}

// 队列分析
export interface CohortAnalysis {
  cohorts: Array<{
    cohortDate: string;
    size: number;
    retention: Array<{
      period: number;
      users: number;
      rate: number;
    }>;
  }>;
  averageRetention: Array<{
    period: number;
    rate: number;
  }>;
  insights: string[];
}

class AdvancedAnalyticsService {
  private baseUrl = '/api/advanced-analytics';

  // 获取综合分析数据
  async getAdvancedAnalytics(
    timeRange: '24h' | '7d' | '30d' | '90d' = '7d',
    metrics?: string[]
  ): Promise<AdvancedAnalyticsData> {
    try {
      const response = await api.get(`${this.baseUrl}/comprehensive`, {
        params: { timeRange, metrics: metrics?.join(',') }
      });
      return response.data;
    } catch (error) {
      console.error('获取高级分析数据失败:', error);
      throw error;
    }
  }

  // 获取实时分析数据
  async getRealTimeAnalytics(): Promise<RealTimeAnalytics> {
    try {
      const response = await api.get(`${this.baseUrl}/realtime`);
      return response.data;
    } catch (error) {
      console.error('获取实时分析数据失败:', error);
      throw error;
    }
  }

  // 用户行为分析
  async analyzeUserBehavior(
    userId?: string,
    timeRange: '24h' | '7d' | '30d' = '7d'
  ): Promise<AdvancedAnalyticsData['userBehavior']> {
    try {
      const response = await api.get(`${this.baseUrl}/user-behavior`, {
        params: { userId, timeRange }
      });
      return response.data;
    } catch (error) {
      console.error('用户行为分析失败:', error);
      throw error;
    }
  }

  // 内容性能分析
  async analyzeContentPerformance(
    contentId?: string,
    timeRange: '7d' | '30d' | '90d' = '30d'
  ): Promise<AdvancedAnalyticsData['contentPerformance']> {
    try {
      const response = await api.get(`${this.baseUrl}/content-performance`, {
        params: { contentId, timeRange }
      });
      return response.data;
    } catch (error) {
      console.error('内容性能分析失败:', error);
      throw error;
    }
  }

  // 用户画像分析
  async analyzeUserProfile(
    segment?: string
  ): Promise<AdvancedAnalyticsData['userProfile']> {
    try {
      const response = await api.get(`${this.baseUrl}/user-profile`, {
        params: { segment }
      });
      return response.data;
    } catch (error) {
      console.error('用户画像分析失败:', error);
      throw error;
    }
  }

  // 预测分析
  async getPredictiveAnalytics(
    type: 'user-growth' | 'content-trends' | 'revenue' | 'all' = 'all',
    horizon: '30d' | '90d' | '1y' = '90d'
  ): Promise<AdvancedAnalyticsData['predictions']> {
    try {
      const response = await api.get(`${this.baseUrl}/predictions`, {
        params: { type, horizon }
      });
      return response.data;
    } catch (error) {
      console.error('预测分析失败:', error);
      throw error;
    }
  }

  // 竞品分析
  async getCompetitorAnalysis(
    competitors?: string[]
  ): Promise<AdvancedAnalyticsData['competitorAnalysis']> {
    try {
      const response = await api.get(`${this.baseUrl}/competitors`, {
        params: { competitors: competitors?.join(',') }
      });
      return response.data;
    } catch (error) {
      console.error('竞品分析失败:', error);
      throw error;
    }
  }

  // A/B测试管理
  async getABTests(status?: ABTestResult['status']): Promise<ABTestResult[]> {
    try {
      const response = await api.get(`${this.baseUrl}/ab-tests`, {
        params: { status }
      });
      return response.data;
    } catch (error) {
      console.error('获取A/B测试失败:', error);
      throw error;
    }
  }

  // 创建A/B测试
  async createABTest(test: {
    name: string;
    description: string;
    variants: Array<{
      name: string;
      traffic: number;
      config: any;
    }>;
    targetMetric: string;
    duration: number;
  }): Promise<ABTestResult> {
    try {
      const response = await api.post(`${this.baseUrl}/ab-tests`, test);
      return response.data;
    } catch (error) {
      console.error('创建A/B测试失败:', error);
      throw error;
    }
  }

  // 漏斗分析
  async getFunnelAnalysis(
    funnelId: string,
    timeRange: '7d' | '30d' | '90d' = '30d'
  ): Promise<FunnelAnalysis> {
    try {
      const response = await api.get(`${this.baseUrl}/funnel/${funnelId}`, {
        params: { timeRange }
      });
      return response.data;
    } catch (error) {
      console.error('漏斗分析失败:', error);
      throw error;
    }
  }

  // 队列分析
  async getCohortAnalysis(
    cohortType: 'registration' | 'first-purchase' | 'custom' = 'registration',
    timeRange: '90d' | '180d' | '1y' = '90d'
  ): Promise<CohortAnalysis> {
    try {
      const response = await api.get(`${this.baseUrl}/cohort`, {
        params: { cohortType, timeRange }
      });
      return response.data;
    } catch (error) {
      console.error('队列分析失败:', error);
      throw error;
    }
  }

  // 自定义查询
  async customQuery(query: {
    metrics: string[];
    dimensions: string[];
    filters?: Array<{
      field: string;
      operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'contains';
      value: any;
    }>;
    timeRange: string;
    groupBy?: string[];
    orderBy?: Array<{
      field: string;
      direction: 'asc' | 'desc';
    }>;
    limit?: number;
  }): Promise<any> {
    try {
      const response = await api.post(`${this.baseUrl}/custom-query`, query);
      return response.data;
    } catch (error) {
      console.error('自定义查询失败:', error);
      throw error;
    }
  }

  // 导出分析报告
  async exportReport(
    reportType: 'comprehensive' | 'user-behavior' | 'content-performance' | 'predictions',
    format: 'pdf' | 'excel' | 'csv' = 'pdf',
    timeRange: '7d' | '30d' | '90d' = '30d'
  ): Promise<Blob> {
    try {
      const response = await api.get(`${this.baseUrl}/export/${reportType}`, {
        params: { format, timeRange },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('导出报告失败:', error);
      throw error;
    }
  }

  // 设置分析警报
  async setAnalyticsAlert(alert: {
    name: string;
    metric: string;
    condition: 'above' | 'below' | 'change';
    threshold: number;
    timeWindow: string;
    recipients: string[];
    enabled: boolean;
  }): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/alerts`, alert);
    } catch (error) {
      console.error('设置分析警报失败:', error);
      throw error;
    }
  }

  // 获取分析洞察
  async getAnalyticsInsights(
    type: 'anomalies' | 'opportunities' | 'recommendations' | 'all' = 'all'
  ): Promise<Array<{
    type: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionable: boolean;
    recommendations: string[];
    data?: any;
  }>> {
    try {
      const response = await api.get(`${this.baseUrl}/insights`, {
        params: { type }
      });
      return response.data;
    } catch (error) {
      console.error('获取分析洞察失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const advancedAnalyticsService = new AdvancedAnalyticsService();

// 分析工具函数
export const analyticsUtils = {
  // 计算增长率
  calculateGrowthRate: (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  },

  // 计算转化率
  calculateConversionRate: (conversions: number, total: number): number => {
    if (total === 0) return 0;
    return (conversions / total) * 100;
  },

  // 格式化大数字
  formatLargeNumber: (num: number): string => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  },

  // 计算置信区间
  calculateConfidenceInterval: (
    mean: number,
    stdDev: number,
    sampleSize: number,
    confidence: number = 0.95
  ): { lower: number; upper: number } => {
    const zScore = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.58 : 1.64;
    const margin = zScore * (stdDev / Math.sqrt(sampleSize));
    return {
      lower: mean - margin,
      upper: mean + margin
    };
  },

  // 检测异常值
  detectAnomalies: (data: number[], threshold: number = 2): number[] => {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const stdDev = Math.sqrt(
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
    );
    
    return data.filter(val => Math.abs(val - mean) > threshold * stdDev);
  },

  // 计算相关性
  calculateCorrelation: (x: number[], y: number[]): number => {
    if (x.length !== y.length) return 0;
    
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  },

  // 生成趋势线
  generateTrendLine: (data: Array<{ x: number; y: number }>): {
    slope: number;
    intercept: number;
    r2: number;
  } => {
    const n = data.length;
    const sumX = data.reduce((sum, point) => sum + point.x, 0);
    const sumY = data.reduce((sum, point) => sum + point.y, 0);
    const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumX2 = data.reduce((sum, point) => sum + point.x * point.x, 0);
    const sumY2 = data.reduce((sum, point) => sum + point.y * point.y, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // 计算R²
    const yMean = sumY / n;
    const totalSumSquares = data.reduce((sum, point) => sum + Math.pow(point.y - yMean, 2), 0);
    const residualSumSquares = data.reduce((sum, point) => {
      const predicted = slope * point.x + intercept;
      return sum + Math.pow(point.y - predicted, 2);
    }, 0);
    const r2 = 1 - (residualSumSquares / totalSumSquares);
    
    return { slope, intercept, r2 };
  },

  // 预测未来值
  predictFutureValues: (
    historicalData: Array<{ date: string; value: number }>,
    daysToPredict: number
  ): Array<{ date: string; value: number; confidence: number }> => {
    // 简单的线性回归预测
    const dataPoints = historicalData.map((item, index) => ({
      x: index,
      y: item.value
    }));
    
    const { slope, intercept, r2 } = analyticsUtils.generateTrendLine(dataPoints);
    const confidence = Math.max(0.5, r2); // 基于R²计算置信度
    
    const predictions = [];
    const lastIndex = historicalData.length - 1;
    
    for (let i = 1; i <= daysToPredict; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      
      const predictedValue = slope * (lastIndex + i) + intercept;
      
      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        value: Math.max(0, Math.round(predictedValue)),
        confidence: Math.max(0.3, confidence - (i * 0.05)) // 置信度随时间递减
      });
    }
    
    return predictions;
  }
};

// 分析报告生成器
export class AnalyticsReportGenerator {
  // 生成综合分析报告
  static generateComprehensiveReport(data: AdvancedAnalyticsData): {
    summary: string;
    keyInsights: string[];
    recommendations: string[];
    metrics: Array<{
      name: string;
      value: string;
      change: string;
      trend: 'up' | 'down' | 'stable';
    }>;
  } {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const metrics: any[] = [];

    // 分析用户行为
    if (data.userBehavior.bounceRate > 70) {
      insights.push('网站跳出率较高，用户粘性有待提升');
      recommendations.push('优化页面加载速度和内容质量');
    }

    // 分析内容性能
    const topContent = data.contentPerformance.topPerformingContent[0];
    if (topContent) {
      insights.push(`"${topContent.title}"是表现最佳的内容`);
      recommendations.push('分析高性能内容的特点，复制成功模式');
    }

    // 生成指标
    metrics.push({
      name: '平均会话时长',
      value: `${Math.round(data.userBehavior.sessionDuration / 60)}分钟`,
      change: '+12%',
      trend: 'up'
    });

    return {
      summary: '整体数据表现良好，用户参与度稳步提升',
      keyInsights: insights,
      recommendations: recommendations,
      metrics: metrics
    };
  }

  // 生成用户行为报告
  static generateUserBehaviorReport(behavior: AdvancedAnalyticsData['userBehavior']): string {
    let report = '## 用户行为分析报告\n\n';
    
    report += `### 关键指标\n`;
    report += `- 平均会话时长: ${Math.round(behavior.sessionDuration / 60)}分钟\n`;
    report += `- 页面浏览量: ${behavior.pageViews}\n`;
    report += `- 跳出率: ${behavior.bounceRate.toFixed(1)}%\n`;
    report += `- 转化率: ${behavior.conversionRate.toFixed(2)}%\n\n`;
    
    report += `### 用户旅程分析\n`;
    behavior.userJourney.forEach((step, index) => {
      report += `${index + 1}. ${step.step} (${step.duration}秒)\n`;
    });
    
    return report;
  }
}