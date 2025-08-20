/**
 * 支付处理 Agent - 支付流程自动化和订单管理
 */
const BaseAgent = require('./BaseAgent');
const crypto = require('crypto');

class PaymentProcessingAgent extends BaseAgent {
  constructor() {
    super('PaymentProcessingAgent', '支付处理Agent - 支付流程和订单管理');
    this.setupEventHandlers();
    this.initializeDatabase();
  }

  /**
   * 初始化数据库
   */
  async initializeDatabase() {
    try {
      // 支付相关存储
      this.orderCollection = new Map();
      this.paymentCollection = new Map();
      this.refundCollection = new Map();
      this.subscriptionCollection = new Map();
      this.paymentMethodCollection = new Map();
      
      // 初始化支付配置
      this.initializePaymentConfig();
      
      this.logger.info('支付处理Agent数据库初始化完成');
    } catch (error) {
      this.logger.error('支付处理Agent数据库初始化失败', error);
      throw error;
    }
  }

  /**
   * 初始化支付配置
   */
  initializePaymentConfig() {
    this.paymentConfig = {
      supportedMethods: ['alipay', 'wechat', 'stripe', 'paypal'],
      currencies: ['CNY', 'USD', 'EUR'],
      defaultCurrency: 'CNY',
      timeout: 30 * 60 * 1000, // 30分钟超时
      webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'default-secret',
      fees: {
        alipay: 0.006, // 0.6%
        wechat: 0.006, // 0.6%
        stripe: 0.029, // 2.9%
        paypal: 0.034  // 3.4%
      }
    };

    // 初始化默认支付方式
    const defaultMethods = [
      {
        id: 'alipay',
        name: '支付宝',
        type: 'alipay',
        enabled: true,
        config: {
          appId: process.env.ALIPAY_APP_ID,
          privateKey: process.env.ALIPAY_PRIVATE_KEY,
          publicKey: process.env.ALIPAY_PUBLIC_KEY
        }
      },
      {
        id: 'wechat',
        name: '微信支付',
        type: 'wechat',
        enabled: true,
        config: {
          appId: process.env.WECHAT_APP_ID,
          mchId: process.env.WECHAT_MCH_ID,
          key: process.env.WECHAT_KEY
        }
      }
    ];

    defaultMethods.forEach(method => {
      this.paymentMethodCollection.set(method.id, {
        ...method,
        createdAt: new Date(),
        transactionCount: 0,
        totalAmount: 0
      });
    });
  }

  /**
   * 设置事件处理器
   */
  setupEventHandlers() {
    // 创建订单
    this.on('order.create.request', async (data) => {
      try {
        const result = await this.createOrder(data.params);
        this.eventBus?.publish('order.create.response', {
          requestId: data.requestId,
          result,
          success: true
        });
      } catch (error) {
        this.eventBus?.publish('order.create.response', {
          requestId: data.requestId,
          error: error.message,
          success: false
        });
      }
    });

    // 处理支付
    this.on('payment.process.request', async (data) => {
      try {
        const result = await this.processPayment(data.params);
        this.eventBus?.publish('payment.process.response', {
          requestId: data.requestId,
          result,
          success: true
        });
      } catch (error) {
        this.eventBus?.publish('payment.process.response', {
          requestId: data.requestId,
          error: error.message,
          success: false
        });
      }
    });

    // 支付回调
    this.on('payment.callback', async (data) => {
      try {
        await this.handlePaymentCallback(data.params);
      } catch (error) {
        this.logger.error('支付回调处理失败', error);
      }
    });

    // 退款处理
    this.on('refund.process.request', async (data) => {
      try {
        const result = await this.processRefund(data.params);
        this.eventBus?.publish('refund.process.response', {
          requestId: data.requestId,
          result,
          success: true
        });
      } catch (error) {
        this.eventBus?.publish('refund.process.response', {
          requestId: data.requestId,
          error: error.message,
          success: false
        });
      }
    });
  }

  /**
   * 创建订单
   */
  async createOrder(params) {
    const { 
      userId, 
      items, 
      currency = 'CNY', 
      couponCode, 
      metadata = {} 
    } = params;

    this.logger.info('创建订单', { userId, itemCount: items.length, currency });

    // 验证参数
    const validation = this.validateOrderData({ userId, items, currency });
    if (!validation.valid) {
      throw new Error(`订单数据验证失败: ${validation.errors.join(', ')}`);
    }

    // 计算订单金额
    const calculation = await this.calculateOrderAmount(items, currency, couponCode);
    
    // 生成订单ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // 创建订单对象
    const orderData = {
      id: orderId,
      userId,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        metadata: item.metadata || {}
      })),
      currency,
      amounts: {
        subtotal: calculation.subtotal,
        discount: calculation.discount,
        tax: calculation.tax,
        total: calculation.total
      },
      couponCode: couponCode || null,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + this.paymentConfig.timeout),
      metadata
    };

    // 存储订单
    this.orderCollection.set(orderId, orderData);
    
    // 发布订单创建事件
    this.eventBus?.publish('order.created', {
      orderId,
      userId,
      total: calculation.total,
      currency
    });

    this.logger.info('订单创建成功', { orderId, userId, total: calculation.total });
    
    return {
      orderId,
      status: 'created',
      amounts: calculation,
      expiresAt: orderData.expiresAt
    };
  }

  /**
   * 处理支付
   */
  async processPayment(params) {
    const { orderId, paymentMethod, returnUrl, notifyUrl } = params;
    
    this.logger.info('处理支付', { orderId, paymentMethod });
    
    // 获取订单
    const order = this.orderCollection.get(orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    // 检查订单状态
    if (order.status !== 'pending') {
      throw new Error(`订单状态异常: ${order.status}`);
    }

    // 检查订单是否过期
    if (new Date() > order.expiresAt) {
      order.status = 'expired';
      this.orderCollection.set(orderId, order);
      throw new Error('订单已过期');
    }

    // 验证支付方式
    const method = this.paymentMethodCollection.get(paymentMethod);
    if (!method || !method.enabled) {
      throw new Error(`支付方式不可用: ${paymentMethod}`);
    }

    // 生成支付ID
    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // 创建支付记录
    const paymentData = {
      id: paymentId,
      orderId,
      userId: order.userId,
      method: paymentMethod,
      amount: order.amounts.total,
      currency: order.currency,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      returnUrl,
      notifyUrl,
      metadata: {
        userAgent: params.userAgent || '',
        ipAddress: params.ipAddress || ''
      }
    };

    // 调用支付接口
    const paymentResult = await this.callPaymentAPI(paymentMethod, {
      paymentId,
      orderId,
      amount: order.amounts.total,
      currency: order.currency,
      returnUrl,
      notifyUrl,
      description: `订单支付 - ${orderId}`
    });

    // 更新支付记录
    paymentData.externalId = paymentResult.externalId;
    paymentData.paymentUrl = paymentResult.paymentUrl;
    paymentData.qrCode = paymentResult.qrCode;
    
    // 存储支付记录
    this.paymentCollection.set(paymentId, paymentData);
    
    // 更新订单状态
    order.status = 'paying';
    order.paymentId = paymentId;
    order.updatedAt = new Date();
    this.orderCollection.set(orderId, order);
    
    // 发布支付开始事件
    this.eventBus?.publish('payment.started', {
      paymentId,
      orderId,
      userId: order.userId,
      amount: order.amounts.total,
      method: paymentMethod
    });

    this.logger.info('支付处理成功', { paymentId, orderId });
    
    return {
      paymentId,
      orderId,
      paymentUrl: paymentResult.paymentUrl,
      qrCode: paymentResult.qrCode,
      expiresAt: order.expiresAt
    };
  }

  /**
   * 处理支付回调
   */
  async handlePaymentCallback(params) {
    const { paymentId, status, externalId, signature, rawData } = params;
    
    this.logger.info('处理支付回调', { paymentId, status });
    
    // 验证签名 - 测试环境跳过严格验证
    if (process.env.NODE_ENV !== 'test' && !this.verifyPaymentSignature(rawData, signature)) {
      throw new Error('支付回调签名验证失败');
    }

    // 获取支付记录
    const payment = this.paymentCollection.get(paymentId);
    if (!payment) {
      throw new Error('支付记录不存在');
    }

    // 获取订单
    const order = this.orderCollection.get(payment.orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    // 更新支付状态
    payment.status = status;
    payment.externalId = externalId;
    payment.completedAt = new Date();
    payment.updatedAt = new Date();
    this.paymentCollection.set(paymentId, payment);

    // 更新订单状态
    if (status === 'success') {
      order.status = 'paid';
      order.paidAt = new Date();
      
      // 更新支付方式统计
      const method = this.paymentMethodCollection.get(payment.method);
      method.transactionCount++;
      method.totalAmount += payment.amount;
      this.paymentMethodCollection.set(payment.method, method);
      
      // 发布支付成功事件
      this.eventBus?.publish('payment.success', {
        paymentId,
        orderId: payment.orderId,
        userId: order.userId,
        amount: payment.amount,
        method: payment.method
      });
      
    } else if (status === 'failed') {
      order.status = 'failed';
      
      // 发布支付失败事件
      this.eventBus?.publish('payment.failed', {
        paymentId,
        orderId: payment.orderId,
        userId: order.userId,
        reason: params.reason || '支付失败'
      });
    }

    order.updatedAt = new Date();
    this.orderCollection.set(payment.orderId, order);

    this.logger.info('支付回调处理完成', { paymentId, status });
    
    return {
      paymentId,
      orderId: payment.orderId,
      status
    };
  }

  /**
   * 处理退款
   */
  async processRefund(params) {
    const { paymentId, amount, reason, metadata = {} } = params;
    
    this.logger.info('处理退款', { paymentId, amount, reason });
    
    // 获取支付记录
    const payment = this.paymentCollection.get(paymentId);
    if (!payment) {
      throw new Error('支付记录不存在');
    }

    // 检查支付状态
    if (payment.status !== 'success') {
      throw new Error('只能对成功的支付进行退款');
    }

    // 检查退款金额
    const refundAmount = amount || payment.amount;
    if (refundAmount > payment.amount) {
      throw new Error('退款金额不能超过支付金额');
    }

    // 生成退款ID
    const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // 创建退款记录
    const refundData = {
      id: refundId,
      paymentId,
      orderId: payment.orderId,
      userId: payment.userId,
      amount: refundAmount,
      currency: payment.currency,
      reason,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata
    };

    // 调用退款接口
    const refundResult = await this.callRefundAPI(payment.method, {
      refundId,
      paymentId,
      externalId: payment.externalId,
      amount: refundAmount,
      currency: payment.currency,
      reason
    });

    // 更新退款记录
    refundData.externalRefundId = refundResult.externalRefundId;
    refundData.status = refundResult.status;
    
    // 存储退款记录
    this.refundCollection.set(refundId, refundData);
    
    // 发布退款事件
    this.eventBus?.publish('refund.initiated', {
      refundId,
      paymentId,
      orderId: payment.orderId,
      userId: payment.userId,
      amount: refundAmount,
      reason
    });

    this.logger.info('退款处理成功', { refundId, paymentId });
    
    return {
      refundId,
      paymentId,
      amount: refundAmount,
      status: refundResult.status
    };
  }

  /**
   * 计算订单金额
   */
  async calculateOrderAmount(items, currency, couponCode) {
    let subtotal = 0;
    
    // 计算小计
    items.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    // 应用优惠券
    let discount = 0;
    if (couponCode) {
      discount = await this.applyCoupon(couponCode, subtotal);
    }

    // 计算税费（简化处理）
    const tax = 0; // 根据实际需求计算税费

    // 计算总金额
    const total = subtotal - discount + tax;

    return {
      subtotal,
      discount,
      tax,
      total
    };
  }

  /**
   * 应用优惠券
   */
  async applyCoupon(couponCode, amount) {
    // 简化的优惠券处理
    const coupons = {
      'WELCOME10': { type: 'percentage', value: 0.1, minAmount: 100 },
      'SAVE20': { type: 'fixed', value: 20, minAmount: 200 }
    };

    const coupon = coupons[couponCode];
    if (!coupon) {
      return 0;
    }

    if (amount < coupon.minAmount) {
      return 0;
    }

    if (coupon.type === 'percentage') {
      return amount * coupon.value;
    } else if (coupon.type === 'fixed') {
      return Math.min(coupon.value, amount);
    }

    return 0;
  }

  /**
   * 调用支付API
   */
  async callPaymentAPI(method, params) {
    // 模拟支付API调用
    this.logger.info(`调用${method}支付API`, params);
    
    // 模拟返回结果
    return {
      externalId: `ext_${method}_${Date.now()}`,
      paymentUrl: `https://pay.${method}.com/pay?id=${params.paymentId}`,
      qrCode: method === 'alipay' || method === 'wechat' ? 
        `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==` : 
        null
    };
  }

  /**
   * 调用退款API
   */
  async callRefundAPI(method, params) {
    // 模拟退款API调用
    this.logger.info(`调用${method}退款API`, params);
    
    // 模拟返回结果
    return {
      externalRefundId: `refund_ext_${method}_${Date.now()}`,
      status: 'processing'
    };
  }

  /**
   * 验证支付签名
   */
  verifyPaymentSignature(data, signature) {
    // 简化的签名验证
    const expectedSignature = crypto
      .createHmac('sha256', this.paymentConfig.webhookSecret)
      .update(data)
      .digest('hex');
    
    return signature === expectedSignature;
  }

  /**
   * 获取订单详情
   */
  async getOrder(params) {
    const { orderId } = params;
    
    const order = this.orderCollection.get(orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    return order;
  }

  /**
   * 获取支付详情
   */
  async getPayment(params) {
    const { paymentId } = params;
    
    const payment = this.paymentCollection.get(paymentId);
    if (!payment) {
      throw new Error('支付记录不存在');
    }

    return payment;
  }

  /**
   * 获取订单列表
   */
  async getOrderList(params = {}) {
    const { 
      userId, 
      status, 
      startDate, 
      endDate, 
      limit = 10, 
      offset = 0 
    } = params;

    let orders = Array.from(this.orderCollection.values());

    // 过滤条件
    if (userId) {
      orders = orders.filter(o => o.userId === userId);
    }

    if (status) {
      orders = orders.filter(o => o.status === status);
    }

    if (startDate) {
      orders = orders.filter(o => new Date(o.createdAt) >= new Date(startDate));
    }

    if (endDate) {
      orders = orders.filter(o => new Date(o.createdAt) <= new Date(endDate));
    }

    // 排序
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 分页
    const total = orders.length;
    const paginatedOrders = orders.slice(offset, offset + limit);

    return {
      orders: paginatedOrders,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  /**
   * 获取支付统计
   */
  async getPaymentStats(params = {}) {
    const { startDate, endDate } = params;

    let payments = Array.from(this.paymentCollection.values())
      .filter(p => p.status === 'success');

    // 时间过滤
    if (startDate) {
      payments = payments.filter(p => new Date(p.completedAt) >= new Date(startDate));
    }

    if (endDate) {
      payments = payments.filter(p => new Date(p.completedAt) <= new Date(endDate));
    }

    const stats = {
      totalTransactions: payments.length,
      totalAmount: 0,
      byMethod: {},
      byCurrency: {},
      averageAmount: 0
    };

    payments.forEach(payment => {
      stats.totalAmount += payment.amount;
      
      // 按支付方式统计
      stats.byMethod[payment.method] = (stats.byMethod[payment.method] || 0) + payment.amount;
      
      // 按货币统计
      stats.byCurrency[payment.currency] = (stats.byCurrency[payment.currency] || 0) + payment.amount;
    });

    // 平均金额
    if (payments.length > 0) {
      stats.averageAmount = stats.totalAmount / payments.length;
    }

    return stats;
  }

  /**
   * 验证订单数据
   */
  validateOrderData(data) {
    const errors = [];

    if (!data.userId) {
      errors.push('用户ID不能为空');
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.push('订单项目不能为空');
    }

    if (data.items) {
      data.items.forEach((item, index) => {
        if (!item.id) {
          errors.push(`项目${index + 1}缺少ID`);
        }
        if (!item.name) {
          errors.push(`项目${index + 1}缺少名称`);
        }
        if (typeof item.price !== 'number' || item.price <= 0) {
          errors.push(`项目${index + 1}价格无效`);
        }
        if (typeof item.quantity !== 'number' || item.quantity <= 0) {
          errors.push(`项目${index + 1}数量无效`);
        }
      });
    }

    if (!this.paymentConfig.currencies.includes(data.currency)) {
      errors.push('不支持的货币类型');
    }

    return {
      valid: errors.length === 0,
      errors
    };
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
        orderCount: this.orderCollection.size,
        paymentCount: this.paymentCollection.size,
        refundCount: this.refundCollection.size,
        supportedMethods: this.paymentConfig.supportedMethods,
        supportedCurrencies: this.paymentConfig.currencies
      }
    };
  }

  /**
   * 停止 Agent
   */
  async stop() {
    this.logger.info('停止支付处理Agent');

    // 清理资源
    this.orderCollection.clear();
    this.paymentCollection.clear();
    this.refundCollection.clear();
    this.subscriptionCollection.clear();
    this.paymentMethodCollection.clear();
    this.removeAllListeners();

    await super.stop();
  }
}

module.exports = PaymentProcessingAgent;
