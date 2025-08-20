/**
 * 服务注册中心
 * 管理微服务的注册、发现和健康检查
 */

class ServiceRegistry {
  constructor() {
    this.services = new Map(); // 服务注册表
    this.healthChecks = new Map(); // 健康检查
    this.loadBalancer = new Map(); // 负载均衡器
    this.serviceDiscovery = new Map(); // 服务发现缓存
    
    // 配置
    this.config = {
      healthCheckInterval: 30000, // 30秒健康检查
      serviceTimeout: 5000, // 5秒服务超时
      maxRetries: 3, // 最大重试次数
      circuitBreakerThreshold: 5 // 熔断器阈值
    };

    this.startHealthCheckScheduler();
  }

  /**
   * 注册服务
   */
  registerService(serviceInfo) {
    const { name, id, host, port, version, metadata = {} } = serviceInfo;
    
    const serviceKey = `${name}:${id}`;
    const service = {
      name,
      id,
      host,
      port,
      version,
      metadata,
      status: 'healthy',
      registeredAt: new Date().toISOString(),
      lastHealthCheck: new Date().toISOString(),
      failureCount: 0,
      endpoint: `http://${host}:${port}`
    };

    this.services.set(serviceKey, service);
    
    // 初始化负载均衡器
    if (!this.loadBalancer.has(name)) {
      this.loadBalancer.set(name, {
        instances: [],
        currentIndex: 0,
        strategy: 'round_robin'
      });
    }
    
    // 添加到负载均衡器
    const lb = this.loadBalancer.get(name);
    lb.instances.push(service);

    console.log(`[ServiceRegistry] 服务注册成功: ${name}:${id} at ${service.endpoint}`);
    
    return {
      success: true,
      serviceKey,
      service
    };
  }

  /**
   * 注销服务
   */
  unregisterService(name, id) {
    const serviceKey = `${name}:${id}`;
    const service = this.services.get(serviceKey);
    
    if (service) {
      this.services.delete(serviceKey);
      
      // 从负载均衡器移除
      const lb = this.loadBalancer.get(name);
      if (lb) {
        lb.instances = lb.instances.filter(s => s.id !== id);
      }
      
      console.log(`[ServiceRegistry] 服务注销成功: ${serviceKey}`);
      return { success: true };
    }
    
    return { success: false, error: 'Service not found' };
  }

  /**
   * 服务发现
   */
  discoverService(serviceName, options = {}) {
    const { version, metadata, strategy = 'round_robin' } = options;
    
    const lb = this.loadBalancer.get(serviceName);
    if (!lb || lb.instances.length === 0) {
      throw new Error(`Service ${serviceName} not available`);
    }

    // 过滤健康的服务实例
    let availableInstances = lb.instances.filter(service => 
      service.status === 'healthy' &&
      (!version || service.version === version) &&
      (!metadata || this.matchMetadata(service.metadata, metadata))
    );

    if (availableInstances.length === 0) {
      throw new Error(`No healthy instances for service ${serviceName}`);
    }

    // 负载均衡策略
    let selectedInstance;
    switch (strategy) {
      case 'round_robin':
        selectedInstance = this.roundRobinSelect(serviceName, availableInstances);
        break;
      case 'random':
        selectedInstance = this.randomSelect(availableInstances);
        break;
      case 'least_connections':
        selectedInstance = this.leastConnectionsSelect(availableInstances);
        break;
      default:
        selectedInstance = availableInstances[0];
    }

    return selectedInstance;
  }

  /**
   * 轮询选择
   */
  roundRobinSelect(serviceName, instances) {
    const lb = this.loadBalancer.get(serviceName);
    const instance = instances[lb.currentIndex % instances.length];
    lb.currentIndex = (lb.currentIndex + 1) % instances.length;
    return instance;
  }

  /**
   * 随机选择
   */
  randomSelect(instances) {
    const randomIndex = Math.floor(Math.random() * instances.length);
    return instances[randomIndex];
  }

  /**
   * 最少连接选择
   */
  leastConnectionsSelect(instances) {
    return instances.reduce((min, current) => 
      (current.connections || 0) < (min.connections || 0) ? current : min
    );
  }

  /**
   * 健康检查
   */
  async performHealthCheck(service) {
    try {
      const response = await fetch(`${service.endpoint}/health`, {
        method: 'GET',
        timeout: this.config.serviceTimeout
      });

      if (response.ok) {
        service.status = 'healthy';
        service.failureCount = 0;
        service.lastHealthCheck = new Date().toISOString();
        return true;
      } else {
        throw new Error(`Health check failed with status: ${response.status}`);
      }
    } catch (error) {
      service.failureCount++;
      service.lastHealthCheck = new Date().toISOString();
      
      if (service.failureCount >= this.config.circuitBreakerThreshold) {
        service.status = 'unhealthy';
        console.warn(`[ServiceRegistry] 服务不健康: ${service.name}:${service.id} - ${error.message}`);
      }
      
      return false;
    }
  }

  /**
   * 启动健康检查调度器
   */
  startHealthCheckScheduler() {
    setInterval(async () => {
      const healthCheckPromises = Array.from(this.services.values()).map(service => 
        this.performHealthCheck(service)
      );
      
      await Promise.allSettled(healthCheckPromises);
    }, this.config.healthCheckInterval);
  }

  /**
   * 获取服务列表
   */
  getServices(serviceName = null) {
    if (serviceName) {
      return Array.from(this.services.values()).filter(s => s.name === serviceName);
    }
    return Array.from(this.services.values());
  }

  /**
   * 获取服务统计
   */
  getServiceStats() {
    const stats = {
      totalServices: this.services.size,
      servicesByName: {},
      healthyServices: 0,
      unhealthyServices: 0
    };

    for (const service of this.services.values()) {
      // 按名称统计
      if (!stats.servicesByName[service.name]) {
        stats.servicesByName[service.name] = {
          total: 0,
          healthy: 0,
          unhealthy: 0
        };
      }
      
      stats.servicesByName[service.name].total++;
      
      // 健康状态统计
      if (service.status === 'healthy') {
        stats.healthyServices++;
        stats.servicesByName[service.name].healthy++;
      } else {
        stats.unhealthyServices++;
        stats.servicesByName[service.name].unhealthy++;
      }
    }

    return stats;
  }

  /**
   * 匹配元数据
   */
  matchMetadata(serviceMetadata, requiredMetadata) {
    for (const [key, value] of Object.entries(requiredMetadata)) {
      if (serviceMetadata[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * 服务熔断器
   */
  isCircuitBreakerOpen(serviceName) {
    const services = this.getServices(serviceName);
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const totalCount = services.length;
    
    return totalCount > 0 && (unhealthyCount / totalCount) >= 0.5;
  }

  /**
   * 重置熔断器
   */
  resetCircuitBreaker(serviceName) {
    const services = this.getServices(serviceName);
    services.forEach(service => {
      service.failureCount = 0;
      service.status = 'healthy';
    });
  }
}

module.exports = ServiceRegistry;