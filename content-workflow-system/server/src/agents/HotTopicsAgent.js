/**
 * 热点监控 Agent
 * 负责热点话题的挖掘、分析和推荐
 */

const BaseAgent = require('./BaseAgent');
const { logger } = require('../config/logger');

class HotTopicsAgent extends BaseAgent {
  constructor(options = {}) {
    super('hot_topics', {
      timeout: 45000,
      maxRetries: 3,
      ...options
    });
    
    // 支持的平台
    this.supportedPlatforms = [
      'weibo', 'zhihu', 'bilibili', 'v2ex', 
      'github', 'hackernews', 'juejin', 'sspai'
    ];
    
    // 热点分类
    this.topicCategories = {
      tech: '科技',
      business: '商业',
      entertainment: '娱乐',
      social: '社会',
      sports: '体育',
      education: '教育'
    };
    
    this.setupMiddleware();
  }

  setupMiddleware() {
    // 输入验证中间件
    this.use(async (context, next) => {
      const { input } = context;
      
      if (!input.platforms || !Array.isArray(input.platforms)) {
        throw new Error('需要指定要监控的平台列表');
      }
      
      const invalidPlatforms = input.platforms.filter(p => 
        !this.supportedPlatforms.includes(p)
      );
      
      if (invalidPlatforms.length > 0) {
        throw new Error(`不支持的平台: ${invalidPlatforms.join(', ')}`);
      }
      
      await next();
    });
    
    // 缓存检查中间件
    this.use(async (context, next) => {
      const { input } = context;
      const cacheKey = this.generateCacheKey(input);
      
      // 简化的缓存逻辑 - 实际项目中会使用 Redis
      const cached = this.getFromCache(cacheKey);
      if (cached && !this.isCacheExpired(cached)) {
        logger.debug('使用缓存的热点数据', {
          agentName: this.name,
          cacheKey,
          cacheAge: Date.now() - cached.timestamp
        });
        
        context.result = cached.data;
        return; // 跳过执行
      }
      
      await next();
      
      // 缓存结果
      if (context.result) {
        this.setCache(cacheKey, context.result);
      }
    });
  }

  async execute(input, context = {}) {
    const { platforms, limit = 20, category, timeRange = '1h' } = input;
    
    logger.info('开始热点监控', {
      agentName: this.name,
      platforms,
      limit,
      category,
      timeRange,
      type: 'hot_topics_start'
    });
    
    // 如果中间件已经提供了缓存结果
    if (context.result) {
      return context.result;
    }
    
    const results = {};
    const errors = {};
    
    // 并行获取各平台热点
    const platformPromises = platforms.map(async (platform) => {
      try {
        const topics = await this.fetchPlatformHotTopics(platform, { limit, category, timeRange });
        results[platform] = topics;
        
        logger.debug(`${platform} 热点获取成功`, {
          agentName: this.name,
          platform,
          topicCount: topics.length
        });
        
      } catch (error) {
        logger.error(`${platform} 热点获取失败`, {
          agentName: this.name,
          platform,
          error: error.message
        }, error);
        
        errors[platform] = error.message;
        results[platform] = [];
      }
    });
    
    await Promise.allSettled(platformPromises);
    
    // 合并和分析热点
    const mergedTopics = this.mergeAndAnalyzeTopics(results);
    const trendingTopics = this.identifyTrendingTopics(mergedTopics);
    const recommendations = this.generateContentRecommendations(trendingTopics);
    
    const finalResult = {
      platforms: Object.keys(results),
      totalTopics: Object.values(results).reduce((sum, topics) => sum + topics.length, 0),
      successfulPlatforms: Object.keys(results).filter(p => !errors[p]),
      failedPlatforms: Object.keys(errors),
      rawData: results,
      errors,
      analysis: {
        mergedTopics,
        trendingTopics,
        recommendations
      },
      metadata: {
        timestamp: new Date().toISOString(),
        timeRange,
        category,
        agentVersion: '1.0.0'
      }
    };
    
    logger.info('热点监控完成', {
      agentName: this.name,
      totalTopics: finalResult.totalTopics,
      successfulPlatforms: finalResult.successfulPlatforms.length,
      failedPlatforms: finalResult.failedPlatforms.length,
      trendingCount: trendingTopics.length,
      type: 'hot_topics_completion'
    });
    
    return finalResult;
  }

  async fetchPlatformHotTopics(platform, options) {
    const { limit, category, timeRange } = options;
    
    // 模拟API调用 - 实际项目中会调用真实的API
    switch (platform) {
      case 'weibo':
        return this.fetchWeiboHotTopics(limit, category);
      case 'zhihu':
        return this.fetchZhihuHotTopics(limit, category);
      case 'bilibili':
        return this.fetchBilibiliHotTopics(limit, category);
      case 'v2ex':
        return this.fetchV2exHotTopics(limit);
      case 'github':
        return this.fetchGithubTrending(limit);
      case 'hackernews':
        return this.fetchHackerNewsTop(limit);
      case 'juejin':
        return this.fetchJuejinHotTopics(limit, category);
      case 'sspai':
        return this.fetchSspaiHotTopics(limit);
      default:
        throw new Error(`不支持的平台: ${platform}`);
    }
  }

  async fetchWeiboHotTopics(limit, category) {
    // 模拟微博热搜数据
    const mockTopics = [
      { title: 'AI技术发展新突破', heat: 95000, category: 'tech', url: '#', platform: 'weibo' },
      { title: '新能源汽车市场分析', heat: 87000, category: 'business', url: '#', platform: 'weibo' },
      { title: '在线教育平台创新', heat: 76000, category: 'education', url: '#', platform: 'weibo' },
      { title: '移动支付安全升级', heat: 65000, category: 'tech', url: '#', platform: 'weibo' },
      { title: '短视频内容创作趋势', heat: 58000, category: 'entertainment', url: '#', platform: 'weibo' }
    ];
    
    let filtered = mockTopics;
    if (category) {
      filtered = mockTopics.filter(topic => topic.category === category);
    }
    
    return filtered.slice(0, limit).map(topic => ({
      ...topic,
      timestamp: new Date().toISOString(),
      source: 'weibo_api'
    }));
  }

  async fetchZhihuHotTopics(limit, category) {
    const mockTopics = [
      { title: '如何看待最新的编程语言发展', heat: 12000, category: 'tech', url: '#', platform: 'zhihu' },
      { title: '创业公司如何选择技术栈', heat: 9800, category: 'business', url: '#', platform: 'zhihu' },
      { title: '远程工作的优缺点分析', heat: 8500, category: 'social', url: '#', platform: 'zhihu' },
      { title: '人工智能对就业的影响', heat: 7200, category: 'tech', url: '#', platform: 'zhihu' },
      { title: '在线学习平台推荐', heat: 6800, category: 'education', url: '#', platform: 'zhihu' }
    ];
    
    let filtered = mockTopics;
    if (category) {
      filtered = mockTopics.filter(topic => topic.category === category);
    }
    
    return filtered.slice(0, limit).map(topic => ({
      ...topic,
      timestamp: new Date().toISOString(),
      source: 'zhihu_api'
    }));
  }

  async fetchBilibiliHotTopics(limit, category) {
    const mockTopics = [
      { title: '编程教学视频合集', heat: 156000, category: 'education', url: '#', platform: 'bilibili' },
      { title: '科技产品评测', heat: 134000, category: 'tech', url: '#', platform: 'bilibili' },
      { title: '游戏直播精彩时刻', heat: 128000, category: 'entertainment', url: '#', platform: 'bilibili' },
      { title: '数码产品开箱', heat: 98000, category: 'tech', url: '#', platform: 'bilibili' },
      { title: '学习方法分享', heat: 87000, category: 'education', url: '#', platform: 'bilibili' }
    ];
    
    let filtered = mockTopics;
    if (category) {
      filtered = mockTopics.filter(topic => topic.category === category);
    }
    
    return filtered.slice(0, limit).map(topic => ({
      ...topic,
      timestamp: new Date().toISOString(),
      source: 'bilibili_api'
    }));
  }

  async fetchV2exHotTopics(limit) {
    const mockTopics = [
      { title: 'Node.js 性能优化经验分享', heat: 245, category: 'tech', url: '#', platform: 'v2ex' },
      { title: '远程工作工具推荐', heat: 198, category: 'tech', url: '#', platform: 'v2ex' },
      { title: 'MacBook 使用技巧', heat: 167, category: 'tech', url: '#', platform: 'v2ex' },
      { title: '程序员副业选择', heat: 145, category: 'business', url: '#', platform: 'v2ex' },
      { title: 'VS Code 插件推荐', heat: 132, category: 'tech', url: '#', platform: 'v2ex' }
    ];
    
    return mockTopics.slice(0, limit).map(topic => ({
      ...topic,
      timestamp: new Date().toISOString(),
      source: 'v2ex_api'
    }));
  }

  async fetchGithubTrending(limit) {
    const mockTopics = [
      { title: 'awesome-ai-tools', heat: 2340, category: 'tech', url: '#', platform: 'github' },
      { title: 'react-native-components', heat: 1890, category: 'tech', url: '#', platform: 'github' },
      { title: 'machine-learning-course', heat: 1567, category: 'education', url: '#', platform: 'github' },
      { title: 'web-development-resources', heat: 1234, category: 'tech', url: '#', platform: 'github' },
      { title: 'open-source-alternatives', heat: 1098, category: 'tech', url: '#', platform: 'github' }
    ];
    
    return mockTopics.slice(0, limit).map(topic => ({
      ...topic,
      timestamp: new Date().toISOString(),
      source: 'github_api'
    }));
  }

  async fetchHackerNewsTop(limit) {
    const mockTopics = [
      { title: 'New JavaScript Framework Released', heat: 456, category: 'tech', url: '#', platform: 'hackernews' },
      { title: 'Startup Funding Trends 2024', heat: 389, category: 'business', url: '#', platform: 'hackernews' },
      { title: 'AI Safety Research Update', heat: 334, category: 'tech', url: '#', platform: 'hackernews' },
      { title: 'Remote Work Best Practices', heat: 298, category: 'business', url: '#', platform: 'hackernews' },
      { title: 'Open Source License Guide', heat: 267, category: 'tech', url: '#', platform: 'hackernews' }
    ];
    
    return mockTopics.slice(0, limit).map(topic => ({
      ...topic,
      timestamp: new Date().toISOString(),
      source: 'hackernews_api'
    }));
  }

  async fetchJuejinHotTopics(limit, category) {
    const mockTopics = [
      { title: 'Vue 3 最佳实践指南', heat: 3456, category: 'tech', url: '#', platform: 'juejin' },
      { title: 'React 性能优化技巧', heat: 2890, category: 'tech', url: '#', platform: 'juejin' },
      { title: '前端工程化实践', heat: 2567, category: 'tech', url: '#', platform: 'juejin' },
      { title: 'TypeScript 进阶教程', heat: 2234, category: 'tech', url: '#', platform: 'juejin' },
      { title: '微前端架构设计', heat: 1998, category: 'tech', url: '#', platform: 'juejin' }
    ];
    
    let filtered = mockTopics;
    if (category) {
      filtered = mockTopics.filter(topic => topic.category === category);
    }
    
    return filtered.slice(0, limit).map(topic => ({
      ...topic,
      timestamp: new Date().toISOString(),
      source: 'juejin_api'
    }));
  }

  async fetchSspaiHotTopics(limit) {
    const mockTopics = [
      { title: '效率工具推荐合集', heat: 1234, category: 'tech', url: '#', platform: 'sspai' },
      { title: 'iPad 生产力应用', heat: 1098, category: 'tech', url: '#', platform: 'sspai' },
      { title: '数字化生活方式', heat: 987, category: 'social', url: '#', platform: 'sspai' },
      { title: '知识管理系统搭建', heat: 876, category: 'education', url: '#', platform: 'sspai' },
      { title: '自动化工作流程', heat: 765, category: 'tech', url: '#', platform: 'sspai' }
    ];
    
    return mockTopics.slice(0, limit).map(topic => ({
      ...topic,
      timestamp: new Date().toISOString(),
      source: 'sspai_api'
    }));
  }

  mergeAndAnalyzeTopics(platformResults) {
    const allTopics = [];
    
    // 合并所有平台的话题
    Object.entries(platformResults).forEach(([platform, topics]) => {
      allTopics.push(...topics);
    });
    
    // 按热度排序
    allTopics.sort((a, b) => b.heat - a.heat);
    
    // 去重和聚合相似话题
    const mergedTopics = this.deduplicateTopics(allTopics);
    
    // 分类统计
    const categoryStats = this.calculateCategoryStats(mergedTopics);
    
    return {
      topics: mergedTopics.slice(0, 50), // 返回前50个
      totalCount: allTopics.length,
      uniqueCount: mergedTopics.length,
      categoryStats,
      platformDistribution: this.calculatePlatformDistribution(allTopics)
    };
  }

  deduplicateTopics(topics) {
    const seen = new Set();
    const deduplicated = [];
    
    topics.forEach(topic => {
      // 简化的去重逻辑 - 基于标题相似度
      const normalizedTitle = topic.title.toLowerCase().replace(/[^\w\s]/g, '');
      const key = normalizedTitle.substring(0, 20);
      
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(topic);
      }
    });
    
    return deduplicated;
  }

  calculateCategoryStats(topics) {
    const stats = {};
    
    topics.forEach(topic => {
      const category = topic.category || 'other';
      if (!stats[category]) {
        stats[category] = { count: 0, totalHeat: 0 };
      }
      stats[category].count++;
      stats[category].totalHeat += topic.heat;
    });
    
    // 计算平均热度
    Object.keys(stats).forEach(category => {
      stats[category].avgHeat = Math.round(stats[category].totalHeat / stats[category].count);
    });
    
    return stats;
  }

  calculatePlatformDistribution(topics) {
    const distribution = {};
    
    topics.forEach(topic => {
      const platform = topic.platform;
      if (!distribution[platform]) {
        distribution[platform] = 0;
      }
      distribution[platform]++;
    });
    
    return distribution;
  }

  identifyTrendingTopics(mergedTopics) {
    const { topics } = mergedTopics;
    
    // 识别趋势话题的算法
    const trending = topics.filter(topic => {
      // 简化的趋势识别逻辑
      const isHighHeat = topic.heat > 1000;
      const isTechRelated = topic.category === 'tech';
      const isRecent = new Date(topic.timestamp) > new Date(Date.now() - 3600000); // 1小时内
      
      return isHighHeat || (isTechRelated && isRecent);
    });
    
    return trending.slice(0, 10).map(topic => ({
      ...topic,
      trendScore: this.calculateTrendScore(topic),
      reasons: this.getTrendReasons(topic)
    }));
  }

  calculateTrendScore(topic) {
    let score = 0;
    
    // 热度权重
    score += Math.min(topic.heat / 1000, 50);
    
    // 分类权重
    const categoryWeights = {
      tech: 20,
      business: 15,
      education: 10,
      social: 8,
      entertainment: 5
    };
    score += categoryWeights[topic.category] || 5;
    
    // 平台权重
    const platformWeights = {
      github: 15,
      hackernews: 12,
      zhihu: 10,
      juejin: 8,
      weibo: 6
    };
    score += platformWeights[topic.platform] || 5;
    
    return Math.min(Math.round(score), 100);
  }

  getTrendReasons(topic) {
    const reasons = [];
    
    if (topic.heat > 10000) reasons.push('高热度讨论');
    if (topic.category === 'tech') reasons.push('技术热点');
    if (topic.platform === 'github') reasons.push('开发者关注');
    if (topic.platform === 'weibo') reasons.push('社交媒体热议');
    
    return reasons;
  }

  generateContentRecommendations(trendingTopics) {
    return trendingTopics.slice(0, 5).map(topic => ({
      topic: topic.title,
      category: topic.category,
      contentType: this.suggestContentType(topic),
      targetAudience: this.identifyTargetAudience(topic),
      contentAngles: this.generateContentAngles(topic),
      estimatedEngagement: this.estimateEngagement(topic),
      urgency: this.calculateUrgency(topic)
    }));
  }

  suggestContentType(topic) {
    const types = {
      tech: ['技术教程', '产品评测', '趋势分析'],
      business: ['市场分析', '案例研究', '行业报告'],
      education: ['学习指南', '资源整理', '经验分享'],
      entertainment: ['热点解读', '观点评论', '趣味内容']
    };
    
    const categoryTypes = types[topic.category] || ['综合分析'];
    return categoryTypes[Math.floor(Math.random() * categoryTypes.length)];
  }

  identifyTargetAudience(topic) {
    const audiences = {
      tech: '开发者、技术爱好者',
      business: '创业者、商业人士',
      education: '学生、职场人士',
      entertainment: '普通用户、年轻群体'
    };
    
    return audiences[topic.category] || '通用受众';
  }

  generateContentAngles(topic) {
    return [
      `深度解析：${topic.title}的背后逻辑`,
      `实用指南：如何利用${topic.title}的机会`,
      `趋势预测：${topic.title}的未来发展`
    ];
  }

  estimateEngagement(topic) {
    const baseScore = Math.min(topic.heat / 1000, 10);
    const trendBonus = topic.trendScore / 10;
    
    return Math.round(baseScore + trendBonus);
  }

  calculateUrgency(topic) {
    if (topic.heat > 50000) return 'high';
    if (topic.heat > 10000) return 'medium';
    return 'low';
  }

  // 缓存相关方法
  generateCacheKey(input) {
    const { platforms, category, timeRange } = input;
    return `hot_topics_${platforms.sort().join(',')}_${category || 'all'}_${timeRange}`;
  }

  getFromCache(key) {
    // 简化的内存缓存 - 实际项目中使用 Redis
    if (!this.cache) this.cache = new Map();
    return this.cache.get(key);
  }

  setCache(key, data) {
    if (!this.cache) this.cache = new Map();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  isCacheExpired(cached, ttl = 300000) { // 5分钟TTL
    return Date.now() - cached.timestamp > ttl;
  }

  async healthCheck() {
    try {
      // 测试基本功能
      const testInput = {
        platforms: ['weibo', 'zhihu'],
        limit: 5
      };
      
      await this.fetchPlatformHotTopics('weibo', { limit: 1 });
      
      return {
        name: this.name,
        status: 'healthy',
        message: '热点监控Agent运行正常',
        timestamp: new Date().toISOString(),
        metrics: this.metrics,
        supportedPlatforms: this.supportedPlatforms
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

module.exports = HotTopicsAgent;