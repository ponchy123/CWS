/**
 * 负载均衡器
 * 支持多种负载均衡算法、健康检查、故障转移
 */

class LoadBalancer {
  constructor() {
    this.servers = new Map(); // 服务器列表
    this.algorithms = {
      roundRobin: this.roundRobinSelect.bind(this),
      weightedRoundRobin: this.weightedRoundRobinSelect.bind(this),
      leastConnections: this.leastConnectionsSelect.bind(this),
      ipHash: this.ipHashSelect.bind(this),
      random: this.randomSelect.bind(this)
    };
    
    // 配置
    this.config = {
      algorithm: 'roundRobin', // 默认算法
      healthCheck: {
        enabled: true,
        interval: 30000, // 30秒
        timeout: 5000, // 5秒超时
        retries: 3, // 重试次数
        path: '/health' // 健康检查路径
      },
      failover: {
        enabled: true,
        maxRetries: 3,
        retryDelay: 1000 // 1秒
      },
      circuit: {
        enabled: true,
        failureThreshold: 5, // 失败阈值
        recoveryTimeout: 60000, // 恢复超时60秒
        halfOpenMaxCalls: 3 // 半开状态最大调用数
      }
    };
    
    // 状态管理
    this.state = {
      currentIndex: 0, // 轮询索引
      weightedIndex: 0, // 加权轮询索引
      circuitBreakers: new Map() // 熔断器状态
    };
    
    // 统计信息
    this.stats = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
        totalResponseTime: 0
      },
      servers: new Map(),
      algorithms: {
        roundRobin: 0,
        weightedRoundRobin: 0,
        leastConnections: 0,
        ipHash: 0,
        random: 0
      }
    };

    this.initializeLoadBalancer();
  }

  /**
   * 初始化负载均衡器
   */
  async initializeLoadBalancer() {
    try {
      // 添加默认服务器
      await this.addServer('server1', {
        host: 'localhost',
        port: 3001,
        weight: 3,
        maxConnections: 100
      });
      
      await this.addServer('server2', {
        host: 'localhost',
        port: 3002,
        weight: 2,
        maxConnections: 80
      });
      
      await this.addServer('server3', {
        host: 'localhost',
        port: 3003,
        weight: 1,
        maxConnections: 60
      });
      
      // 启动健康检查
      if (this.config.healthCheck.enabled) {
        this.startHealthCheck();
      }
      
      console.log('[LoadBalancer] 负载均衡器初始化完成');
    } catch (error) {
      console.error('[LoadBalancer] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 添加服务器
   */
  async addServer(id, config) {
    const server = {
      id,
      host: config.host,
      port: config.port,
      weight: config.weight || 1,
      maxConnections: config.maxConnections || 100,
      currentConnections: 0,
      status: 'healthy',
      lastHealthCheck: null,
      healthCheckFailures: 0,
      responseTime: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      createdAt: new Date().toISOString()
    };
    
    this.servers.set(id, server);
    this.stats.servers.set(id, {
      requests: 0,
      responses: 0,
      errors: 0,
      avgResponseTime: 0
    });
    
    // 初始化熔断器
    this.state.circuitBreakers.set(id, {
      state: 'closed', // closed, open, half-open
      failures: 0,
      lastFailureTime: null,
      nextAttemptTime: null
    });
    
    console.log(`[LoadBalancer] 服务器 ${id} 已添加: ${config.host}:${config.port}`);
    return server;
  }

  /**
   * 移除服务器
   */
  async removeServer(id) {
    if (this.servers.has(id)) {
      this.servers.delete(id);
      this.stats.servers.delete(id);
      this.state.circuitBreakers.delete(id);
      
      console.log(`[LoadBalancer] 服务器 ${id} 已移除`);
      return true;
    }
    
    return false;
  }

  /**
   * 选择服务器
   */
  async selectServer(clientIp = null, options = {}) {
    const algorithm = options.algorithm || this.config.algorithm;
    
    try {
      // 获取健康的服务器列表
      const healthyServers = this.getHealthyServers();
      
      if (healthyServers.length === 0) {
        throw new Error('没有可用的健康服务器');
      }
      
      // 根据算法选择服务器
      const server = await this.algorithms[algorithm](healthyServers, clientIp, options);
      
      if (!server) {
        throw new Error('无法选择服务器');
      }
      
      // 更新统计
      this.stats.algorithms[algorithm]++;
      
      return server;
    } catch (error) {
      console.error('[LoadBalancer] 选择服务器失败:', error);
      throw error;
    }
  }

  /**
   * 轮询算法
   */
  async roundRobinSelect(servers) {
    if (servers.length === 0) return null;
    
    const server = servers[this.state.currentIndex % servers.length];
    this.state.currentIndex++;
    
    return server;
  }

  /**
   * 加权轮询算法
   */
  async weightedRoundRobinSelect(servers) {
    if (servers.length === 0) return null;
    
    // 计算总权重
    const totalWeight = servers.reduce((sum, server) => sum + server.weight, 0);
    
    // 生成加权列表
    const weightedList = [];
    for (const server of servers) {
      for (let i = 0; i < server.weight; i++) {
        weightedList.push(server);
      }
    }
    
    const server = weightedList[this.state.weightedIndex % weightedList.length];
    this.state.weightedIndex++;
    
    return server;
  }

  /**
   * 最少连接算法
   */
  async leastConnectionsSelect(servers) {
    if (servers.length === 0) return null;
    
    return servers.reduce((min, server) => 
      server.currentConnections < min.currentConnections ? server : min
    );
  }

  /**
   * IP哈希算法
   */
  async ipHashSelect(servers, clientIp) {
    if (servers.length === 0) return null;
    
    if (!clientIp) {
      // 如果没有IP，回退到轮询
      return this.roundRobinSelect(servers);
    }
    
    // 简单哈希函数
    let hash = 0;
    for (let i = 0; i < clientIp.length; i++) {
      hash = ((hash << 5) - hash + clientIp.charCodeAt(i)) & 0xffffffff;
    }
    
    const index = Math.abs(hash) % servers.length;
    return servers[index];
  }

  /**
   * 随机算法
   */
  async randomSelect(servers) {
    if (servers.length === 0) return null;
    
    const index = Math.floor(Math.random() * servers.length);
    return servers[index];
  }

  /**
   * 处理请求
   */
  async handleRequest(request, clientIp = null) {
    const startTime = Date.now();
    let selectedServer = null;
    let attempts = 0;
    
    try {
      while (attempts < this.config.failover.maxRetries) {
        attempts++;
        
        // 选择服务器
        selectedServer = await this.selectServer(clientIp);
        
        // 检查熔断器状态
        if (!this.isServerAvailable(selectedServer.id)) {
          console.warn(`[LoadBalancer] 服务器 ${selectedServer.id} 熔断中，尝试其他服务器`);
          continue;
        }
        
        try {
          // 增加连接数
          selectedServer.currentConnections++;
          
          // 模拟请求处理
          const response = await this.forwardRequest(selectedServer, request);
          
          // 记录成功
          this.recordSuccess(selectedServer, Date.now() - startTime);
          
          return {
            success: true,
            server: selectedServer.id,
            response,
            responseTime: Date.now() - startTime,
            attempts
          };
          
        } catch (error) {
          // 记录失败
          this.recordFailure(selectedServer, error);
          
          if (attempts >= this.config.failover.maxRetries) {
            throw error;
          }
          
          // 等待重试
          await this.delay(this.config.failover.retryDelay);
        } finally {
          // 减少连接数
          if (selectedServer) {
            selectedServer.currentConnections--;
          }
        }
      }
      
      throw new Error('所有重试都失败了');
      
    } catch (error) {
      console.error('[LoadBalancer] 请求处理失败:', error);
      
      // 更新统计
      this.stats.requests.total++;
      this.stats.requests.failed++;
      
      throw error;
    }
  }

  /**
   * 转发请求到服务器
   */
  async forwardRequest(server, request) {
    // 模拟HTTP请求
    const delay = Math.random() * 100 + 50; // 50-150ms延迟
    
    await this.delay(delay);
    
    // 模拟偶尔的失败
    if (Math.random() < 0.05) { // 5%失败率
      throw new Error(`服务器 ${server.id} 请求失败`);
    }
    
    return {
      status: 200,
      data: {
        message: '请求成功',
        server: server.id,
        timestamp: new Date().toISOString(),
        request: request
      }
    };
  }

  /**
   * 记录成功请求
   */
  recordSuccess(server, responseTime) {
    // 更新服务器统计
    server.totalRequests++;
    server.successfulRequests++;
    server.responseTime = responseTime;
    
    // 更新全局统计
    this.stats.requests.total++;
    this.stats.requests.successful++;
    this.stats.requests.totalResponseTime += responseTime;
    this.stats.requests.avgResponseTime = 
      this.stats.requests.totalResponseTime / this.stats.requests.successful;
    
    // 更新服务器级统计
    const serverStats = this.stats.servers.get(server.id);
    if (serverStats) {
      serverStats.requests++;
      serverStats.responses++;
      serverStats.avgResponseTime = 
        (serverStats.avgResponseTime * (serverStats.responses - 1) + responseTime) / 
        serverStats.responses;
    }
    
    // 重置熔断器失败计数
    const circuitBreaker = this.state.circuitBreakers.get(server.id);
    if (circuitBreaker) {
      circuitBreaker.failures = 0;
      if (circuitBreaker.state === 'half-open') {
        circuitBreaker.state = 'closed';
        console.log(`[LoadBalancer] 服务器 ${server.id} 熔断器恢复为关闭状态`);
      }
    }
  }

  /**
   * 记录失败请求
   */
  recordFailure(server, error) {
    // 更新服务器统计
    server.totalRequests++;
    server.failedRequests++;
    
    // 更新全局统计
    this.stats.requests.total++;
    this.stats.requests.failed++;
    
    // 更新服务器级统计
    const serverStats = this.stats.servers.get(server.id);
    if (serverStats) {
      serverStats.requests++;
      serverStats.errors++;
    }
    
    // 更新熔断器状态
    if (this.config.circuit.enabled) {
      this.updateCircuitBreaker(server.id, error);
    }
  }

  /**
   * 更新熔断器状态
   */
  updateCircuitBreaker(serverId, error) {
    const circuitBreaker = this.state.circuitBreakers.get(serverId);
    if (!circuitBreaker) return;
    
    circuitBreaker.failures++;
    circuitBreaker.lastFailureTime = Date.now();
    
    if (circuitBreaker.state === 'closed' && 
        circuitBreaker.failures >= this.config.circuit.failureThreshold) {
      // 打开熔断器
      circuitBreaker.state = 'open';
      circuitBreaker.nextAttemptTime = Date.now() + this.config.circuit.recoveryTimeout;
      
      console.warn(`[LoadBalancer] 服务器 ${serverId} 熔断器打开，失败次数: ${circuitBreaker.failures}`);
    }
  }

  /**
   * 检查服务器是否可用
   */
  isServerAvailable(serverId) {
    const server = this.servers.get(serverId);
    if (!server || server.status !== 'healthy') {
      return false;
    }
    
    if (!this.config.circuit.enabled) {
      return true;
    }
    
    const circuitBreaker = this.state.circuitBreakers.get(serverId);
    if (!circuitBreaker) return true;
    
    const now = Date.now();
    
    switch (circuitBreaker.state) {
      case 'closed':
        return true;
      
      case 'open':
        if (now >= circuitBreaker.nextAttemptTime) {
          // 转换为半开状态
          circuitBreaker.state = 'half-open';
          circuitBreaker.failures = 0;
          console.log(`[LoadBalancer] 服务器 ${serverId} 熔断器转为半开状态`);
          return true;
        }
        return false;
      
      case 'half-open':
        return circuitBreaker.failures < this.config.circuit.halfOpenMaxCalls;
      
      default:
        return false;
    }
  }

  /**
   * 获取健康的服务器列表
   */
  getHealthyServers() {
    return Array.from(this.servers.values()).filter(server => 
      server.status === 'healthy' && this.isServerAvailable(server.id)
    );
  }

  /**
   * 启动健康检查
   */
  startHealthCheck() {
    setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheck.interval);
    
    console.log('[LoadBalancer] 健康检查已启动');
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck() {
    for (const [serverId, server] of this.servers) {
      try {
        const isHealthy = await this.checkServerHealth(server);
        
        if (isHealthy) {
          if (server.status !== 'healthy') {
            server.status = 'healthy';
            server.healthCheckFailures = 0;
            console.log(`[LoadBalancer] 服务器 ${serverId} 恢复健康`);
          }
        } else {
          server.healthCheckFailures++;
          
          if (server.healthCheckFailures >= this.config.healthCheck.retries) {
            if (server.status !== 'unhealthy') {
              server.status = 'unhealthy';
              console.warn(`[LoadBalancer] 服务器 ${serverId} 标记为不健康`);
            }
          }
        }
        
        server.lastHealthCheck = new Date().toISOString();
        
      } catch (error) {
        console.error(`[LoadBalancer] 服务器 ${serverId} 健康检查失败:`, error);
        server.healthCheckFailures++;
        
        if (server.healthCheckFailures >= this.config.healthCheck.retries) {
          server.status = 'unhealthy';
        }
      }
    }
  }

  /**
   * 检查单个服务器健康状态
   */
  async checkServerHealth(server) {
    try {
      // 模拟健康检查请求
      const startTime = Date.now();
      
      // 模拟HTTP健康检查
      await this.delay(Math.random() * 50 + 10); // 10-60ms延迟
      
      // 90%的健康检查成功率
      const isHealthy = Math.random() > 0.1;
      
      if (isHealthy) {
        server.responseTime = Date.now() - startTime;
      }
      
      return isHealthy;
    } catch (error) {
      return false;
    }
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取负载均衡统计
   */
  getStats() {
    const healthyServers = this.getHealthyServers();
    const totalServers = this.servers.size;
    
    return {
      servers: {
        total: totalServers,
        healthy: healthyServers.length,
        unhealthy: totalServers - healthyServers.length,
        details: Array.from(this.servers.entries()).map(([id, server]) => ({
          id,
          status: server.status,
          connections: server.currentConnections,
          maxConnections: server.maxConnections,
          weight: server.weight,
          responseTime: server.responseTime,
          totalRequests: server.totalRequests,
          successRate: server.totalRequests > 0 ? 
            (server.successfulRequests / server.totalRequests * 100).toFixed(2) + '%' : '0%',
          circuitBreakerState: this.state.circuitBreakers.get(id)?.state || 'unknown'
        }))
      },
      requests: {
        ...this.stats.requests,
        successRate: this.stats.requests.total > 0 ? 
          (this.stats.requests.successful / this.stats.requests.total * 100).toFixed(2) + '%' : '0%'
      },
      algorithms: this.stats.algorithms,
      circuitBreakers: Object.fromEntries(
        Array.from(this.state.circuitBreakers.entries()).map(([id, cb]) => [
          id, {
            state: cb.state,
            failures: cb.failures,
            lastFailureTime: cb.lastFailureTime,
            nextAttemptTime: cb.nextAttemptTime
          }
        ])
      )
    };
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    const stats = this.getStats();
    
    return {
      status: stats.servers.healthy > 0 ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      loadBalancer: {
        algorithm: this.config.algorithm,
        healthCheckEnabled: this.config.healthCheck.enabled,
        circuitBreakerEnabled: this.config.circuit.enabled
      },
      servers: stats.servers,
      performance: {
        avgResponseTime: Math.round(stats.requests.avgResponseTime),
        successRate: stats.requests.successRate,
        totalRequests: stats.requests.total
      }
    };
  }

  /**
   * 重置统计
   */
  resetStats() {
    this.stats = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
        totalResponseTime: 0
      },
      servers: new Map(),
      algorithms: {
        roundRobin: 0,
        weightedRoundRobin: 0,
        leastConnections: 0,
        ipHash: 0,
        random: 0
      }
    };
    
    // 重置服务器统计
    for (const [serverId] of this.servers) {
      this.stats.servers.set(serverId, {
        requests: 0,
        responses: 0,
        errors: 0,
        avgResponseTime: 0
      });
    }
    
    console.log('[LoadBalancer] 统计数据已重置');
  }

  /**
   * 停止负载均衡器
   */
  async stop() {
    try {
      console.log('[LoadBalancer] 停止负载均衡器');
      
      // 清理服务器列表
      this.servers.clear();
      this.stats.servers.clear();
      this.state.circuitBreakers.clear();
      
      return {
        success: true,
        message: '负载均衡器已停止',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[LoadBalancer] 停止负载均衡器失败:', error);
      throw error;
    }
  }
}

module.exports = LoadBalancer;