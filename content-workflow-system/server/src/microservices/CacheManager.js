/**
 * 缓存管理器
 * 多级缓存策略、Redis集群、CDN集成
 */

class CacheManager {
  constructor() {
    this.localCache = new Map(); // 本地缓存
    this.redisCluster = null; // Redis集群连接
    this.cdnConfig = null; // CDN配置
    
    // 缓存配置
    this.config = {
      // 本地缓存配置
      local: {
        maxSize: 1000, // 最大缓存条目
        ttl: 300000, // 5分钟TTL
        cleanupInterval: 60000 // 1分钟清理间隔
      },
      // Redis配置
      redis: {
        cluster: {
          nodes: [
            { host: 'redis-node-1', port: 6379 },
            { host: 'redis-node-2', port: 6379 },
            { host: 'redis-node-3', port: 6379 }
          ],
          options: {
            enableReadyCheck: false,
            redisOptions: {
              password: process.env.REDIS_PASSWORD
            }
          }
        },
        ttl: 3600, // 1小时TTL
        keyPrefix: 'cw:' // 缓存键前缀
      },
      // CDN配置
      cdn: {
        enabled: true,
        provider: 'cloudflare',
        zones: {
          static: 'static.contentworkflow.com',
          api: 'api.contentworkflow.com'
        },
        ttl: {
          static: 86400, // 24小时
          api: 300 // 5分钟
        }
      }
    };

    // 缓存统计
    this.stats = {
      local: { hits: 0, misses: 0, sets: 0, deletes: 0 },
      redis: { hits: 0, misses: 0, sets: 0, deletes: 0 },
      cdn: { hits: 0, misses: 0, purges: 0 }
    };

    this.initializeCache();
  }

  /**
   * 初始化缓存系统
   */
  async initializeCache() {
    try {
      // 初始化本地缓存清理
      this.startLocalCacheCleanup();
      
      // 初始化Redis集群连接
      await this.initializeRedisCluster();
      
      // 初始化CDN配置
      this.initializeCDN();
      
      console.log('[CacheManager] 缓存系统初始化完成');
    } catch (error) {
      console.error('[CacheManager] 缓存系统初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化Redis集群
   */
  async initializeRedisCluster() {
    try {
      // 模拟Redis集群连接
      this.redisCluster = {
        get: async (key) => {
          // 模拟Redis GET操作
          const mockData = this.getMockRedisData(key);
          if (mockData) {
            this.stats.redis.hits++;
            return JSON.stringify(mockData);
          } else {
            this.stats.redis.misses++;
            return null;
          }
        },
        set: async (key, value, ttl) => {
          // 模拟Redis SET操作
          this.stats.redis.sets++;
          console.log(`[Redis] SET ${key} with TTL ${ttl}s`);
          return 'OK';
        },
        del: async (key) => {
          // 模拟Redis DEL操作
          this.stats.redis.deletes++;
          console.log(`[Redis] DEL ${key}`);
          return 1;
        },
        exists: async (key) => {
          // 模拟Redis EXISTS操作
          return Math.random() > 0.5 ? 1 : 0;
        },
        expire: async (key, ttl) => {
          // 模拟Redis EXPIRE操作
          console.log(`[Redis] EXPIRE ${key} ${ttl}s`);
          return 1;
        }
      };
      
      console.log('[CacheManager] Redis集群连接成功');
    } catch (error) {
      console.error('[CacheManager] Redis集群连接失败:', error);
      // 降级到本地缓存
      this.redisCluster = null;
    }
  }

  /**
   * 初始化CDN
   */
  initializeCDN() {
    if (this.config.cdn.enabled) {
      this.cdnConfig = {
        purgeCache: async (urls) => {
          // 模拟CDN缓存清除
          this.stats.cdn.purges++;
          console.log(`[CDN] 清除缓存: ${urls.join(', ')}`);
          return { success: true, purged: urls.length };
        },
        preloadCache: async (urls) => {
          // 模拟CDN缓存预热
          console.log(`[CDN] 预热缓存: ${urls.join(', ')}`);
          return { success: true, preloaded: urls.length };
        }
      };
      
      console.log('[CacheManager] CDN配置完成');
    }
  }

  /**
   * 获取缓存数据（多级缓存策略）
   */
  async get(key, options = {}) {
    const { skipLocal = false, skipRedis = false } = options;
    
    try {
      // 1. 本地缓存查找
      if (!skipLocal) {
        const localData = this.getFromLocalCache(key);
        if (localData !== null) {
          this.stats.local.hits++;
          return localData;
        }
        this.stats.local.misses++;
      }

      // 2. Redis缓存查找
      if (!skipRedis && this.redisCluster) {
        const redisKey = this.buildRedisKey(key);
        const redisData = await this.redisCluster.get(redisKey);
        
        if (redisData !== null) {
          const parsedData = JSON.parse(redisData);
          
          // 回填本地缓存
          if (!skipLocal) {
            this.setToLocalCache(key, parsedData);
          }
          
          return parsedData;
        }
      }

      return null;
    } catch (error) {
      console.error(`[CacheManager] 获取缓存失败 ${key}:`, error);
      return null;
    }
  }

  /**
   * 设置缓存数据
   */
  async set(key, value, options = {}) {
    const { 
      ttl = this.config.local.ttl, 
      skipLocal = false, 
      skipRedis = false 
    } = options;
    
    try {
      // 1. 设置本地缓存
      if (!skipLocal) {
        this.setToLocalCache(key, value, ttl);
        this.stats.local.sets++;
      }

      // 2. 设置Redis缓存
      if (!skipRedis && this.redisCluster) {
        const redisKey = this.buildRedisKey(key);
        const redisTtl = Math.floor(ttl / 1000); // 转换为秒
        await this.redisCluster.set(redisKey, JSON.stringify(value), redisTtl);
      }

      return true;
    } catch (error) {
      console.error(`[CacheManager] 设置缓存失败 ${key}:`, error);
      return false;
    }
  }

  /**
   * 删除缓存数据
   */
  async delete(key, options = {}) {
    const { skipLocal = false, skipRedis = false } = options;
    
    try {
      // 1. 删除本地缓存
      if (!skipLocal) {
        this.localCache.delete(key);
        this.stats.local.deletes++;
      }

      // 2. 删除Redis缓存
      if (!skipRedis && this.redisCluster) {
        const redisKey = this.buildRedisKey(key);
        await this.redisCluster.del(redisKey);
      }

      return true;
    } catch (error) {
      console.error(`[CacheManager] 删除缓存失败 ${key}:`, error);
      return false;
    }
  }

  /**
   * 批量获取缓存
   */
  async mget(keys, options = {}) {
    const results = {};
    
    for (const key of keys) {
      results[key] = await this.get(key, options);
    }
    
    return results;
  }

  /**
   * 批量设置缓存
   */
  async mset(keyValuePairs, options = {}) {
    const results = {};
    
    for (const [key, value] of Object.entries(keyValuePairs)) {
      results[key] = await this.set(key, value, options);
    }
    
    return results;
  }

  /**
   * 缓存预热
   */
  async warmup(warmupData) {
    console.log('[CacheManager] 开始缓存预热');
    
    let warmedCount = 0;
    
    for (const [key, value] of Object.entries(warmupData)) {
      try {
        await this.set(key, value, { ttl: this.config.redis.ttl * 1000 });
        warmedCount++;
      } catch (error) {
        console.error(`[CacheManager] 预热失败 ${key}:`, error);
      }
    }
    
    console.log(`[CacheManager] 缓存预热完成: ${warmedCount}/${Object.keys(warmupData).length}`);
    return warmedCount;
  }

  /**
   * 缓存失效
   */
  async invalidate(pattern) {
    console.log(`[CacheManager] 缓存失效: ${pattern}`);
    
    let invalidatedCount = 0;
    
    // 1. 本地缓存失效
    for (const key of this.localCache.keys()) {
      if (this.matchPattern(key, pattern)) {
        this.localCache.delete(key);
        invalidatedCount++;
      }
    }

    // 2. Redis缓存失效（简化实现）
    if (this.redisCluster) {
      // 在实际实现中，这里应该使用Redis的SCAN命令
      console.log(`[Redis] 失效模式: ${pattern}`);
    }

    // 3. CDN缓存清除
    if (this.cdnConfig && pattern.includes('static')) {
      await this.cdnConfig.purgeCache([`/*${pattern}*`]);
    }
    
    console.log(`[CacheManager] 缓存失效完成: ${invalidatedCount} 条目`);
    return invalidatedCount;
  }

  /**
   * 本地缓存操作
   */
  getFromLocalCache(key) {
    const item = this.localCache.get(key);
    
    if (!item) {
      return null;
    }
    
    // 检查TTL
    if (Date.now() > item.expireAt) {
      this.localCache.delete(key);
      return null;
    }
    
    return item.value;
  }

  setToLocalCache(key, value, ttl = this.config.local.ttl) {
    // 检查缓存大小限制
    if (this.localCache.size >= this.config.local.maxSize) {
      this.evictLocalCache();
    }
    
    this.localCache.set(key, {
      value,
      createdAt: Date.now(),
      expireAt: Date.now() + ttl
    });
  }

  /**
   * 本地缓存淘汰（LRU策略）
   */
  evictLocalCache() {
    const entries = Array.from(this.localCache.entries());
    
    // 按创建时间排序，删除最旧的10%
    entries.sort((a, b) => a[1].createdAt - b[1].createdAt);
    
    const evictCount = Math.floor(entries.length * 0.1);
    for (let i = 0; i < evictCount; i++) {
      this.localCache.delete(entries[i][0]);
    }
    
    console.log(`[CacheManager] 本地缓存淘汰: ${evictCount} 条目`);
  }

  /**
   * 启动本地缓存清理
   */
  startLocalCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const [key, item] of this.localCache.entries()) {
        if (now > item.expireAt) {
          this.localCache.delete(key);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`[CacheManager] 本地缓存清理: ${cleanedCount} 过期条目`);
      }
    }, this.config.local.cleanupInterval);
  }

  /**
   * 构建Redis键
   */
  buildRedisKey(key) {
    return `${this.config.redis.keyPrefix}${key}`;
  }

  /**
   * 模式匹配
   */
  matchPattern(key, pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }

  /**
   * 获取模拟Redis数据
   */
  getMockRedisData(key) {
    // 模拟一些常见的缓存数据
    const mockData = {
      'user:123': { id: 123, name: 'John Doe', email: 'john@example.com' },
      'content:456': { id: 456, title: 'Sample Content', views: 1000 },
      'analytics:daily': { date: '2024-01-01', views: 5000, users: 1200 }
    };
    
    return mockData[key.replace(this.config.redis.keyPrefix, '')] || null;
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    return {
      local: {
        ...this.stats.local,
        size: this.localCache.size,
        maxSize: this.config.local.maxSize,
        hitRate: this.stats.local.hits / (this.stats.local.hits + this.stats.local.misses) || 0
      },
      redis: {
        ...this.stats.redis,
        connected: !!this.redisCluster,
        hitRate: this.stats.redis.hits / (this.stats.redis.hits + this.stats.redis.misses) || 0
      },
      cdn: {
        ...this.stats.cdn,
        enabled: this.config.cdn.enabled
      }
    };
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        localCache: {
          status: 'healthy',
          size: this.localCache.size,
          maxSize: this.config.local.maxSize
        },
        redisCluster: {
          status: this.redisCluster ? 'healthy' : 'unavailable',
          connected: !!this.redisCluster
        },
        cdn: {
          status: this.config.cdn.enabled ? 'enabled' : 'disabled',
          provider: this.config.cdn.provider
        }
      },
      stats: this.getStats()
    };

    // 检查Redis连接
    if (this.redisCluster) {
      try {
        await this.redisCluster.exists('health-check');
        health.components.redisCluster.status = 'healthy';
      } catch (error) {
        health.components.redisCluster.status = 'unhealthy';
        health.components.redisCluster.error = error.message;
        health.status = 'degraded';
      }
    }

    return health;
  }

  /**
   * 重置统计
   */
  resetStats() {
    this.stats = {
      local: { hits: 0, misses: 0, sets: 0, deletes: 0 },
      redis: { hits: 0, misses: 0, sets: 0, deletes: 0 },
      cdn: { hits: 0, misses: 0, purges: 0 }
    };
    
    console.log('[CacheManager] 统计数据已重置');
  }

  /**
   * 停止缓存管理器
   */
  async stop() {
    try {
      console.log('[CacheManager] 停止缓存管理器');
      
      // 清理本地缓存
      this.localCache.clear();
      
      // 断开Redis连接
      if (this.redisCluster) {
        // 在实际实现中，这里应该调用Redis客户端的disconnect方法
        this.redisCluster = null;
      }
      
      return {
        success: true,
        message: '缓存管理器已停止',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[CacheManager] 停止缓存管理器失败:', error);
      throw error;
    }
  }
}

module.exports = CacheManager;