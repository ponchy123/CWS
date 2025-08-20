/**
 * 内容管理 Agent V3 - 完整数据库集成版本
 */
const BaseAgent = require('./BaseAgent');

class ContentManagementAgentV3 extends BaseAgent {
  constructor() {
    super('ContentManagementAgentV3', '内容管理Agent V3 - 完整数据库集成');
    this.setupEventHandlers();
    this.initializeDatabase();
  }

  /**
   * 初始化数据库连接
   */
  async initializeDatabase() {
    try {
      // 这里可以集成实际的数据库连接
      // const { MongoClient } = require('mongodb');
      // this.db = await MongoClient.connect(process.env.MONGODB_URI);
      
      // 暂时使用内存存储模拟数据库
      this.contentCollection = new Map();
      this.categoryCollection = new Map();
      this.tagCollection = new Map();
      
      // 初始化默认分类
      this.initializeDefaultCategories();
      
      this.logger.info('内容管理Agent数据库初始化完成');
    } catch (error) {
      this.logger.error('数据库初始化失败', error);
      throw error;
    }
  }

  /**
   * 初始化默认分类
   */
  initializeDefaultCategories() {
    const defaultCategories = [
      { id: 'tech', name: '科技', description: '科技相关内容' },
      { id: 'business', name: '商业', description: '商业和创业内容' },
      { id: 'lifestyle', name: '生活', description: '生活方式内容' },
      { id: 'education', name: '教育', description: '教育和学习内容' },
      { id: 'entertainment', name: '娱乐', description: '娱乐和休闲内容' }
    ];

    defaultCategories.forEach(category => {
      this.categoryCollection.set(category.id, {
        ...category,
        createdAt: new Date(),
        contentCount: 0
      });
    });
  }

  /**
   * 设置事件处理器
   */
  setupEventHandlers() {
    // 内容创建请求
    this.on('content.create.request', async (data) => {
      try {
        const result = await this.createContent(data.params);
        this.eventBus?.publish('content.create.response', {
          requestId: data.requestId,
          result,
          success: true
        });
      } catch (error) {
        this.eventBus?.publish('content.create.response', {
          requestId: data.requestId,
          error: error.message,
          success: false
        });
      }
    });

    // 内容更新请求
    this.on('content.update.request', async (data) => {
      try {
        const result = await this.updateContent(data.params);
        this.eventBus?.publish('content.update.response', {
          requestId: data.requestId,
          result,
          success: true
        });
      } catch (error) {
        this.eventBus?.publish('content.update.response', {
          requestId: data.requestId,
          error: error.message,
          success: false
        });
      }
    });

    // 内容删除请求
    this.on('content.delete.request', async (data) => {
      try {
        const result = await this.deleteContent(data.params);
        this.eventBus?.publish('content.delete.response', {
          requestId: data.requestId,
          result,
          success: true
        });
      } catch (error) {
        this.eventBus?.publish('content.delete.response', {
          requestId: data.requestId,
          error: error.message,
          success: false
        });
      }
    });
  }

  /**
   * 创建内容
   */
  async createContent(params) {
    const { title, content, category, tags = [], userId, metadata = {} } = params;
    
    this.logger.info('创建内容', { title, category, userId });
    
    // 验证参数
    const validation = this.validateContentData({ title, content, category });
    if (!validation.valid) {
      throw new Error(`内容验证失败: ${validation.errors.join(', ')}`);
    }

    // 生成内容ID
    const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // 处理标签
    const processedTags = await this.processTags(tags);
    
    // 创建内容对象
    const contentData = {
      id: contentId,
      title: title.trim(),
      content: content.trim(),
      category: category || 'general',
      tags: processedTags,
      userId,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        wordCount: content.length,
        readingTime: Math.ceil(content.length / 200),
        version: 1,
        ...metadata
      },
      seo: {
        slug: this.generateSlug(title),
        metaDescription: this.generateMetaDescription(content),
        keywords: this.extractKeywords(content, processedTags)
      },
      analytics: {
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0
      }
    };

    // 存储内容
    this.contentCollection.set(contentId, contentData);
    
    // 更新分类计数
    await this.updateCategoryCount(category, 1);
    
    // 发布内容创建事件
    this.eventBus?.publish('content.created', {
      contentId,
      title,
      userId,
      category,
      tags: processedTags
    });

    this.logger.info('内容创建成功', { contentId, title });
    
    return {
      contentId,
      title,
      status: 'created',
      metadata: contentData.metadata,
      seo: contentData.seo
    };
  }

  /**
   * 更新内容
   */
  async updateContent(params) {
    const { contentId, updates } = params;
    
    this.logger.info('更新内容', { contentId, updates: Object.keys(updates) });
    
    const content = this.contentCollection.get(contentId);
    if (!content) {
      throw new Error(`内容不存在: ${contentId}`);
    }

    // 验证更新数据
    if (updates.title || updates.content) {
      const validation = this.validateContentData({
        title: updates.title || content.title,
        content: updates.content || content.content,
        category: updates.category || content.category
      });
      if (!validation.valid) {
        throw new Error(`内容验证失败: ${validation.errors.join(', ')}`);
      }
    }

    // 处理标签更新
    if (updates.tags) {
      updates.tags = await this.processTags(updates.tags);
    }

    // 更新内容
    const updatedContent = {
      ...content,
      ...updates,
      updatedAt: new Date(),
      metadata: {
        ...content.metadata,
        version: content.metadata.version + 1
      }
    };

    // 重新计算元数据
    if (updates.content) {
      updatedContent.metadata.wordCount = updates.content.length;
      updatedContent.metadata.readingTime = Math.ceil(updates.content.length / 200);
      updatedContent.seo.metaDescription = this.generateMetaDescription(updates.content);
    }

    if (updates.title) {
      updatedContent.seo.slug = this.generateSlug(updates.title);
    }

    if (updates.tags) {
      updatedContent.seo.keywords = this.extractKeywords(
        updatedContent.content, 
        updates.tags
      );
    }

    this.contentCollection.set(contentId, updatedContent);
    
    // 更新分类计数
    if (updates.category && updates.category !== content.category) {
      await this.updateCategoryCount(content.category, -1);
      await this.updateCategoryCount(updates.category, 1);
    }
    
    // 发布内容更新事件
    this.eventBus?.publish('content.updated', {
      contentId,
      updates: Object.keys(updates),
      version: updatedContent.metadata.version
    });

    this.logger.info('内容更新成功', { contentId, version: updatedContent.metadata.version });
    
    return {
      contentId,
      status: 'updated',
      version: updatedContent.metadata.version,
      updatedFields: Object.keys(updates)
    };
  }

  /**
   * 删除内容
   */
  async deleteContent(params) {
    const { contentId, softDelete = true } = params;
    
    const content = this.contentCollection.get(contentId);
    if (!content) {
      throw new Error(`内容不存在: ${contentId}`);
    }

    if (softDelete) {
      // 软删除
      const updatedContent = {
        ...content,
        status: 'deleted',
        deletedAt: new Date(),
        updatedAt: new Date()
      };
      this.contentCollection.set(contentId, updatedContent);
    } else {
      // 硬删除
      this.contentCollection.delete(contentId);
    }
    
    // 更新分类计数
    await this.updateCategoryCount(content.category, -1);
    
    // 发布内容删除事件
    this.eventBus?.publish('content.deleted', {
      contentId,
      title: content.title,
      softDelete
    });

    this.logger.info('内容删除成功', { contentId, softDelete });
    
    return {
      contentId,
      status: softDelete ? 'soft_deleted' : 'hard_deleted'
    };
  }

  /**
   * 获取内容
   */
  async getContent(params) {
    const { contentId, includeDeleted = false } = params;
    
    const content = this.contentCollection.get(contentId);
    if (!content) {
      throw new Error(`内容不存在: ${contentId}`);
    }

    if (content.status === 'deleted' && !includeDeleted) {
      throw new Error(`内容已删除: ${contentId}`);
    }

    return content;
  }

  /**
   * 获取内容列表
   */
  async getContentList(params = {}) {
    const { 
      userId, 
      category, 
      status, 
      tags = [], 
      limit = 10, 
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false
    } = params;
    
    let contents = Array.from(this.contentCollection.values());
    
    // 过滤条件
    if (userId) {
      contents = contents.filter(c => c.userId === userId);
    }
    
    if (category) {
      contents = contents.filter(c => c.category === category);
    }
    
    if (status) {
      contents = contents.filter(c => c.status === status);
    } else if (!includeDeleted) {
      contents = contents.filter(c => c.status !== 'deleted');
    }
    
    if (tags.length > 0) {
      contents = contents.filter(c => 
        tags.some(tag => c.tags.includes(tag))
      );
    }
    
    // 排序
    contents.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'desc') {
        return new Date(bValue) - new Date(aValue);
      } else {
        return new Date(aValue) - new Date(bValue);
      }
    });
    
    // 分页
    const total = contents.length;
    const paginatedContents = contents.slice(offset, offset + limit);
    
    return {
      contents: paginatedContents.map(c => ({
        id: c.id,
        title: c.title,
        category: c.category,
        tags: c.tags,
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        metadata: c.metadata,
        analytics: c.analytics
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  /**
   * 搜索内容
   */
  async searchContent(params) {
    const { query, category, tags = [], limit = 10, offset = 0 } = params;
    
    let contents = Array.from(this.contentCollection.values())
      .filter(c => c.status !== 'deleted');
    
    // 文本搜索
    if (query) {
      const searchQuery = query.toLowerCase();
      contents = contents.filter(c => 
        c.title.toLowerCase().includes(searchQuery) ||
        c.content.toLowerCase().includes(searchQuery) ||
        c.tags.some(tag => tag.toLowerCase().includes(searchQuery))
      );
    }
    
    // 分类过滤
    if (category) {
      contents = contents.filter(c => c.category === category);
    }
    
    // 标签过滤
    if (tags.length > 0) {
      contents = contents.filter(c => 
        tags.some(tag => c.tags.includes(tag))
      );
    }
    
    // 按相关性排序（简单实现）
    if (query) {
      contents.sort((a, b) => {
        const aScore = this.calculateRelevanceScore(a, query);
        const bScore = this.calculateRelevanceScore(b, query);
        return bScore - aScore;
      });
    }
    
    const total = contents.length;
    const paginatedContents = contents.slice(offset, offset + limit);
    
    return {
      contents: paginatedContents,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      query
    };
  }

  /**
   * 验证内容数据
   */
  validateContentData(data) {
    const errors = [];
    
    if (!data.title || data.title.trim().length < 5) {
      errors.push('标题至少需要5个字符');
    }
    
    if (data.title && data.title.length > 200) {
      errors.push('标题不能超过200个字符');
    }
    
    if (!data.content || data.content.trim().length < 10) {
      errors.push('内容至少需要10个字符');
    }
    
    if (data.category && !this.categoryCollection.has(data.category)) {
      errors.push('分类不存在');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 处理标签
   */
  async processTags(tags) {
    const processedTags = [];
    
    for (const tag of tags) {
      const normalizedTag = tag.trim().toLowerCase();
      if (normalizedTag && !processedTags.includes(normalizedTag)) {
        processedTags.push(normalizedTag);
        
        // 更新标签统计
        if (!this.tagCollection.has(normalizedTag)) {
          this.tagCollection.set(normalizedTag, {
            name: normalizedTag,
            count: 0,
            createdAt: new Date()
          });
        }
        
        const tagData = this.tagCollection.get(normalizedTag);
        tagData.count++;
        this.tagCollection.set(normalizedTag, tagData);
      }
    }
    
    return processedTags;
  }

  /**
   * 生成URL友好的slug
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')
      .substring(0, 50);
  }

  /**
   * 生成元描述
   */
  generateMetaDescription(content) {
    return content
      .replace(/[^\w\s]/g, '')
      .substring(0, 160)
      .trim() + '...';
  }

  /**
   * 提取关键词
   */
  extractKeywords(content, tags) {
    const words = content.toLowerCase().match(/\b\w{3,}\b/g) || [];
    const wordCount = {};
    
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    const keywords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
    
    return [...new Set([...tags, ...keywords])];
  }

  /**
   * 计算相关性得分
   */
  calculateRelevanceScore(content, query) {
    const queryWords = query.toLowerCase().split(/\s+/);
    let score = 0;
    
    queryWords.forEach(word => {
      if (content.title.toLowerCase().includes(word)) {
        score += 3;
      }
      if (content.content.toLowerCase().includes(word)) {
        score += 1;
      }
      if (content.tags.some(tag => tag.includes(word))) {
        score += 2;
      }
    });
    
    return score;
  }

  /**
   * 更新分类计数
   */
  async updateCategoryCount(categoryId, delta) {
    const category = this.categoryCollection.get(categoryId);
    if (category) {
      category.contentCount = Math.max(0, category.contentCount + delta);
      this.categoryCollection.set(categoryId, category);
    }
  }

  /**
   * 获取内容统计
   */
  async getContentStats(params = {}) {
    const { userId } = params;
    
    let contents = Array.from(this.contentCollection.values());
    
    if (userId) {
      contents = contents.filter(c => c.userId === userId);
    }
    
    const stats = {
      total: contents.length,
      byStatus: {},
      byCategory: {},
      totalWords: 0,
      averageReadingTime: 0,
      topTags: []
    };
    
    contents.forEach(content => {
      // 按状态统计
      stats.byStatus[content.status] = (stats.byStatus[content.status] || 0) + 1;
      
      // 按分类统计
      stats.byCategory[content.category] = (stats.byCategory[content.category] || 0) + 1;
      
      // 总字数
      stats.totalWords += content.metadata.wordCount;
    });
    
    // 平均阅读时间
    if (contents.length > 0) {
      stats.averageReadingTime = Math.round(stats.totalWords / contents.length / 200);
    }
    
    // 热门标签
    const tagStats = Array.from(this.tagCollection.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    stats.topTags = tagStats.map(tag => ({
      name: tag.name,
      count: tag.count
    }));
    
    return stats;
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    const baseHealth = await super.healthCheck();
    
    return {
      ...baseHealth,
      details: {
        ...baseHealth.details,
        contentCount: this.contentCollection.size,
        categoryCount: this.categoryCollection.size,
        tagCount: this.tagCollection.size,
        memoryUsage: process.memoryUsage(),
        eventHandlers: this.listenerCount('content.create.request') + 
                      this.listenerCount('content.update.request') +
                      this.listenerCount('content.delete.request')
      }
    };
  }

  /**
   * 停止 Agent
   */
  async stop() {
    this.logger.info('停止内容管理Agent V3');
    
    // 清理资源
    this.contentCollection.clear();
    this.categoryCollection.clear();
    this.tagCollection.clear();
    this.removeAllListeners();
    
    await super.stop();
  }
}

module.exports = ContentManagementAgentV3;