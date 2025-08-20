/**
 * 发布调度 Agent
 * 负责内容发布的智能调度和优化
 */

const BaseAgent = require('./BaseAgent');
const { logger } = require('../config/logger');

class PublishSchedulerAgent extends BaseAgent {
  constructor(options = {}) {
    super('publish_scheduler', {
      timeout: 30000,
      maxRetries: 2,
      ...options
    });
    
    // 支持的平台
    this.supportedPlatforms = [
      'weibo', 'wechat', 'zhihu', 'juejin', 
      'bilibili', 'xiaohongshu', 'douyin', 'kuaishou'
    ];
    
    // 平台最佳发布时间配置
    this.platformOptimalTimes = {
      weibo: [
        { hour: 9, minute: 0, score: 0.9 },
        { hour: 12, minute: 0, score: 0.8 },
        { hour: 18, minute: 0, score: 0.95 },
        { hour: 21, minute: 0, score: 0.85 }
      ],
      wechat: [
        { hour: 8, minute: 30, score: 0.9 },
        { hour: 12, minute: 30, score: 0.8 },
        { hour: 19, minute: 0, score: 0.95 },
        { hour: 22, minute: 0, score: 0.7 }
      ],
      zhihu: [
        { hour: 10, minute: 0, score: 0.85 },
        { hour: 14, minute: 0, score: 0.8 },
        { hour: 20, minute: 0, score: 0.9 },
        { hour: 22, minute: 30, score: 0.75 }
      ],
      juejin: [
        { hour: 9, minute: 30, score: 0.9 },
        { hour: 14, minute: 30, score: 0.85 },
        { hour: 21, minute: 0, score: 0.8 }
      ]
    };
    
    this.setupMiddleware();
  }

  setupMiddleware() {
    // 输入验证中间件
    this.use(async (context, next) => {
      const { input } = context;
      
      if (!input.content) {
        throw new Error('需要提供要发布的内容');
      }
      
      if (!input.platforms || !Array.isArray(input.platforms)) {
        throw new Error('需要指定发布平台列表');
      }
      
      const invalidPlatforms = input.platforms.filter(p => 
        !this.supportedPlatforms.includes(p)
      );
      
      if (invalidPlatforms.length > 0) {
        throw new Error(`不支持的平台: ${invalidPlatforms.join(', ')}`);
      }
      
      await next();
    });
    
    // 内容适配中间件
    this.use(async (context, next) => {
      const { input } = context;
      
      // 为每个平台适配内容
      input.adaptedContent = {};
      
      for (const platform of input.platforms) {
        input.adaptedContent[platform] = this.adaptContentForPlatform(
          input.content, 
          platform
        );
      }
      
      logger.debug('内容平台适配完成', {
        agentName: this.name,
        platforms: input.platforms,
        originalLength: input.content.length
      });
      
      await next();
    });
  }

  async execute(input, context = {}) {
    const { 
      content, 
      platforms, 
      scheduleType = 'optimal', // optimal, immediate, custom
      customTime,
      priority = 'normal' // high, normal, low
    } = input;
    
    logger.info('开始发布调度', {
      agentName: this.name,
      platforms,
      scheduleType,
      priority,
      contentLength: content.length,
      type: 'publish_schedule_start'
    });
    
    const scheduleResults = {};
    
    // 为每个平台生成发布计划
    for (const platform of platforms) {
      try {
        const adaptedContent = input.adaptedContent ? input.adaptedContent[platform] : this.adaptContentForPlatform(content, platform);
        const platformSchedule = await this.createPlatformSchedule(
          platform,
          adaptedContent,
          { scheduleType, customTime, priority }
        );
        
        scheduleResults[platform] = platformSchedule;
        
        logger.debug(`${platform} 发布计划生成成功`, {
          agentName: this.name,
          platform,
          scheduledTime: platformSchedule.scheduledTime
        });
        
      } catch (error) {
        logger.error(`${platform} 发布计划生成失败`, {
          agentName: this.name,
          platform,
          error: error.message
        }, error);
        
        scheduleResults[platform] = {
          status: 'failed',
          error: error.message
        };
      }
    }
    
    // 生成总体发布策略
    const publishStrategy = this.generatePublishStrategy(scheduleResults, input);
    
    // 创建发布任务队列
    const taskQueue = this.createPublishTaskQueue(scheduleResults);
    
    const result = {
      scheduleId: this.generateScheduleId(),
      content,
      platforms,
      scheduleResults,
      publishStrategy,
      taskQueue,
      metadata: {
        createdAt: new Date().toISOString(),
        scheduleType,
        priority,
        agentVersion: '1.0.0'
      }
    };
    
    logger.info('发布调度完成', {
      agentName: this.name,
      scheduleId: result.scheduleId,
      successfulPlatforms: Object.values(scheduleResults).filter(r => r.status !== 'failed').length,
      failedPlatforms: Object.values(scheduleResults).filter(r => r.status === 'failed').length,
      type: 'publish_schedule_completion'
    });
    
    return result;
  }

  adaptContentForPlatform(content, platform) {
    const adaptations = {
      weibo: this.adaptForWeibo(content),
      wechat: this.adaptForWechat(content),
      zhihu: this.adaptForZhihu(content),
      juejin: this.adaptForJuejin(content),
      bilibili: this.adaptForBilibili(content),
      xiaohongshu: this.adaptForXiaohongshu(content),
      douyin: this.adaptForDouyin(content),
      kuaishou: this.adaptForKuaishou(content)
    };
    
    return adaptations[platform] || content;
  }

  adaptForWeibo(content) {
    // 微博字数限制和话题标签优化
    let adapted = content;
    
    if (adapted.length > 140) {
      adapted = adapted.substring(0, 137) + '...';
    }
    
    return {
      text: adapted,
      maxLength: 140,
      platform: 'weibo',
      features: ['hashtags', 'mentions', 'images']
    };
  }

  adaptForWechat(content) {
    // 微信公众号格式优化
    return {
      title: this.extractTitle(content),
      content: content,
      summary: this.generateSummary(content, 120),
      platform: 'wechat',
      features: ['rich_text', 'images', 'links']
    };
  }

  adaptForZhihu(content) {
    // 知乎长文格式优化
    return {
      title: this.extractTitle(content),
      content: content,
      tags: this.extractTags(content, 5),
      platform: 'zhihu',
      features: ['markdown', 'images', 'links', 'tags']
    };
  }

  adaptForJuejin(content) {
    // 掘金技术文章格式
    return {
      title: this.extractTitle(content),
      content: content,
      tags: this.extractTechTags(content),
      category: this.detectCategory(content),
      platform: 'juejin',
      features: ['markdown', 'code_highlight', 'tags']
    };
  }

  adaptForBilibili(content) {
    // B站动态或视频描述
    let adapted = content;
    
    if (adapted.length > 233) {
      adapted = adapted.substring(0, 230) + '...';
    }
    
    return {
      text: adapted,
      tags: this.extractTags(content, 10),
      platform: 'bilibili',
      features: ['video', 'images', 'tags']
    };
  }

  adaptForXiaohongshu(content) {
    // 小红书笔记格式
    return {
      title: this.extractTitle(content, 20),
      content: content.substring(0, 1000),
      tags: this.extractTags(content, 10),
      platform: 'xiaohongshu',
      features: ['images', 'tags', 'location']
    };
  }

  adaptForDouyin(content) {
    // 抖音短视频描述
    let adapted = content;
    
    if (adapted.length > 55) {
      adapted = adapted.substring(0, 52) + '...';
    }
    
    return {
      text: adapted,
      hashtags: this.extractHashtags(content, 3),
      platform: 'douyin',
      features: ['video', 'hashtags', 'music']
    };
  }

  adaptForKuaishou(content) {
    // 快手短视频描述
    let adapted = content;
    
    if (adapted.length > 50) {
      adapted = adapted.substring(0, 47) + '...';
    }
    
    return {
      text: adapted,
      tags: this.extractTags(content, 5),
      platform: 'kuaishou',
      features: ['video', 'tags']
    };
  }

  async createPlatformSchedule(platform, adaptedContent, options) {
    const { scheduleType, customTime, priority } = options;
    
    let scheduledTime;
    let confidence = 0.8;
    
    switch (scheduleType) {
      case 'immediate':
        scheduledTime = new Date();
        confidence = 1.0;
        break;
        
      case 'custom':
        if (!customTime) {
          throw new Error('自定义调度需要提供时间');
        }
        scheduledTime = new Date(customTime);
        confidence = 0.9;
        break;
        
      case 'optimal':
      default:
        scheduledTime = this.calculateOptimalTime(platform, priority);
        confidence = this.calculateTimeConfidence(platform, scheduledTime);
        break;
    }
    
    // 检查时间冲突
    const conflicts = await this.checkTimeConflicts(platform, scheduledTime);
    
    if (conflicts.length > 0) {
      scheduledTime = this.resolveTimeConflicts(scheduledTime, conflicts);
      confidence *= 0.9; // 降低置信度
    }
    
    return {
      platform,
      scheduledTime: scheduledTime.toISOString(),
      confidence,
      adaptedContent,
      estimatedReach: this.estimateReach(platform, scheduledTime),
      estimatedEngagement: this.estimateEngagement(platform, adaptedContent),
      conflicts: conflicts.length,
      status: 'scheduled'
    };
  }

  calculateOptimalTime(platform, priority) {
    const now = new Date();
    const optimalTimes = this.platformOptimalTimes[platform] || [];
    
    if (optimalTimes.length === 0) {
      // 默认时间：当前时间后1小时
      return new Date(now.getTime() + 3600000);
    }
    
    // 根据优先级选择时间
    let targetTimes = optimalTimes;
    
    if (priority === 'high') {
      // 高优先级选择最佳时间
      targetTimes = optimalTimes.filter(t => t.score >= 0.9);
    } else if (priority === 'low') {
      // 低优先级可以选择次优时间
      targetTimes = optimalTimes.filter(t => t.score >= 0.7);
    }
    
    if (targetTimes.length === 0) {
      targetTimes = optimalTimes;
    }
    
    // 选择最近的最佳时间
    const bestTime = targetTimes.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
    const scheduledDate = new Date(now);
    scheduledDate.setHours(bestTime.hour, bestTime.minute, 0, 0);
    
    // 如果时间已过，安排到明天
    if (scheduledDate <= now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }
    
    return scheduledDate;
  }

  calculateTimeConfidence(platform, scheduledTime) {
    const optimalTimes = this.platformOptimalTimes[platform] || [];
    
    if (optimalTimes.length === 0) {
      return 0.5; // 默认置信度
    }
    
    const hour = scheduledTime.getHours();
    const minute = scheduledTime.getMinutes();
    
    // 找到最接近的最佳时间
    const closest = optimalTimes.reduce((closest, time) => {
      const timeDiff = Math.abs((time.hour * 60 + time.minute) - (hour * 60 + minute));
      const closestDiff = Math.abs((closest.hour * 60 + closest.minute) - (hour * 60 + minute));
      
      return timeDiff < closestDiff ? time : closest;
    });
    
    // 根据时间差异调整置信度
    const timeDiff = Math.abs((closest.hour * 60 + closest.minute) - (hour * 60 + minute));
    const confidenceReduction = Math.min(timeDiff / 120, 0.3); // 最多降低30%
    
    return Math.max(closest.score - confidenceReduction, 0.3);
  }

  async checkTimeConflicts(platform, scheduledTime) {
    // 简化的冲突检查 - 实际项目中会查询数据库
    const conflicts = [];
    
    // 模拟冲突检查
    if (Math.random() < 0.1) { // 10%概率有冲突
      conflicts.push({
        type: 'time_overlap',
        conflictTime: scheduledTime.toISOString(),
        description: '时间段内已有其他发布任务'
      });
    }
    
    return conflicts;
  }

  resolveTimeConflicts(originalTime, conflicts) {
    // 简单的冲突解决：延后30分钟
    const resolvedTime = new Date(originalTime.getTime() + 30 * 60 * 1000);
    
    logger.info('解决时间冲突', {
      agentName: this.name,
      originalTime: originalTime.toISOString(),
      resolvedTime: resolvedTime.toISOString(),
      conflictCount: conflicts.length
    });
    
    return resolvedTime;
  }

  estimateReach(platform, scheduledTime) {
    // 基于平台和时间的预估触达量
    const baseReach = {
      weibo: 5000,
      wechat: 2000,
      zhihu: 3000,
      juejin: 1500,
      bilibili: 4000,
      xiaohongshu: 2500,
      douyin: 8000,
      kuaishou: 6000
    };
    
    const base = baseReach[platform] || 1000;
    const timeMultiplier = this.getTimeMultiplier(scheduledTime);
    
    return Math.round(base * timeMultiplier);
  }

  estimateEngagement(platform, adaptedContent) {
    // 基于内容特征的预估互动率
    let baseRate = 0.05; // 5%基础互动率
    
    // 平台调整
    const platformMultipliers = {
      weibo: 1.2,
      wechat: 0.8,
      zhihu: 1.5,
      juejin: 1.3,
      bilibili: 1.4,
      xiaohongshu: 1.6,
      douyin: 2.0,
      kuaishou: 1.8
    };
    
    baseRate *= platformMultipliers[platform] || 1.0;
    
    // 内容特征调整
    if (adaptedContent.tags && adaptedContent.tags.length > 0) {
      baseRate *= 1.1; // 有标签提升10%
    }
    
    if (adaptedContent.features && adaptedContent.features.includes('images')) {
      baseRate *= 1.2; // 有图片提升20%
    }
    
    return Math.round(baseRate * 10000) / 100; // 转换为百分比
  }

  getTimeMultiplier(scheduledTime) {
    const hour = scheduledTime.getHours();
    
    // 基于时间的触达量调整
    if (hour >= 8 && hour <= 10) return 1.2; // 早高峰
    if (hour >= 12 && hour <= 14) return 1.1; // 午休
    if (hour >= 18 && hour <= 22) return 1.3; // 晚高峰
    if (hour >= 22 || hour <= 6) return 0.7; // 深夜/凌晨
    
    return 1.0; // 其他时间
  }

  generatePublishStrategy(scheduleResults, input) {
    const successfulSchedules = Object.values(scheduleResults).filter(r => r.status !== 'failed');
    
    if (successfulSchedules.length === 0) {
      return {
        type: 'failed',
        message: '所有平台调度失败',
        recommendations: ['检查平台配置', '重新尝试调度']
      };
    }
    
    return {
      type: 'multi_platform',
      totalPlatforms: successfulSchedules.length,
      averageConfidence: this.calculateAverageConfidence(successfulSchedules),
      estimatedTotalReach: successfulSchedules.reduce((sum, s) => sum + s.estimatedReach, 0),
      averageEngagement: this.calculateAverageEngagement(successfulSchedules),
      recommendations: ['发布策略已优化', '建议关注发布效果']
    };
  }

  calculateAverageConfidence(schedules) {
    const totalConfidence = schedules.reduce((sum, s) => sum + s.confidence, 0);
    return Math.round((totalConfidence / schedules.length) * 100) / 100;
  }

  calculateAverageEngagement(schedules) {
    const totalEngagement = schedules.reduce((sum, s) => sum + s.estimatedEngagement, 0);
    return Math.round((totalEngagement / schedules.length) * 100) / 100;
  }

  createPublishTaskQueue(scheduleResults) {
    const tasks = [];
    
    Object.entries(scheduleResults).forEach(([platform, schedule]) => {
      if (schedule.status !== 'failed') {
        tasks.push({
          id: this.generateTaskId(),
          platform,
          scheduledTime: schedule.scheduledTime,
          content: schedule.adaptedContent,
          priority: this.calculateTaskPriority(schedule),
          status: 'pending',
          retryCount: 0,
          maxRetries: 3
        });
      }
    });
    
    // 按时间排序
    tasks.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
    
    return tasks;
  }

  calculateTaskPriority(schedule) {
    let priority = 50; // 基础优先级
    
    // 置信度影响
    priority += schedule.confidence * 30;
    
    // 预估触达量影响
    if (schedule.estimatedReach > 5000) priority += 10;
    
    // 冲突影响
    priority -= schedule.conflicts * 5;
    
    return Math.max(1, Math.min(100, Math.round(priority)));
  }

  // 工具方法
  generateScheduleId() {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  extractTitle(content, maxLength = 50) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return '无标题';
    
    let title = lines[0].trim();
    if (title.length > maxLength) {
      title = title.substring(0, maxLength - 3) + '...';
    }
    
    return title;
  }

  generateSummary(content, maxLength = 100) {
    if (content.length <= maxLength) return content;
    
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim());
    let summary = '';
    
    for (const sentence of sentences) {
      if (summary.length + sentence.length <= maxLength - 3) {
        summary += sentence + '。';
      } else {
        break;
      }
    }
    
    return summary || content.substring(0, maxLength - 3) + '...';
  }

  extractTags(content, maxTags = 5) {
    // 简化的标签提取
    const words = content.toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1);
    
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxTags)
      .map(([word]) => word);
  }

  extractTechTags(content) {
    const techKeywords = [
      'javascript', 'python', 'java', 'react', 'vue', 'node',
      'typescript', 'css', 'html', 'webpack', 'docker', 'kubernetes',
      'ai', '人工智能', '机器学习', '深度学习', '前端', '后端', '全栈'
    ];
    
    const foundTags = [];
    const lowerContent = content.toLowerCase();
    
    techKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        foundTags.push(keyword);
      }
    });
    
    return foundTags.slice(0, 5);
  }

  detectCategory(content) {
    const categories = {
      frontend: ['前端', 'react', 'vue', 'javascript', 'css', 'html'],
      backend: ['后端', 'node', 'python', 'java', 'api', '数据库'],
      mobile: ['移动', 'app', 'react native', 'flutter', 'ios', 'android'],
      ai: ['ai', '人工智能', '机器学习', '深度学习', 'tensorflow'],
      devops: ['devops', 'docker', 'kubernetes', '部署', '运维']
    };
    
    const lowerContent = content.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }

  extractHashtags(content, maxTags = 3) {
    const words = this.extractTags(content, maxTags);
    return words.map(word => `#${word}`);
  }

  async healthCheck() {
    try {
      // 测试基本调度功能
      const testInput = {
        content: '这是一个测试内容',
        platforms: ['weibo', 'zhihu'],
        scheduleType: 'optimal'
      };
      
      const testSchedule = await this.createPlatformSchedule(
        'weibo',
        this.adaptForWeibo(testInput.content),
        { scheduleType: 'optimal', priority: 'normal' }
      );
      
      return {
        name: this.name,
        status: 'healthy',
        message: '发布调度Agent运行正常',
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

module.exports = PublishSchedulerAgent;