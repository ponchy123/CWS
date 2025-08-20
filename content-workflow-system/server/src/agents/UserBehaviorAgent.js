/**
 * 用户行为分析 Agent
 * 负责用户行为数据的收集、分析和个性化推荐
 */

const BaseAgent = require('./BaseAgent');
const { logger } = require('../config/logger');

class UserBehaviorAgent extends BaseAgent {
  constructor(options = {}) {
    super('user_behavior', {
      timeout: 40000,
      maxRetries: 2,
      ...options
    });
    
    // 行为类型定义
    this.behaviorTypes = {
      view: '浏览',
      like: '点赞',
      share: '分享',
      comment: '评论',
      bookmark: '收藏',
      follow: '关注',
      search: '搜索',
      click: '点击'
    };
    
    // 用户画像维度
    this.profileDimensions = {
      interests: '兴趣偏好',
      activity_time: '活跃时间',
      content_preference: '内容偏好',
      platform_usage: '平台使用',
      engagement_level: '参与度',
      demographic: '人口统计'
    };
    
    this.setupMiddleware();
  }

  setupMiddleware() {
    // 输入验证中间件
    this.use(async (context, next) => {
      const { input } = context;
      
      if (!input.userId && !input.sessionId) {
        throw new Error('需要提供用户ID或会话ID');
      }
      
      if (input.analysisType && !['profile', 'recommendation', 'behavior_pattern', 'engagement'].includes(input.analysisType)) {
        throw new Error('不支持的分析类型');
      }
      
      await next();
    });
    
    // 数据预处理中间件
    this.use(async (context, next) => {
      const { input } = context;
      
      // 标准化用户标识
      input.userIdentifier = input.userId || input.sessionId;
      
      // 设置默认时间范围
      if (!input.timeRange) {
        input.timeRange = '7d'; // 默认7天
      }
      
      // 解析时间范围
      input.timeRangeMs = this.parseTimeRange(input.timeRange);
      
      logger.debug('用户行为分析预处理完成', {
        agentName: this.name,
        userIdentifier: input.userIdentifier,
        timeRange: input.timeRange,
        analysisType: input.analysisType
      });
      
      await next();
    });
  }

  async execute(input, context = {}) {
    const { 
      userIdentifier, 
      analysisType = 'profile', 
      timeRange, 
      includeRecommendations = true 
    } = input;
    
    logger.info('开始用户行为分析', {
      agentName: this.name,
      userIdentifier,
      analysisType,
      timeRange,
      type: 'user_behavior_analysis_start'
    });
    
    try {
      let result = {};
      
      switch (analysisType) {
        case 'profile':
          result = await this.analyzeUserProfile(userIdentifier, input);
          break;
        case 'recommendation':
          result = await this.generateRecommendations(userIdentifier, input);
          break;
        case 'behavior_pattern':
          result = await this.analyzeBehaviorPatterns(userIdentifier, input);
          break;
        case 'engagement':
          result = await this.analyzeEngagement(userIdentifier, input);
          break;
        default:
          // 综合分析
          result = await this.performComprehensiveAnalysis(userIdentifier, input);
      }
      
      // 添加推荐（如果需要）
      if (includeRecommendations && analysisType !== 'recommendation') {
        result.recommendations = await this.generateQuickRecommendations(userIdentifier, result);
      }
      
      // 添加元数据
      result.metadata = {
        userIdentifier,
        analysisType,
        timeRange,
        timestamp: new Date().toISOString(),
        agentVersion: '1.0.0'
      };
      
      logger.info('用户行为分析完成', {
        agentName: this.name,
        userIdentifier,
        analysisType,
        type: 'user_behavior_analysis_completion'
      });
      
      return result;
      
    } catch (error) {
      logger.error('用户行为分析失败', {
        agentName: this.name,
        userIdentifier,
        analysisType,
        error: error.message
      }, error);
      
      throw error;
    }
  }

  async analyzeUserProfile(userIdentifier, input) {
    logger.debug('开始用户画像分析', { userIdentifier });
    
    // 获取用户行为数据
    const behaviorData = await this.fetchUserBehaviorData(userIdentifier, input.timeRangeMs);
    
    // 分析各个维度
    const profile = {
      interests: await this.analyzeInterests(behaviorData),
      activityTime: await this.analyzeActivityTime(behaviorData),
      contentPreference: await this.analyzeContentPreference(behaviorData),
      platformUsage: await this.analyzePlatformUsage(behaviorData),
      engagementLevel: await this.analyzeEngagementLevel(behaviorData),
      demographic: await this.analyzeDemographic(behaviorData)
    };
    
    // 生成用户标签
    const tags = this.generateUserTags(profile);
    
    // 计算用户价值评分
    const valueScore = this.calculateUserValue(profile, behaviorData);
    
    return {
      userIdentifier,
      profile,
      tags,
      valueScore,
      behaviorSummary: this.generateBehaviorSummary(behaviorData),
      lastUpdated: new Date().toISOString()
    };
  }

  async generateRecommendations(userIdentifier, input) {
    logger.debug('开始生成个性化推荐', { userIdentifier });
    
    // 获取用户画像
    const userProfile = await this.analyzeUserProfile(userIdentifier, input);
    
    // 获取候选内容
    const candidateContent = await this.fetchCandidateContent(input);
    
    // 生成推荐
    const recommendations = {
      content: await this.recommendContent(userProfile, candidateContent),
      topics: await this.recommendTopics(userProfile),
      platforms: await this.recommendPlatforms(userProfile),
      timing: await this.recommendOptimalTiming(userProfile)
    };
    
    // 计算推荐置信度
    recommendations.confidence = this.calculateRecommendationConfidence(recommendations, userProfile);
    
    return {
      userIdentifier,
      recommendations,
      userProfile: userProfile.profile,
      generatedAt: new Date().toISOString()
    };
  }

  async analyzeBehaviorPatterns(userIdentifier, input) {
    logger.debug('开始行为模式分析', { userIdentifier });
    
    const behaviorData = await this.fetchUserBehaviorData(userIdentifier, input.timeRangeMs);
    
    const patterns = {
      temporal: await this.analyzeTemporalPatterns(behaviorData),
      sequential: await this.analyzeSequentialPatterns(behaviorData),
      frequency: await this.analyzeFrequencyPatterns(behaviorData),
      preference: await this.analyzePreferencePatterns(behaviorData)
    };
    
    // 识别异常行为
    const anomalies = await this.detectAnomalies(behaviorData, patterns);
    
    // 预测未来行为
    const predictions = await this.predictFutureBehavior(patterns);
    
    return {
      userIdentifier,
      patterns,
      anomalies,
      predictions,
      analysisDate: new Date().toISOString()
    };
  }

  async analyzeEngagement(userIdentifier, input) {
    logger.debug('开始参与度分析', { userIdentifier });
    
    const behaviorData = await this.fetchUserBehaviorData(userIdentifier, input.timeRangeMs);
    
    const engagement = {
      overall: this.calculateOverallEngagement(behaviorData),
      byContent: this.calculateContentEngagement(behaviorData),
      byPlatform: this.calculatePlatformEngagement(behaviorData),
      byTime: this.calculateTimeBasedEngagement(behaviorData),
      trends: this.calculateEngagementTrends(behaviorData)
    };
    
    // 参与度等级
    engagement.level = this.classifyEngagementLevel(engagement.overall);
    
    // 改进建议
    engagement.improvements = this.generateEngagementImprovements(engagement);
    
    return {
      userIdentifier,
      engagement,
      benchmarks: this.getEngagementBenchmarks(),
      analysisDate: new Date().toISOString()
    };
  }

  async performComprehensiveAnalysis(userIdentifier, input) {
    logger.debug('开始综合分析', { userIdentifier });
    
    // 并行执行各种分析
    const [profile, patterns, engagement] = await Promise.all([
      this.analyzeUserProfile(userIdentifier, input),
      this.analyzeBehaviorPatterns(userIdentifier, input),
      this.analyzeEngagement(userIdentifier, input)
    ]);
    
    // 生成综合洞察
    const insights = this.generateComprehensiveInsights(profile, patterns, engagement);
    
    return {
      userIdentifier,
      profile: profile.profile,
      patterns: patterns.patterns,
      engagement: engagement.engagement,
      insights,
      summary: this.generateAnalysisSummary(profile, patterns, engagement),
      analysisDate: new Date().toISOString()
    };
  }

  // 数据获取方法
  async fetchUserBehaviorData(userIdentifier, timeRangeMs) {
    // 模拟用户行为数据 - 实际项目中会从数据库获取
    const endTime = Date.now();
    const startTime = endTime - timeRangeMs;
    
    const mockBehaviors = [];
    const behaviorTypes = Object.keys(this.behaviorTypes);
    const platforms = ['weibo', 'wechat', 'zhihu', 'juejin', 'bilibili'];
    const contentTypes = ['article', 'video', 'image', 'audio'];
    
    // 生成模拟数据
    for (let i = 0; i < 100; i++) {
      const timestamp = startTime + Math.random() * timeRangeMs;
      
      mockBehaviors.push({
        id: `behavior_${i}`,
        userIdentifier,
        type: behaviorTypes[Math.floor(Math.random() * behaviorTypes.length)],
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        contentType: contentTypes[Math.floor(Math.random() * contentTypes.length)],
        contentId: `content_${Math.floor(Math.random() * 1000)}`,
        timestamp,
        duration: Math.random() * 300000, // 0-5分钟
        metadata: {
          deviceType: Math.random() > 0.7 ? 'mobile' : 'desktop',
          source: Math.random() > 0.5 ? 'organic' : 'recommended'
        }
      });
    }
    
    return mockBehaviors.sort((a, b) => a.timestamp - b.timestamp);
  }

  async fetchCandidateContent(input) {
    // 模拟候选内容 - 实际项目中会从内容库获取
    return [
      { id: 'content_1', title: 'AI技术发展趋势', category: 'tech', tags: ['AI', '技术'] },
      { id: 'content_2', title: '前端开发最佳实践', category: 'tech', tags: ['前端', '开发'] },
      { id: 'content_3', title: '创业经验分享', category: 'business', tags: ['创业', '经验'] },
      { id: 'content_4', title: '生活方式优化', category: 'lifestyle', tags: ['生活', '优化'] },
      { id: 'content_5', title: '学习方法总结', category: 'education', tags: ['学习', '方法'] }
    ];
  }

  // 分析方法
  async analyzeInterests(behaviorData) {
    const interests = {};
    const categories = {};
    
    behaviorData.forEach(behavior => {
      // 基于内容类型统计兴趣
      const contentType = behavior.contentType;
      interests[contentType] = (interests[contentType] || 0) + 1;
      
      // 基于平台统计偏好
      const platform = behavior.platform;
      categories[platform] = (categories[platform] || 0) + 1;
    });
    
    // 计算兴趣权重
    const totalBehaviors = behaviorData.length;
    const interestWeights = {};
    
    Object.entries(interests).forEach(([interest, count]) => {
      interestWeights[interest] = Math.round((count / totalBehaviors) * 100) / 100;
    });
    
    return {
      primary: Object.entries(interestWeights)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([interest, weight]) => ({ interest, weight })),
      distribution: interestWeights,
      categories
    };
  }

  async analyzeActivityTime(behaviorData) {
    const hourlyActivity = new Array(24).fill(0);
    const dailyActivity = {};
    
    behaviorData.forEach(behavior => {
      const date = new Date(behavior.timestamp);
      const hour = date.getHours();
      const day = date.getDay(); // 0=Sunday, 1=Monday, etc.
      
      hourlyActivity[hour]++;
      dailyActivity[day] = (dailyActivity[day] || 0) + 1;
    });
    
    // 找出最活跃的时间段
    const peakHours = hourlyActivity
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    return {
      hourlyDistribution: hourlyActivity,
      dailyDistribution: dailyActivity,
      peakHours,
      mostActiveDay: Object.entries(dailyActivity)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 0
    };
  }

  async analyzeContentPreference(behaviorData) {
    const preferences = {
      contentTypes: {},
      platforms: {},
      engagementTypes: {}
    };
    
    behaviorData.forEach(behavior => {
      preferences.contentTypes[behavior.contentType] = 
        (preferences.contentTypes[behavior.contentType] || 0) + 1;
      
      preferences.platforms[behavior.platform] = 
        (preferences.platforms[behavior.platform] || 0) + 1;
      
      preferences.engagementTypes[behavior.type] = 
        (preferences.engagementTypes[behavior.type] || 0) + 1;
    });
    
    return {
      favoriteContentType: this.getTopPreference(preferences.contentTypes),
      favoritePlatform: this.getTopPreference(preferences.platforms),
      preferredEngagement: this.getTopPreference(preferences.engagementTypes),
      diversity: this.calculatePreferenceDiversity(preferences)
    };
  }

  async analyzePlatformUsage(behaviorData) {
    const platformStats = {};
    
    behaviorData.forEach(behavior => {
      const platform = behavior.platform;
      if (!platformStats[platform]) {
        platformStats[platform] = {
          count: 0,
          totalDuration: 0,
          behaviors: []
        };
      }
      
      platformStats[platform].count++;
      platformStats[platform].totalDuration += behavior.duration || 0;
      platformStats[platform].behaviors.push(behavior.type);
    });
    
    // 计算平台使用指标
    Object.keys(platformStats).forEach(platform => {
      const stats = platformStats[platform];
      stats.avgDuration = stats.totalDuration / stats.count;
      stats.engagementRate = this.calculatePlatformEngagementRate(stats.behaviors);
    });
    
    return platformStats;
  }

  async analyzeEngagementLevel(behaviorData) {
    const engagementWeights = {
      view: 1,
      like: 2,
      share: 3,
      comment: 4,
      bookmark: 3,
      follow: 5
    };
    
    let totalScore = 0;
    let totalActions = 0;
    
    behaviorData.forEach(behavior => {
      const weight = engagementWeights[behavior.type] || 1;
      totalScore += weight;
      totalActions++;
    });
    
    const avgEngagement = totalActions > 0 ? totalScore / totalActions : 0;
    
    return {
      score: Math.round(avgEngagement * 100) / 100,
      level: this.classifyEngagementLevel(avgEngagement),
      totalActions,
      actionDistribution: this.calculateActionDistribution(behaviorData)
    };
  }

  async analyzeDemographic(behaviorData) {
    // 基于行为推断人口统计信息
    const deviceTypes = {};
    const sources = {};
    
    behaviorData.forEach(behavior => {
      if (behavior.metadata) {
        const deviceType = behavior.metadata.deviceType;
        const source = behavior.metadata.source;
        
        if (deviceType) {
          deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1;
        }
        
        if (source) {
          sources[source] = (sources[source] || 0) + 1;
        }
      }
    });
    
    return {
      primaryDevice: this.getTopPreference(deviceTypes),
      primarySource: this.getTopPreference(sources),
      deviceDistribution: deviceTypes,
      sourceDistribution: sources
    };
  }

  // 推荐方法
  async recommendContent(userProfile, candidateContent) {
    const recommendations = [];
    
    candidateContent.forEach(content => {
      const score = this.calculateContentScore(content, userProfile);
      
      if (score > 0.5) { // 阈值过滤
        recommendations.push({
          ...content,
          score,
          reasons: this.generateRecommendationReasons(content, userProfile)
        });
      }
    });
    
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  async recommendTopics(userProfile) {
    const interests = userProfile.profile.interests.primary;
    
    return interests.map(interest => ({
      topic: interest.interest,
      relevance: interest.weight,
      suggestedContent: this.generateTopicContent(interest.interest)
    }));
  }

  async recommendPlatforms(userProfile) {
    const platformUsage = userProfile.profile.platformUsage;
    
    return Object.entries(platformUsage)
      .sort(([,a], [,b]) => b.engagementRate - a.engagementRate)
      .slice(0, 3)
      .map(([platform, stats]) => ({
        platform,
        score: stats.engagementRate,
        reason: `高参与度平台 (${Math.round(stats.engagementRate * 100)}%)`
      }));
  }

  async recommendOptimalTiming(userProfile) {
    const activityTime = userProfile.profile.activityTime;
    
    return {
      bestHours: activityTime.peakHours.map(peak => ({
        hour: peak.hour,
        score: peak.count,
        timeLabel: this.formatHour(peak.hour)
      })),
      bestDay: {
        day: activityTime.mostActiveDay,
        dayLabel: this.formatDay(activityTime.mostActiveDay)
      }
    };
  }

  // 工具方法
  parseTimeRange(timeRange) {
    const units = {
      'd': 24 * 60 * 60 * 1000,
      'h': 60 * 60 * 1000,
      'm': 60 * 1000
    };
    
    const match = timeRange.match(/^(\d+)([dhm])$/);
    if (!match) {
      throw new Error(`无效的时间范围格式: ${timeRange}`);
    }
    
    const [, amount, unit] = match;
    return parseInt(amount) * units[unit];
  }

  generateUserTags(profile) {
    const tags = [];
    
    // 基于兴趣生成标签
    profile.interests.primary.forEach(interest => {
      if (interest.weight > 0.3) {
        tags.push(`${interest.interest}_lover`);
      }
    });
    
    // 基于活跃时间生成标签
    const peakHour = profile.activityTime.peakHours[0]?.hour;
    if (peakHour !== undefined) {
      if (peakHour >= 6 && peakHour < 12) tags.push('morning_person');
      else if (peakHour >= 18 && peakHour < 24) tags.push('evening_person');
      else if (peakHour >= 0 && peakHour < 6) tags.push('night_owl');
    }
    
    // 基于参与度生成标签
    if (profile.engagementLevel.level === 'high') {
      tags.push('highly_engaged');
    } else if (profile.engagementLevel.level === 'low') {
      tags.push('passive_user');
    }
    
    return tags;
  }

  calculateUserValue(profile, behaviorData) {
    let score = 0;
    
    // 活跃度评分 (0-30分)
    const activityScore = Math.min(behaviorData.length / 10, 30);
    score += activityScore;
    
    // 参与度评分 (0-40分)
    const engagementScore = profile.engagementLevel.score * 10;
    score += Math.min(engagementScore, 40);
    
    // 多样性评分 (0-20分)
    const diversityScore = profile.contentPreference.diversity * 20;
    score += diversityScore;
    
    // 忠诚度评分 (0-10分)
    const loyaltyScore = this.calculateLoyaltyScore(behaviorData);
    score += loyaltyScore;
    
    return Math.min(Math.round(score), 100);
  }

  calculateLoyaltyScore(behaviorData) {
    // 基于行为时间跨度计算忠诚度
    if (behaviorData.length < 2) return 0;
    
    const timeSpan = behaviorData[behaviorData.length - 1].timestamp - behaviorData[0].timestamp;
    const days = timeSpan / (24 * 60 * 60 * 1000);
    
    return Math.min(days / 30 * 10, 10); // 30天满分
  }

  generateBehaviorSummary(behaviorData) {
    const totalBehaviors = behaviorData.length;
    const uniqueDays = new Set(
      behaviorData.map(b => new Date(b.timestamp).toDateString())
    ).size;
    
    const behaviorTypes = {};
    behaviorData.forEach(b => {
      behaviorTypes[b.type] = (behaviorTypes[b.type] || 0) + 1;
    });
    
    return {
      totalBehaviors,
      uniqueActiveDays: uniqueDays,
      avgBehaviorsPerDay: Math.round((totalBehaviors / uniqueDays) * 10) / 10,
      mostCommonBehavior: this.getTopPreference(behaviorTypes),
      behaviorTypeDistribution: behaviorTypes
    };
  }

  getTopPreference(preferences) {
    const entries = Object.entries(preferences);
    if (entries.length === 0) return null;
    
    return entries.sort(([,a], [,b]) => b - a)[0][0];
  }

  calculatePreferenceDiversity(preferences) {
    const types = Object.keys(preferences.contentTypes).length;
    const platforms = Object.keys(preferences.platforms).length;
    const engagements = Object.keys(preferences.engagementTypes).length;
    
    // 归一化多样性评分 (0-1)
    return Math.min((types + platforms + engagements) / 15, 1);
  }

  calculatePlatformEngagementRate(behaviors) {
    const engagementActions = ['like', 'share', 'comment', 'bookmark', 'follow'];
    const engagementCount = behaviors.filter(b => engagementActions.includes(b)).length;
    
    return behaviors.length > 0 ? engagementCount / behaviors.length : 0;
  }

  classifyEngagementLevel(score) {
    if (score >= 3) return 'high';
    if (score >= 2) return 'medium';
    if (score >= 1) return 'low';
    return 'minimal';
  }

  calculateActionDistribution(behaviorData) {
    const distribution = {};
    
    behaviorData.forEach(behavior => {
      distribution[behavior.type] = (distribution[behavior.type] || 0) + 1;
    });
    
    const total = behaviorData.length;
    Object.keys(distribution).forEach(type => {
      distribution[type] = Math.round((distribution[type] / total) * 100) / 100;
    });
    
    return distribution;
  }

  calculateContentScore(content, userProfile) {
    let score = 0.5; // 基础分数
    
    // 基于兴趣匹配
    const interests = userProfile.profile.interests.primary;
    interests.forEach(interest => {
      if (content.tags.some(tag => tag.toLowerCase().includes(interest.interest.toLowerCase()))) {
        score += interest.weight * 0.3;
      }
    });
    
    // 基于内容类型偏好
    const contentPreference = userProfile.profile.contentPreference;
    if (content.category === contentPreference.favoriteContentType) {
      score += 0.2;
    }
    
    return Math.min(score, 1);
  }

  generateRecommendationReasons(content, userProfile) {
    const reasons = [];
    
    // 兴趣匹配原因
    const interests = userProfile.profile.interests.primary;
    interests.forEach(interest => {
      if (content.tags.some(tag => tag.toLowerCase().includes(interest.interest.toLowerCase()))) {
        reasons.push(`匹配您的兴趣: ${interest.interest}`);
      }
    });
    
    // 内容类型原因
    const contentPreference = userProfile.profile.contentPreference;
    if (content.category === contentPreference.favoriteContentType) {
      reasons.push(`符合您偏好的内容类型: ${content.category}`);
    }
    
    return reasons;
  }

  generateTopicContent(topic) {
    const suggestions = {
      'article': ['深度分析', '实用指南', '案例研究'],
      'video': ['教程视频', '演示视频', '访谈视频'],
      'tech': ['技术教程', '工具推荐', '趋势分析'],
      'business': ['商业案例', '市场分析', '创业经验']
    };
    
    return suggestions[topic] || ['相关内容推荐'];
  }

  formatHour(hour) {
    if (hour === 0) return '午夜';
    if (hour < 12) return `上午${hour}点`;
    if (hour === 12) return '中午';
    return `下午${hour - 12}点`;
  }

  formatDay(day) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[day] || '未知';
  }

  async generateQuickRecommendations(userIdentifier, analysisResult) {
    return {
      nextBestAction: '基于您的行为模式，建议在晚上8点发布技术相关内容',
      contentSuggestions: ['AI技术趋势', '前端开发技巧', '编程最佳实践'],
      platformSuggestions: ['知乎', '掘金', '微博'],
      timingSuggestions: ['晚上8-10点', '周末上午', '工作日午休时间']
    };
  }

  async healthCheck() {
    try {
      // 测试基本分析功能
      const testInput = {
        userId: 'test_user',
        analysisType: 'profile',
        timeRange: '7d'
      };
      
      const testResult = await this.analyzeUserProfile('test_user', {
        timeRangeMs: this.parseTimeRange('7d')
      });
      
      return {
        name: this.name,
        status: 'healthy',
        message: '用户行为分析Agent运行正常',
        timestamp: new Date().toISOString(),
        metrics: this.metrics,
        capabilities: Object.keys(this.behaviorTypes)
      };
    } catch (error) {
      return {
        name: this.name,
        status: 'unhealthy',
        message: `健康检查失败: ${error.message}`,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

module.exports = UserBehaviorAgent;