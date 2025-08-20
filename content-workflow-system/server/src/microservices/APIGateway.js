/**
 * API网关
 * 统一入口、路由转发、认证授权、限流熔断
 */

const ServiceRegistry = require('./ServiceRegistry');

class APIGateway {
  constructor() {
    this.serviceRegistry = new ServiceRegistry();
    this.routes = new Map(); // 路由配置
    this.middleware = []; // 中间件
    this.rateLimiter = new Map(); // 限流器
    this.circuitBreakers = new Map(); // 熔断器
    
    // 配置
    this.config = {
      timeout: 30000, // 30秒超时
      retries: 3, // 重试次数
      rateLimitWindow: 60000, // 1分钟限流窗口
      rateLimitMax: 1000, // 每分钟最大请求数
      circuitBreakerThreshold: 10, // 熔断器阈值
      circuitBreakerTimeout: 60000 // 熔断器超时时间
    };

    this.initializeRoutes();
    this.initializeMiddleware();
  }

  /**
   * 初始化路由配置
   */
  initializeRoutes() {
    // 内容管理服务路由
    this.addRoute('/api/content/*', {
      service: 'content-service',
      stripPrefix: '/api/content',
      timeout: 10000,
      retries: 2
    });

    // 用户管理服务路由
    this.addRoute('/api/users/*', {
      service: 'user-service',
      stripPrefix: '/api/users',
      timeout: 5000,
      retries: 3
    });

    // 支付服务路由
    this.addRoute('/api/payment/*', {
      service: 'payment-service',
      stripPrefix: '/api/payment',
      timeout: 15000,
      retries: 1
    });

    // 推荐服务路由
    this.addRoute('/api/recommendations/*', {
      service: 'recommendation-service',
      stripPrefix: '/api/recommendations',
      timeout: 5000,
      retries: 2
    });

    // 分析服务路由
    this.addRoute('/api/analytics/*', {
      service: 'analytics-service',
      stripPrefix: '/api/analytics',
      timeout: 20000,
      retries: 1
    });

    // 营销服务路由
    this.addRoute('/api/marketing/*', {
      service: 'marketing-service',
      stripPrefix: '/api/marketing',
      timeout: 10000,
      retries: 2
    });
  }

  /**
   * 初始化中间件
   */
  initializeMiddleware() {
    // 请求日志中间件
    this.use(this.requestLogger);
    
    // 限流中间件
    this.use(this.rateLimitMiddleware);
    
    // 认证中间件
    this.use(this.authenticationMiddleware);
    
    // 熔断器中间件
    this.use(this.circuitBreakerMiddleware);
    
    // CORS中间件
    this.use(this.corsMiddleware);
  }

  /**
   * 添加路由
   */
  addRoute(pattern, config) {
    this.routes.set(pattern, {
      ...config,
      pattern: this.patternToRegex(pattern)
    });
  }

  /**
   * 添加中间件
   */
  use(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * 处理请求
   */
  async handleRequest(req, res) {
    try {
      // 执行中间件链
      for (const middleware of this.middleware) {
        const result = await middleware(req, res);
        if (result === false) {
          return; // 中间件终止请求
        }
      }

      // 路由匹配
      const route = this.matchRoute(req.url);
      if (!route) {
        return this.sendError(res, 404, 'Route not found');
      }

      // 服务发现
      const service = this.serviceRegistry.discoverService(route.service);
      if (!service) {
        return this.sendError(res, 503, 'Service unavailable');
      }

      // 转发请求
      const response = await this.forwardRequest(req, service, route);
      
      // 返回响应
      this.sendResponse(res, response);

    } catch (error) {
      console.error('[APIGateway] 请求处理失败:', error);
      this.sendError(res, 500, 'Internal server error');
    }
  }

  /**
   * 匹配路由
   */
  matchRoute(url) {
    for (const [pattern, config] of this.routes) {
      if (config.pattern.test(url)) {
        return config;
      }
    }
    return null;
  }

  /**
   * 转发请求
   */
  async forwardRequest(req, service, route) {
    const targetUrl = this.buildTargetUrl(req.url, service, route);
    
    const requestOptions = {
      method: req.method,
      headers: this.buildHeaders(req.headers),
      timeout: route.timeout || this.config.timeout
    };

    // 添加请求体
    if (req.body) {
      requestOptions.body = JSON.stringify(req.body);
      requestOptions.headers['Content-Type'] = 'application/json';
    }

    let lastError;
    const maxRetries = route.retries || this.config.retries;

    // 重试机制
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(targetUrl, requestOptions);
        
        if (response.ok) {
          return {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: await response.text()
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        lastError = error;
        console.warn(`[APIGateway] 请求失败 (尝试 ${attempt + 1}/${maxRetries + 1}):`, error.message);
        
        if (attempt < maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000); // 指数退避
        }
      }
    }

    throw lastError;
  }

  /**
   * 构建目标URL
   */
  buildTargetUrl(originalUrl, service, route) {
    let path = originalUrl;
    
    // 移除前缀
    if (route.stripPrefix) {
      path = path.replace(route.stripPrefix, '');
    }
    
    // 确保路径以/开头
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    return `${service.endpoint}${path}`;
  }

  /**
   * 构建请求头
   */
  buildHeaders(originalHeaders) {
    const headers = { ...originalHeaders };
    
    // 移除hop-by-hop头
    delete headers.connection;
    delete headers['keep-alive'];
    delete headers['proxy-authenticate'];
    delete headers['proxy-authorization'];
    delete headers.te;
    delete headers.trailers;
    delete headers.upgrade;
    
    // 添加网关标识
    headers['X-Gateway'] = 'content-workflow-gateway';
    headers['X-Forwarded-By'] = 'api-gateway';
    
    return headers;
  }

  /**
   * 请求日志中间件
   */
  async requestLogger(req, res) {
    const startTime = Date.now();
    console.log(`[APIGateway] ${req.method} ${req.url} - ${req.ip || 'unknown'}`);
    
    // 记录响应时间
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(`[APIGateway] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    });
    
    return true;
  }

  /**
   * 限流中间件
   */
  async rateLimitMiddleware(req, res) {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindow;
    
    if (!this.rateLimiter.has(clientId)) {
      this.rateLimiter.set(clientId, []);
    }
    
    const requests = this.rateLimiter.get(clientId);
    
    // 清理过期请求
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= this.config.rateLimitMax) {
      this.sendError(res, 429, 'Too many requests');
      return false;
    }
    
    // 记录当前请求
    validRequests.push(now);
    this.rateLimiter.set(clientId, validRequests);
    
    return true;
  }

  /**
   * 认证中间件
   */
  async authenticationMiddleware(req, res) {
    // 跳过健康检查和公开端点
    if (req.url === '/health' || req.url.startsWith('/public/')) {
      return true;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.sendError(res, 401, 'Authentication required');
      return false;
    }

    const token = authHeader.substring(7);
    
    try {
      // 这里应该验证JWT token
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // req.user = decoded;
      
      // 简化实现
      if (token === 'invalid') {
        throw new Error('Invalid token');
      }
      
      return true;
    } catch (error) {
      this.sendError(res, 401, 'Invalid token');
      return false;
    }
  }

  /**
   * 熔断器中间件
   */
  async circuitBreakerMiddleware(req, res) {
    const route = this.matchRoute(req.url);
    if (!route) {
      return true;
    }

    const serviceName = route.service;
    
    if (this.serviceRegistry.isCircuitBreakerOpen(serviceName)) {
      this.sendError(res, 503, 'Service circuit breaker is open');
      return false;
    }
    
    return true;
  }

  /**
   * CORS中间件
   */
  async corsMiddleware(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return false;
    }
    
    return true;
  }

  /**
   * 发送响应
   */
  sendResponse(res, response) {
    res.statusCode = response.status;
    
    // 设置响应头
    for (const [key, value] of Object.entries(response.headers)) {
      res.setHeader(key, value);
    }
    
    res.end(response.body);
  }

  /**
   * 发送错误响应
   */
  sendError(res, statusCode, message) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: {
        code: statusCode,
        message: message,
        timestamp: new Date().toISOString()
      }
    }));
  }

  /**
   * 模式转正则表达式
   */
  patternToRegex(pattern) {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = escaped.replace(/\\\*/g, '.*');
    return new RegExp(`^${regex}$`);
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取网关统计
   */
  getGatewayStats() {
    return {
      routes: this.routes.size,
      middleware: this.middleware.length,
      rateLimitClients: this.rateLimiter.size,
      circuitBreakers: this.circuitBreakers.size,
      serviceRegistry: this.serviceRegistry.getServiceStats()
    };
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      gateway: this.getGatewayStats(),
      services: this.serviceRegistry.getServiceStats()
    };
  }
}

module.exports = APIGateway;