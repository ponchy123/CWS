/**
 * 内容分析 Agent
 * 负责内容的智能分析、情感分析、关键词提取等
 */

const BaseAgent = require('./BaseAgent');
const { logger } = require('../config/logger');

class ContentAnalysisAgent extends BaseAgent {
  constructor(options = {}) {
    super('content_analysis', {
      timeout: 60000, // 内容分析可能需要更长时间
      maxRetries: 2,
      ...options
    });
    
    // 内容分析相关配置
    this.analysisTypes = {
      sentiment: '情感分析',
      keywords: '关键词提取',
      summary: '内容摘要',
      readability: '可读性分析',
      seo: 'SEO分析',
      topics: '主题识别'
    };
    
    this.setupMiddleware();
  }

  setupMiddleware() {
    // 输入验证和预处理中间件（合并为一个）
    this.use(async (context, next) => {
      const { input } = context;
      
      // 输入验证
      if (!input || !input.content) {
        throw new Error('内容分析需要提供 content 字段');
      }
      
      if (typeof input.content !== 'string') {
        throw new Error('content 必须是字符串类型');
      }
      
      if (input.content.length < 10) {
        throw new Error('内容长度至少需要10个字符');
      }
      
      if (input.content.length > 50000) {
        throw new Error('内容长度不能超过50000个字符');
      }
      
      // 内容预处理
      input.content = this.cleanContent(input.content);
      input.contentStats = this.getContentStats(input.content);
      
      logger.debug('内容预处理完成', {
        agentName: this.name,
        contentLength: input.content.length,
        wordCount: input.contentStats.wordCount,
        type: 'content_preprocessing'
      });
      
      await next();
    });
  }

  async execute(input, context = {}) {
    logger.info('ContentAnalysisAgent执行开始', {
      input,
      inputType: typeof input,
      inputKeys: input ? Object.keys(input) : 'null',
      context,
      type: 'content_analysis_agent_start'
    });
    
    // 安全地解构参数
    const safeInput = input || {};
    const { 
      content = null, 
      title = null,
      analysisTypes = ['sentiment', 'keywords', 'summary'] 
    } = safeInput;
    
    const results = {};
    
    // 确保 analysisTypes 是数组
    const validAnalysisTypes = Array.isArray(analysisTypes) ? analysisTypes : ['sentiment', 'keywords', 'summary'];
    
    // 检查 content 是否存在
    if (!content) {
      logger.error('内容分析参数错误', {
        input: safeInput,
        hasContent: !!content,
        contentType: typeof content,
        type: 'content_analysis_param_error'
      });
      throw new Error('内容分析需要提供 content 字段');
    }
    
    logger.info('开始内容分析', {
      agentName: this.name,
      contentLength: content ? content.length : 0,
      analysisTypes: validAnalysisTypes,
      hasContent: !!content,
      hasTitle: !!title,
      type: 'content_analysis_start'
    });
    
    // 并行执行多种分析
    const analysisPromises = (validAnalysisTypes || []).map(async (type) => {
      try {
        const result = await this.performAnalysis(type, content, context);
        results[type] = result;
        
        logger.debug(`${this.analysisTypes[type]}完成`, {
          agentName: this.name,
          analysisType: type,
          type: 'analysis_completion'
        });
        
      } catch (error) {
        logger.error(`${this.analysisTypes[type]}失败`, {
          agentName: this.name,
          analysisType: type,
          error: error.message
        }, error);
        
        results[type] = {
          error: error.message,
          status: 'failed'
        };
      }
    });
    
    await Promise.allSettled(analysisPromises);
    
    // 生成综合分析报告 - 确保 contentStats 存在
    let contentStats;
    try {
      contentStats = safeInput.contentStats || this.getContentStats(content);
      if (!contentStats || typeof contentStats !== 'object') {
        contentStats = this.getContentStats(content);
      }
    } catch (error) {
      logger.warn('获取内容统计失败，使用默认值', {
        error: error.message,
        type: 'content_stats_fallback'
      });
      contentStats = {
        wordCount: content ? content.length : 0,
        charCount: content ? content.length : 0,
        sentenceCount: 1,
        paragraphCount: 1
      };
    }
    
    const report = this.generateAnalysisReport(results, contentStats);
    
    logger.info('内容分析完成', {
      agentName: this.name,
      completedAnalyses: Object.keys(results).length,
      successfulAnalyses: Object.values(results).filter(r => !r.error).length,
      type: 'content_analysis_completion'
    });
    
    // 确保保留原始输入的所有字段，特别是 title
    const result = {
      ...safeInput,        // 保留所有原始输入字段（包括 title）
      analyses: results,
      report,
      metadata: {
        analysisTimestamp: new Date().toISOString(),
        agentVersion: '1.0.0',
        contentStats: contentStats
      }
    };
    
    // 如果内容被清理过，更新 content 字段
    if (content !== input.content) {
      result.content = content;
    }
    
    logger.info('内容分析结果', {
      agentName: this.name,
      resultKeys: Object.keys(result),
      hasTitle: !!result.title,
      titleValue: result.title,
      type: 'content_analysis_result'
    });
    
    return result;
  }

  async performAnalysis(type, content, context) {
    switch (type) {
      case 'sentiment':
        return await this.analyzeSentiment(content);
      case 'keywords':
        return await this.extractKeywords(content);
      case 'summary':
        return await this.generateSummary(content);
      case 'readability':
        return await this.analyzeReadability(content);
      case 'seo':
        return await this.analyzeSEO(content);
      case 'topics':
        return await this.identifyTopics(content);
      default:
        throw new Error(`不支持的分析类型: ${type}`);
    }
  }

  async analyzeSentiment(content) {
    // 简化的情感分析实现
    // 在实际项目中，这里会调用第三方API或使用机器学习模型
    
    const positiveWords = ['好', '棒', '优秀', '喜欢', '满意', '推荐', '完美', '惊艳'];
    const negativeWords = ['差', '糟糕', '失望', '不好', '讨厌', '垃圾', '问题', '错误'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      const matches = content.match(new RegExp(word, 'g'));
      if (matches) positiveScore += matches.length;
    });
    
    negativeWords.forEach(word => {
      const matches = content.match(new RegExp(word, 'g'));
      if (matches) negativeScore += matches.length;
    });
    
    const totalScore = positiveScore + negativeScore;
    let sentiment = 'neutral';
    let confidence = 0.5;
    
    if (totalScore > 0) {
      const positiveRatio = positiveScore / totalScore;
      confidence = Math.abs(positiveRatio - 0.5) * 2;
      
      if (positiveRatio > 0.6) {
        sentiment = 'positive';
      } else if (positiveRatio < 0.4) {
        sentiment = 'negative';
      }
    }
    
    return {
      sentiment,
      confidence: Math.round(confidence * 100) / 100,
      scores: {
        positive: positiveScore,
        negative: negativeScore,
        neutral: Math.max(0, content.length / 100 - totalScore)
      },
      status: 'success'
    };
  }

  async extractKeywords(content) {
    // 简化的关键词提取
    const words = content
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1);
    
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    const keywords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({
        word,
        count,
        frequency: Math.round((count / words.length) * 10000) / 100
      }));
    
    return {
      keywords,
      totalWords: words.length,
      uniqueWords: Object.keys(wordCount).length,
      status: 'success'
    };
  }

  async generateSummary(content) {
    // 简化的摘要生成 - 提取前几句
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 10);
    const summaryLength = Math.min(3, Math.ceil(sentences.length * 0.3));
    
    const summary = sentences
      .slice(0, summaryLength)
      .join('。') + '。';
    
    return {
      summary,
      originalLength: content.length,
      summaryLength: summary.length,
      compressionRatio: Math.round((summary.length / content.length) * 100) / 100,
      status: 'success'
    };
  }

  async analyzeReadability(content) {
    const stats = this.getContentStats(content);
    
    // 简化的可读性分析
    const avgWordsPerSentence = stats.wordCount / stats.sentenceCount;
    const avgCharsPerWord = stats.charCount / stats.wordCount;
    
    let readabilityScore = 100;
    
    // 句子长度影响
    if (avgWordsPerSentence > 20) readabilityScore -= 20;
    else if (avgWordsPerSentence > 15) readabilityScore -= 10;
    
    // 词汇复杂度影响
    if (avgCharsPerWord > 6) readabilityScore -= 15;
    else if (avgCharsPerWord > 4) readabilityScore -= 5;
    
    let level = 'easy';
    if (readabilityScore < 60) level = 'difficult';
    else if (readabilityScore < 80) level = 'moderate';
    
    return {
      score: Math.max(0, readabilityScore),
      level,
      metrics: {
        avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
        avgCharsPerWord: Math.round(avgCharsPerWord * 10) / 10,
        ...stats
      },
      status: 'success'
    };
  }

  async analyzeSEO(content) {
    const stats = this.getContentStats(content);
    const keywords = await this.extractKeywords(content);
    
    const seoScore = {
      contentLength: this.scoreLengthForSEO(stats.charCount),
      keywordDensity: this.scoreKeywordDensity(keywords.keywords),
      readability: 85, // 简化评分
      structure: this.scoreContentStructure(content)
    };
    
    const overallScore = Object.values(seoScore).reduce((a, b) => a + b, 0) / Object.keys(seoScore).length;
    
    return {
      overallScore: Math.round(overallScore),
      scores: seoScore,
      recommendations: this.generateSEORecommendations(seoScore, stats),
      keywords: keywords.keywords.slice(0, 5),
      status: 'success'
    };
  }

  async identifyTopics(content) {
    // 简化的主题识别
    const keywords = await this.extractKeywords(content);
    const topKeywords = keywords.keywords.slice(0, 10);
    
    // 基于关键词聚类识别主题
    const topics = this.clusterKeywordsIntoTopics(topKeywords);
    
    return {
      topics,
      confidence: topics.length > 0 ? 0.8 : 0.3,
      totalKeywords: topKeywords.length,
      status: 'success'
    };
  }

  // 工具方法
  cleanContent(content) {
    return content
      .replace(/\s+/g, ' ')
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s.,!?;:()""'']/g, '')
      .trim();
  }

  getContentStats(content) {
    // 确保 content 是字符串
    const safeContent = content || '';
    
    const sentences = safeContent.split(/[。！？.!?]/).filter(s => s.trim().length > 0);
    const words = safeContent.split(/\s+/).filter(w => w.length > 0);
    const paragraphs = safeContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    return {
      charCount: safeContent.length,
      wordCount: words.length,
      sentenceCount: Math.max(1, sentences.length), // 至少为1，避免除零错误
      paragraphCount: Math.max(1, paragraphs.length)
    };
  }

  scoreLengthForSEO(length) {
    if (length < 300) return 40;
    if (length < 600) return 70;
    if (length < 1500) return 90;
    if (length < 3000) return 85;
    return 75;
  }

  scoreKeywordDensity(keywords) {
    if (keywords.length === 0) return 30;
    
    const topKeyword = keywords[0];
    const density = topKeyword.frequency;
    
    if (density < 1) return 50;
    if (density < 3) return 90;
    if (density < 5) return 80;
    return 60;
  }

  scoreContentStructure(content) {
    let score = 60;
    
    // 检查标题结构
    if (content.includes('#') || content.match(/^.{1,50}$/m)) score += 15;
    
    // 检查段落结构
    const paragraphs = content.split(/\n\s*\n/);
    if (paragraphs.length > 2) score += 10;
    
    // 检查列表结构
    if (content.includes('•') || content.includes('-') || content.match(/^\d+\./m)) score += 10;
    
    return Math.min(100, score);
  }

  generateSEORecommendations(scores, stats) {
    const recommendations = [];
    
    if (scores.contentLength < 70) {
      recommendations.push('建议增加内容长度，至少300字以上');
    }
    
    if (scores.keywordDensity < 60) {
      recommendations.push('关键词密度偏低，建议适当增加核心关键词');
    }
    
    if (scores.structure < 80) {
      recommendations.push('建议优化内容结构，添加标题和段落分隔');
    }
    
    if (stats.sentenceCount > 0 && stats.wordCount / stats.sentenceCount > 25) {
      recommendations.push('句子过长，建议拆分为更短的句子提高可读性');
    }
    
    return recommendations;
  }

  clusterKeywordsIntoTopics(keywords) {
    // 简化的主题聚类
    const topics = [];
    
    // 技术相关主题
    const techWords = keywords.filter(k => 
      ['技术', '开发', '编程', '系统', '软件', '应用', 'AI', '人工智能'].some(tech => 
        k.word.includes(tech)
      )
    );
    if (techWords.length > 0) {
      topics.push({
        name: '技术开发',
        keywords: techWords.map(k => k.word),
        confidence: 0.8
      });
    }
    
    // 商业相关主题
    const businessWords = keywords.filter(k => 
      ['商业', '市场', '营销', '销售', '客户', '产品', '服务'].some(biz => 
        k.word.includes(biz)
      )
    );
    if (businessWords.length > 0) {
      topics.push({
        name: '商业营销',
        keywords: businessWords.map(k => k.word),
        confidence: 0.7
      });
    }
    
    // 如果没有明确主题，创建通用主题
    if (topics.length === 0 && keywords.length > 0) {
      topics.push({
        name: '通用内容',
        keywords: keywords.slice(0, 5).map(k => k.word),
        confidence: 0.5
      });
    }
    
    return topics;
  }

  generateAnalysisReport(results, contentStats) {
    const report = {
      summary: '内容分析完成',
      overallScore: 0,
      strengths: [],
      improvements: [],
      recommendations: []
    };
    
    // 确保 contentStats 存在
    const stats = contentStats || {
      wordCount: 0,
      charCount: 0,
      sentenceCount: 0,
      paragraphCount: 0
    };
    
    // 计算综合评分
    let totalScore = 0;
    let scoreCount = 0;
    
    if (results.sentiment && !results.sentiment.error) {
      const sentimentScore = results.sentiment.confidence * 100;
      totalScore += sentimentScore;
      scoreCount++;
      
      if (results.sentiment.sentiment === 'positive') {
        report.strengths.push('内容情感倾向积极正面');
      }
    }
    
    if (results.readability && !results.readability.error) {
      totalScore += results.readability.score;
      scoreCount++;
      
      if (results.readability.level === 'easy') {
        report.strengths.push('内容易读性良好');
      } else if (results.readability.level === 'difficult') {
        report.improvements.push('内容可读性需要改善');
      }
    }
    
    if (results.seo && !results.seo.error) {
      totalScore += results.seo.overallScore;
      scoreCount++;
      
      if (results.seo.overallScore > 80) {
        report.strengths.push('SEO优化程度较高');
      } else {
        report.improvements.push('SEO优化有待提升');
        report.recommendations.push(...results.seo.recommendations);
      }
    }
    
    report.overallScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
    
    // 基于内容统计的建议 - 添加更多安全检查
    try {
      // 确保 stats 存在且有效
      const safeStats = stats || {
        wordCount: 0,
        charCount: 0,
        sentenceCount: 0,
        paragraphCount: 0
      };
      
      if (safeStats.wordCount && safeStats.wordCount < 100) {
        report.improvements.push('内容长度偏短');
        report.recommendations.push('建议扩展内容，增加更多细节和例子');
      }
      
      if (safeStats.paragraphCount && safeStats.paragraphCount < 3) {
        report.improvements.push('段落结构简单');
        report.recommendations.push('建议将内容分为更多段落，提高可读性');
      }
    } catch (error) {
      logger.warn('内容统计分析失败', {
        error: error.message,
        stats,
        type: 'content_stats_analysis_error'
      });
    }
    
    return report;
  }

  async healthCheck() {
    try {
      // 测试基本分析功能
      const testContent = '这是一个测试内容，用于验证内容分析Agent的健康状态。';
      await this.analyzeSentiment(testContent);
      
      return {
        name: this.name,
        status: 'healthy',
        message: '内容分析Agent运行正常',
        timestamp: new Date().toISOString(),
        metrics: this.metrics,
        capabilities: Object.keys(this.analysisTypes)
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

module.exports = ContentAnalysisAgent;
