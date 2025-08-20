/**
 * 数据库管理器
 * 读写分离、分片策略、连接池优化
 */

class DatabaseManager {
  constructor() {
    this.connections = {
      master: null, // 主库连接
      slaves: [], // 从库连接
      shards: new Map() // 分片连接
    };
    
    this.connectionPools = {
      master: null,
      slaves: [],
      shards: new Map()
    };
    
    // 数据库配置
    this.config = {
      // 主从配置
      replication: {
        master: {
          host: process.env.DB_MASTER_HOST || 'localhost',
          port: process.env.DB_MASTER_PORT || 27017,
          database: process.env.DB_NAME || 'content_workflow',
          maxPoolSize: 20,
          minPoolSize: 5
        },
        slaves: [
          {
            host: process.env.DB_SLAVE1_HOST || 'localhost',
            port: process.env.DB_SLAVE1_PORT || 27018,
            database: process.env.DB_NAME || 'content_workflow',
            maxPoolSize: 15,
            minPoolSize: 3
          },
          {
            host: process.env.DB_SLAVE2_HOST || 'localhost',
            port: process.env.DB_SLAVE2_PORT || 27019,
            database: process.env.DB_NAME || 'content_workflow',
            maxPoolSize: 15,
            minPoolSize: 3
          }
        ]
      },
      // 分片配置
      sharding: {
        enabled: true,
        strategy: 'hash', // hash, range, directory
        shards: [
          {
            name: 'shard1',
            host: 'shard1.example.com',
            port: 27017,
            database: 'content_workflow_shard1',
            range: { min: 0, max: 333333 }
          },
          {
            name: 'shard2',
            host: 'shard2.example.com',
            port: 27017,
            database: 'content_workflow_shard2',
            range: { min: 333334, max: 666666 }
          },
          {
            name: 'shard3',
            host: 'shard3.example.com',
            port: 27017,
            database: 'content_workflow_shard3',
            range: { min: 666667, max: 999999 }
          }
        ]
      },
      // 连接池配置
      connectionPool: {
        maxPoolSize: 20,
        minPoolSize: 5,
        maxIdleTimeMS: 300000, // 5分钟
        waitQueueTimeoutMS: 10000, // 10秒
        serverSelectionTimeoutMS: 5000 // 5秒
      },
      // 查询配置
      query: {
        timeout: 30000, // 30秒查询超时
        maxRetries: 3, // 最大重试次数
        readPreference: 'secondaryPreferred' // 读偏好
      }
    };
    
    // 统计信息
    this.stats = {
      connections: {
        master: { active: 0, idle: 0, total: 0 },
        slaves: { active: 0, idle: 0, total: 0 },
        shards: { active: 0, idle: 0, total: 0 }
      },
      queries: {
        read: { count: 0, totalTime: 0, errors: 0 },
        write: { count: 0, totalTime: 0, errors: 0 }
      },
      sharding: {
        distribution: new Map(),
        crossShardQueries: 0
      }
    };

    this.initializeDatabase();
  }

  /**
   * 初始化数据库连接
   */
  async initializeDatabase() {
    try {
      // 初始化主库连接
      await this.initializeMasterConnection();
      
      // 初始化从库连接
      await this.initializeSlaveConnections();
      
      // 初始化分片连接
      if (this.config.sharding.enabled) {
        await this.initializeShardConnections();
      }
      
      // 启动连接监控
      this.startConnectionMonitoring();
      
      console.log('[DatabaseManager] 数据库连接初始化完成');
    } catch (error) {
      console.error('[DatabaseManager] 数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化主库连接
   */
  async initializeMasterConnection() {
    try {
      const masterConfig = this.config.replication.master;
      
      // 模拟MongoDB连接
      this.connections.master = {
        host: masterConfig.host,
        port: masterConfig.port,
        database: masterConfig.database,
        status: 'connected',
        connectedAt: new Date().toISOString(),
        
        // 模拟数据库操作
        insertOne: async (collection, document) => {
          const startTime = Date.now();
          try {
            // 模拟插入操作
            const result = {
              insertedId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              acknowledged: true
            };
            
            this.updateQueryStats('write', Date.now() - startTime);
            return result;
          } catch (error) {
            this.updateQueryStats('write', Date.now() - startTime, true);
            throw error;
          }
        },
        
        updateOne: async (collection, filter, update) => {
          const startTime = Date.now();
          try {
            const result = {
              matchedCount: 1,
              modifiedCount: 1,
              acknowledged: true
            };
            
            this.updateQueryStats('write', Date.now() - startTime);
            return result;
          } catch (error) {
            this.updateQueryStats('write', Date.now() - startTime, true);
            throw error;
          }
        },
        
        deleteOne: async (collection, filter) => {
          const startTime = Date.now();
          try {
            const result = {
              deletedCount: 1,
              acknowledged: true
            };
            
            this.updateQueryStats('write', Date.now() - startTime);
            return result;
          } catch (error) {
            this.updateQueryStats('write', Date.now() - startTime, true);
            throw error;
          }
        }
      };
      
      this.stats.connections.master.total = 1;
      this.stats.connections.master.active = 1;
      
      console.log('[DatabaseManager] 主库连接成功');
    } catch (error) {
      console.error('[DatabaseManager] 主库连接失败:', error);
      throw error;
    }
  }

  /**
   * 初始化从库连接
   */
  async initializeSlaveConnections() {
    try {
      for (const [index, slaveConfig] of this.config.replication.slaves.entries()) {
        const slaveConnection = {
          host: slaveConfig.host,
          port: slaveConfig.port,
          database: slaveConfig.database,
          status: 'connected',
          connectedAt: new Date().toISOString(),
          
          // 模拟查询操作
          findOne: async (collection, filter) => {
            const startTime = Date.now();
            try {
              // 模拟查询结果
              const result = this.generateMockDocument(collection, filter);
              
              this.updateQueryStats('read', Date.now() - startTime);
              return result;
            } catch (error) {
              this.updateQueryStats('read', Date.now() - startTime, true);
              throw error;
            }
          },
          
          find: async (collection, filter, options = {}) => {
            const startTime = Date.now();
            try {
              const limit = options.limit || 10;
              const results = [];
              
              for (let i = 0; i < limit; i++) {
                results.push(this.generateMockDocument(collection, filter));
              }
              
              this.updateQueryStats('read', Date.now() - startTime);
              return results;
            } catch (error) {
              this.updateQueryStats('read', Date.now() - startTime, true);
              throw error;
            }
          },
          
          aggregate: async (collection, pipeline) => {
            const startTime = Date.now();
            try {
              // 模拟聚合结果
              const results = [
                { _id: 'group1', count: 100, total: 5000 },
                { _id: 'group2', count: 150, total: 7500 }
              ];
              
              this.updateQueryStats('read', Date.now() - startTime);
              return results;
            } catch (error) {
              this.updateQueryStats('read', Date.now() - startTime, true);
              throw error;
            }
          }
        };
        
        this.connections.slaves.push(slaveConnection);
        this.stats.connections.slaves.total++;
        this.stats.connections.slaves.active++;
      }
      
      console.log(`[DatabaseManager] ${this.connections.slaves.length} 个从库连接成功`);
    } catch (error) {
      console.error('[DatabaseManager] 从库连接失败:', error);
      throw error;
    }
  }

  /**
   * 初始化分片连接
   */
  async initializeShardConnections() {
    try {
      for (const shardConfig of this.config.sharding.shards) {
        const shardConnection = {
          name: shardConfig.name,
          host: shardConfig.host,
          port: shardConfig.port,
          database: shardConfig.database,
          range: shardConfig.range,
          status: 'connected',
          connectedAt: new Date().toISOString(),
          
          // 继承从库的查询方法
          findOne: this.connections.slaves[0]?.findOne,
          find: this.connections.slaves[0]?.find,
          aggregate: this.connections.slaves[0]?.aggregate,
          
          // 继承主库的写入方法
          insertOne: this.connections.master?.insertOne,
          updateOne: this.connections.master?.updateOne,
          deleteOne: this.connections.master?.deleteOne
        };
        
        this.connections.shards.set(shardConfig.name, shardConnection);
        this.stats.connections.shards.total++;
        this.stats.connections.shards.active++;
        this.stats.sharding.distribution.set(shardConfig.name, 0);
      }
      
      console.log(`[DatabaseManager] ${this.connections.shards.size} 个分片连接成功`);
    } catch (error) {
      console.error('[DatabaseManager] 分片连接失败:', error);
      throw error;
    }
  }

  /**
   * 读操作（自动选择从库或分片）
   */
  async read(collection, operation, ...args) {
    try {
      // 如果启用分片，根据查询条件选择分片
      if (this.config.sharding.enabled && this.shouldUseSharding(collection, operation, args[0])) {
        return await this.readFromShard(collection, operation, ...args);
      }
      
      // 否则使用从库
      return await this.readFromSlave(collection, operation, ...args);
    } catch (error) {
      console.error(`[DatabaseManager] 读操作失败 ${collection}.${operation}:`, error);
      throw error;
    }
  }

  /**
   * 写操作（使用主库）
   */
  async write(collection, operation, ...args) {
    try {
      if (!this.connections.master) {
        throw new Error('主库连接不可用');
      }
      
      // 如果启用分片，可能需要写入多个分片
      if (this.config.sharding.enabled && this.shouldUseSharding(collection, operation, args[0])) {
        return await this.writeToShard(collection, operation, ...args);
      }
      
      // 否则写入主库
      return await this.connections.master[operation](collection, ...args);
    } catch (error) {
      console.error(`[DatabaseManager] 写操作失败 ${collection}.${operation}:`, error);
      throw error;
    }
  }

  /**
   * 从从库读取
   */
  async readFromSlave(collection, operation, ...args) {
    if (this.connections.slaves.length === 0) {
      throw new Error('从库连接不可用');
    }
    
    // 负载均衡选择从库
    const slaveIndex = this.selectSlave();
    const slave = this.connections.slaves[slaveIndex];
    
    if (!slave || slave.status !== 'connected') {
      throw new Error(`从库 ${slaveIndex} 不可用`);
    }
    
    return await slave[operation](collection, ...args);
  }

  /**
   * 写入分片
   */
  async writeToShard(collection, operation, document, ...args) {
    const shardKey = this.getShardKey(document);
    const shard = this.selectShard(shardKey);
    
    if (!shard) {
      throw new Error('无法确定目标分片');
    }
    
    // 更新分片分布统计
    const currentCount = this.stats.sharding.distribution.get(shard.name) || 0;
    this.stats.sharding.distribution.set(shard.name, currentCount + 1);
    
    return await shard[operation](collection, document, ...args);
  }

  /**
   * 从分片读取
   */
  async readFromShard(collection, operation, filter, ...args) {
    // 如果查询包含分片键，直接路由到对应分片
    if (filter && this.hasShardKey(filter)) {
      const shardKey = this.getShardKey(filter);
      const shard = this.selectShard(shardKey);
      
      if (shard) {
        return await shard[operation](collection, filter, ...args);
      }
    }
    
    // 否则需要查询所有分片（跨分片查询）
    this.stats.sharding.crossShardQueries++;
    
    const results = [];
    for (const [shardName, shard] of this.connections.shards) {
      try {
        const shardResult = await shard[operation](collection, filter, ...args);
        if (Array.isArray(shardResult)) {
          results.push(...shardResult);
        } else if (shardResult) {
          results.push(shardResult);
        }
      } catch (error) {
        console.error(`[DatabaseManager] 分片 ${shardName} 查询失败:`, error);
      }
    }
    
    return operation === 'findOne' ? results[0] : results;
  }

  /**
   * 选择从库（轮询策略）
   */
  selectSlave() {
    if (!this.slaveIndex) {
      this.slaveIndex = 0;
    }
    
    const index = this.slaveIndex % this.connections.slaves.length;
    this.slaveIndex++;
    
    return index;
  }

  /**
   * 选择分片
   */
  selectShard(shardKey) {
    if (this.config.sharding.strategy === 'hash') {
      return this.selectShardByHash(shardKey);
    } else if (this.config.sharding.strategy === 'range') {
      return this.selectShardByRange(shardKey);
    }
    
    return null;
  }

  /**
   * 基于哈希的分片选择
   */
  selectShardByHash(shardKey) {
    const hash = this.hashFunction(shardKey);
    const shardIndex = hash % this.config.sharding.shards.length;
    const shardConfig = this.config.sharding.shards[shardIndex];
    
    return this.connections.shards.get(shardConfig.name);
  }

  /**
   * 基于范围的分片选择
   */
  selectShardByRange(shardKey) {
    const numericKey = typeof shardKey === 'string' ? 
      parseInt(shardKey.replace(/\D/g, '')) : shardKey;
    
    for (const shardConfig of this.config.sharding.shards) {
      if (numericKey >= shardConfig.range.min && numericKey <= shardConfig.range.max) {
        return this.connections.shards.get(shardConfig.name);
      }
    }
    
    return null;
  }

  /**
   * 获取分片键
   */
  getShardKey(document) {
    // 默认使用_id或userId作为分片键
    return document._id || document.userId || document.id || Math.random().toString();
  }

  /**
   * 检查是否包含分片键
   */
  hasShardKey(filter) {
    return filter && (filter._id || filter.userId || filter.id);
  }

  /**
   * 哈希函数
   */
  hashFunction(key) {
    let hash = 0;
    const str = key.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return Math.abs(hash);
  }

  /**
   * 判断是否应该使用分片
   */
  shouldUseSharding(collection, operation, filter) {
    // 某些集合可能不需要分片
    const nonShardedCollections = ['system', 'config', 'logs'];
    
    if (nonShardedCollections.includes(collection)) {
      return false;
    }
    
    // 写操作通常需要分片
    if (['insertOne', 'updateOne', 'deleteOne'].includes(operation)) {
      return true;
    }
    
    // 包含分片键的查询使用分片
    if (filter && this.hasShardKey(filter)) {
      return true;
    }
    
    return false;
  }

  /**
   * 生成模拟文档
   */
  generateMockDocument(collection, filter) {
    const baseDoc = {
      _id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 根据集合类型生成不同的模拟数据
    switch (collection) {
      case 'users':
        return {
          ...baseDoc,
          name: 'Mock User',
          email: 'mock@example.com',
          status: 'active'
        };
      case 'contents':
        return {
          ...baseDoc,
          title: 'Mock Content',
          body: 'This is mock content',
          status: 'published',
          views: Math.floor(Math.random() * 1000)
        };
      case 'analytics':
        return {
          ...baseDoc,
          event: 'page_view',
          userId: 'user123',
          timestamp: Date.now(),
          data: { page: '/dashboard' }
        };
      default:
        return baseDoc;
    }
  }

  /**
   * 更新查询统计
   */
  updateQueryStats(type, duration, isError = false) {
    if (isError) {
      this.stats.queries[type].errors++;
    } else {
      this.stats.queries[type].count++;
      this.stats.queries[type].totalTime += duration;
    }
  }

  /**
   * 启动连接监控
   */
  startConnectionMonitoring() {
    setInterval(() => {
      this.checkConnectionHealth();
    }, 30000); // 每30秒检查一次
    
    console.log('[DatabaseManager] 连接监控已启动');
  }

  /**
   * 检查连接健康状态
   */
  async checkConnectionHealth() {
    try {
      // 检查主库连接
      if (this.connections.master) {
        // 模拟ping操作
        const pingResult = await this.pingConnection(this.connections.master);
        if (!pingResult) {
          console.warn('[DatabaseManager] 主库连接异常');
          this.connections.master.status = 'disconnected';
        }
      }
      
      // 检查从库连接
      for (const [index, slave] of this.connections.slaves.entries()) {
        const pingResult = await this.pingConnection(slave);
        if (!pingResult) {
          console.warn(`[DatabaseManager] 从库 ${index} 连接异常`);
          slave.status = 'disconnected';
        }
      }
      
      // 检查分片连接
      for (const [shardName, shard] of this.connections.shards) {
        const pingResult = await this.pingConnection(shard);
        if (!pingResult) {
          console.warn(`[DatabaseManager] 分片 ${shardName} 连接异常`);
          shard.status = 'disconnected';
        }
      }
    } catch (error) {
      console.error('[DatabaseManager] 连接健康检查失败:', error);
    }
  }

  /**
   * Ping连接
   */
  async pingConnection(connection) {
    try {
      // 模拟ping操作
      return Math.random() > 0.1; // 90%成功率
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取数据库统计
   */
  getStats() {
    const avgReadTime = this.stats.queries.read.count > 0 ? 
      this.stats.queries.read.totalTime / this.stats.queries.read.count : 0;
    
    const avgWriteTime = this.stats.queries.write.count > 0 ? 
      this.stats.queries.write.totalTime / this.stats.queries.write.count : 0;
    
    return {
      connections: {
        master: {
          ...this.stats.connections.master,
          status: this.connections.master?.status || 'disconnected'
        },
        slaves: {
          ...this.stats.connections.slaves,
          count: this.connections.slaves.length,
          healthy: this.connections.slaves.filter(s => s.status === 'connected').length
        },
        shards: {
          ...this.stats.connections.shards,
          count: this.connections.shards.size,
          healthy: Array.from(this.connections.shards.values())
            .filter(s => s.status === 'connected').length
        }
      },
      queries: {
        read: {
          ...this.stats.queries.read,
          avgTime: Math.round(avgReadTime),
          errorRate: this.stats.queries.read.count > 0 ? 
            this.stats.queries.read.errors / this.stats.queries.read.count : 0
        },
        write: {
          ...this.stats.queries.write,
          avgTime: Math.round(avgWriteTime),
          errorRate: this.stats.queries.write.count > 0 ? 
            this.stats.queries.write.errors / this.stats.queries.write.count : 0
        }
      },
      sharding: {
        enabled: this.config.sharding.enabled,
        strategy: this.config.sharding.strategy,
        distribution: Object.fromEntries(this.stats.sharding.distribution),
        crossShardQueries: this.stats.sharding.crossShardQueries
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
        master: {
          status: this.connections.master?.status || 'disconnected',
          connected: !!this.connections.master
        },
        slaves: {
          status: 'healthy',
          total: this.connections.slaves.length,
          healthy: this.connections.slaves.filter(s => s.status === 'connected').length
        },
        shards: {
          status: 'healthy',
          enabled: this.config.sharding.enabled,
          total: this.connections.shards.size,
          healthy: Array.from(this.connections.shards.values())
            .filter(s => s.status === 'connected').length
        }
      },
      stats: this.getStats()
    };

    // 检查整体健康状态
    if (!this.connections.master || this.connections.master.status !== 'connected') {
      health.status = 'unhealthy';
      health.components.master.status = 'unhealthy';
    }

    const healthySlaves = this.connections.slaves.filter(s => s.status === 'connected').length;
    if (healthySlaves < this.connections.slaves.length * 0.5) {
      health.status = 'degraded';
      health.components.slaves.status = 'degraded';
    }

    if (this.config.sharding.enabled) {
      const healthyShards = Array.from(this.connections.shards.values())
        .filter(s => s.status === 'connected').length;
      
      if (healthyShards < this.connections.shards.size * 0.5) {
        health.status = 'degraded';
        health.components.shards.status = 'degraded';
      }
    }

    return health;
  }

  /**
   * 重置统计
   */
  resetStats() {
    this.stats = {
      connections: {
        master: { active: 0, idle: 0, total: 0 },
        slaves: { active: 0, idle: 0, total: 0 },
        shards: { active: 0, idle: 0, total: 0 }
      },
      queries: {
        read: { count: 0, totalTime: 0, errors: 0 },
        write: { count: 0, totalTime: 0, errors: 0 }
      },
      sharding: {
        distribution: new Map(),
        crossShardQueries: 0
      }
    };
    
    console.log('[DatabaseManager] 统计数据已重置');
  }

  /**
   * 停止数据库管理器
   */
  async stop() {
    try {
      console.log('[DatabaseManager] 停止数据库管理器');
      
      // 关闭主库连接
      if (this.connections.master) {
        this.connections.master.status = 'disconnected';
        this.connections.master = null;
      }
      
      // 关闭从库连接
      for (const slave of this.connections.slaves) {
        slave.status = 'disconnected';
      }
      this.connections.slaves = [];
      
      // 关闭分片连接
      for (const [shardName, shard] of this.connections.shards) {
        shard.status = 'disconnected';
      }
      this.connections.shards.clear();
      
      return {
        success: true,
        message: '数据库管理器已停止',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[DatabaseManager] 停止数据库管理器失败:', error);
      throw error;
    }
  }
}

module.exports = DatabaseManager;
