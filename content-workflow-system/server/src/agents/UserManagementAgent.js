/**
 * 用户管理 Agent - 用户认证、权限管理和行为追踪
 */
const BaseAgent = require('./BaseAgent');
const crypto = require('crypto');

class UserManagementAgent extends BaseAgent {
  constructor() {
    super('UserManagementAgent', '用户管理Agent - 认证权限和行为追踪');
    this.setupEventHandlers();
    this.initializeDatabase();
  }

  /**
   * 初始化数据库
   */
  async initializeDatabase() {
    try {
      // 用户存储
      this.userCollection = new Map();
      this.sessionCollection = new Map();
      this.roleCollection = new Map();
      this.permissionCollection = new Map();
      this.userBehaviorCollection = new Map();
      
      // 初始化默认角色和权限
      this.initializeDefaultRoles();
      this.initializeDefaultPermissions();
      
      this.logger.info('用户管理Agent数据库初始化完成');
    } catch (error) {
      this.logger.error('用户管理Agent数据库初始化失败', error);
      throw error;
    }
  }

  /**
   * 初始化默认角色
   */
  initializeDefaultRoles() {
    const defaultRoles = [
      {
        id: 'admin',
        name: '管理员',
        description: '系统管理员，拥有所有权限',
        permissions: ['*']
      },
      {
        id: 'editor',
        name: '编辑者',
        description: '内容编辑者，可以创建和编辑内容',
        permissions: ['content.create', 'content.update', 'content.read']
      },
      {
        id: 'viewer',
        name: '查看者',
        description: '只能查看内容',
        permissions: ['content.read']
      },
      {
        id: 'user',
        name: '普通用户',
        description: '普通用户，基础权限',
        permissions: ['profile.read', 'profile.update']
      }
    ];

    defaultRoles.forEach(role => {
      this.roleCollection.set(role.id, {
        ...role,
        createdAt: new Date(),
        userCount: 0
      });
    });
  }

  /**
   * 初始化默认权限
   */
  initializeDefaultPermissions() {
    const defaultPermissions = [
      { id: 'content.create', name: '创建内容', category: 'content' },
      { id: 'content.read', name: '查看内容', category: 'content' },
      { id: 'content.update', name: '更新内容', category: 'content' },
      { id: 'content.delete', name: '删除内容', category: 'content' },
      { id: 'user.create', name: '创建用户', category: 'user' },
      { id: 'user.read', name: '查看用户', category: 'user' },
      { id: 'user.update', name: '更新用户', category: 'user' },
      { id: 'user.delete', name: '删除用户', category: 'user' },
      { id: 'profile.read', name: '查看个人资料', category: 'profile' },
      { id: 'profile.update', name: '更新个人资料', category: 'profile' },
      { id: 'system.admin', name: '系统管理', category: 'system' }
    ];

    defaultPermissions.forEach(permission => {
      this.permissionCollection.set(permission.id, {
        ...permission,
        createdAt: new Date()
      });
    });
  }

  /**
   * 设置事件处理器
   */
  setupEventHandlers() {
    // 用户注册
    this.on('user.register.request', async (data) => {
      try {
        const result = await this.registerUser(data.params);
        this.eventBus?.publish('user.register.response', {
          requestId: data.requestId,
          result,
          success: true
        });
      } catch (error) {
        this.eventBus?.publish('user.register.response', {
          requestId: data.requestId,
          error: error.message,
          success: false
        });
      }
    });

    // 用户登录
    this.on('user.login.request', async (data) => {
      try {
        const result = await this.loginUser(data.params);
        this.eventBus?.publish('user.login.response', {
          requestId: data.requestId,
          result,
          success: true
        });
      } catch (error) {
        this.eventBus?.publish('user.login.response', {
          requestId: data.requestId,
          error: error.message,
          success: false
        });
      }
    });

    // 权限检查
    this.on('user.permission.check', async (data) => {
      try {
        const result = await this.checkPermission(data.params);
        this.eventBus?.publish('user.permission.result', {
          requestId: data.requestId,
          result,
          success: true
        });
      } catch (error) {
        this.eventBus?.publish('user.permission.result', {
          requestId: data.requestId,
          error: error.message,
          success: false
        });
      }
    });

    // 用户行为记录
    this.on('user.behavior.track', async (data) => {
      try {
        await this.trackUserBehavior(data.params);
      } catch (error) {
        this.logger.error('用户行为记录失败', error);
      }
    });
  }

  /**
   * 用户注册
   */
  async registerUser(params) {
    const { username, email, password, profile = {}, role = 'user' } = params;
    
    this.logger.info('用户注册', { username, email, role });
    
    // 验证参数
    const validation = this.validateUserData({ username, email, password });
    if (!validation.valid) {
      throw new Error(`用户数据验证失败: ${validation.errors.join(', ')}`);
    }

    // 检查用户是否已存在
    const existingUser = this.findUserByUsernameOrEmail(username, email);
    if (existingUser) {
      throw new Error('用户名或邮箱已存在');
    }

    // 检查角色是否存在
    if (!this.roleCollection.has(role)) {
      throw new Error(`角色不存在: ${role}`);
    }

    // 生成用户ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // 加密密码
    const hashedPassword = this.hashPassword(password);
    
    // 创建用户对象
    const userData = {
      id: userId,
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role,
      profile: {
        displayName: profile.displayName || username,
        avatar: profile.avatar || '',
        bio: profile.bio || '',
        ...profile
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
      loginCount: 0,
      settings: {
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        notifications: {
          email: true,
          push: true
        }
      }
    };

    // 存储用户
    this.userCollection.set(userId, userData);
    
    // 更新角色用户计数
    const roleData = this.roleCollection.get(role);
    roleData.userCount++;
    this.roleCollection.set(role, roleData);
    
    // 发布用户注册事件
    this.eventBus?.publish('user.registered', {
      userId,
      username,
      email,
      role
    });

    this.logger.info('用户注册成功', { userId, username });
    
    return {
      userId,
      username,
      email,
      role,
      status: 'registered'
    };
  }

  /**
   * 用户登录
   */
  async loginUser(params) {
    const { username, password, rememberMe = false } = params;
    
    this.logger.info('用户登录', { username });
    
    // 查找用户
    const user = this.findUserByUsernameOrEmail(username, username);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查用户状态
    if (user.status !== 'active') {
      throw new Error(`用户状态异常: ${user.status}`);
    }

    // 验证密码
    if (!this.verifyPassword(password, user.password)) {
      throw new Error('密码错误');
    }

    // 创建会话
    const sessionId = this.generateSessionId();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (rememberMe ? 24 * 7 : 24)); // 7天或1天

    const sessionData = {
      id: sessionId,
      userId: user.id,
      createdAt: new Date(),
      expiresAt,
      lastAccessAt: new Date(),
      userAgent: params.userAgent || '',
      ipAddress: params.ipAddress || ''
    };

    // 存储会话
    this.sessionCollection.set(sessionId, sessionData);

    // 更新用户登录信息
    user.lastLoginAt = new Date();
    user.loginCount++;
    user.updatedAt = new Date();
    this.userCollection.set(user.id, user);

    // 记录用户行为
    await this.trackUserBehavior({
      userId: user.id,
      action: 'login',
      details: { sessionId, rememberMe }
    });

    // 发布用户登录事件
    this.eventBus?.publish('user.logged_in', {
      userId: user.id,
      username: user.username,
      sessionId
    });

    this.logger.info('用户登录成功', { userId: user.id, username: user.username });

    return {
      userId: user.id,
      username: user.username,
      sessionId,
      expiresAt,
      profile: user.profile,
      role: user.role,
      permissions: await this.getUserPermissions(user.id)
    };
  }

  /**
   * 用户登出
   */
  async logoutUser(params) {
    const { sessionId } = params;

    const session = this.sessionCollection.get(sessionId);
    if (!session) {
      throw new Error('会话不存在');
    }

    // 删除会话
    this.sessionCollection.delete(sessionId);

    // 记录用户行为
    await this.trackUserBehavior({
      userId: session.userId,
      action: 'logout',
      details: { sessionId }
    });

    // 发布用户登出事件
    this.eventBus?.publish('user.logged_out', {
      userId: session.userId,
      sessionId
    });

    this.logger.info('用户登出成功', { userId: session.userId, sessionId });

    return {
      status: 'logged_out',
      sessionId
    };
  }

  /**
   * 验证会话
   */
  async validateSession(params) {
    const { sessionId } = params;

    const session = this.sessionCollection.get(sessionId);
    if (!session) {
      throw new Error('会话不存在');
    }

    // 检查会话是否过期
    if (new Date() > session.expiresAt) {
      this.sessionCollection.delete(sessionId);
      throw new Error('会话已过期');
    }

    // 更新最后访问时间
    session.lastAccessAt = new Date();
    this.sessionCollection.set(sessionId, session);

    // 获取用户信息
    const user = this.userCollection.get(session.userId);
    if (!user || user.status !== 'active') {
      this.sessionCollection.delete(sessionId);
      throw new Error('用户状态异常');
    }

    return {
      valid: true,
      userId: user.id,
      username: user.username,
      role: user.role,
      permissions: await this.getUserPermissions(user.id)
    };
  }

  /**
   * 检查权限
   */
  async checkPermission(params) {
    const { userId, permission } = params;

    const user = this.userCollection.get(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const userPermissions = await this.getUserPermissions(userId);
    
    // 检查是否有超级权限
    if (userPermissions.includes('*')) {
      return { hasPermission: true, permission };
    }

    // 检查具体权限
    const hasPermission = userPermissions.includes(permission);

    return { hasPermission, permission };
  }

  /**
   * 获取用户权限
   */
  async getUserPermissions(userId) {
    const user = this.userCollection.get(userId);
    if (!user) {
      return [];
    }

    const role = this.roleCollection.get(user.role);
    if (!role) {
      return [];
    }

    return role.permissions;
  }

  /**
   * 更新用户资料
   */
  async updateUserProfile(params) {
    const { userId, updates } = params;

    const user = this.userCollection.get(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证更新数据
    if (updates.email) {
      const existingUser = this.findUserByUsernameOrEmail('', updates.email);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('邮箱已被使用');
      }
    }

    // 更新用户信息
    const updatedUser = {
      ...user,
      ...updates,
      profile: {
        ...user.profile,
        ...updates.profile
      },
      updatedAt: new Date()
    };

    this.userCollection.set(userId, updatedUser);

    // 记录用户行为
    await this.trackUserBehavior({
      userId,
      action: 'profile_update',
      details: { updatedFields: Object.keys(updates) }
    });

    // 发布用户更新事件
    this.eventBus?.publish('user.profile_updated', {
      userId,
      updates: Object.keys(updates)
    });

    this.logger.info('用户资料更新成功', { userId });

    return {
      userId,
      status: 'updated',
      updatedFields: Object.keys(updates)
    };
  }

  /**
   * 修改密码
   */
  async changePassword(params) {
    const { userId, oldPassword, newPassword } = params;

    const user = this.userCollection.get(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证旧密码
    if (!this.verifyPassword(oldPassword, user.password)) {
      throw new Error('原密码错误');
    }

    // 验证新密码
    if (newPassword.length < 6) {
      throw new Error('新密码至少需要6个字符');
    }

    // 更新密码
    user.password = this.hashPassword(newPassword);
    user.updatedAt = new Date();
    this.userCollection.set(userId, user);

    // 记录用户行为
    await this.trackUserBehavior({
      userId,
      action: 'password_change',
      details: {}
    });

    // 发布密码修改事件
    this.eventBus?.publish('user.password_changed', { userId });

    this.logger.info('用户密码修改成功', { userId });

    return {
      userId,
      status: 'password_changed'
    };
  }

  /**
   * 追踪用户行为
   */
  async trackUserBehavior(params) {
    const { userId, action, details = {}, timestamp = new Date() } = params;

    const behaviorId = `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const behaviorData = {
      id: behaviorId,
      userId,
      action,
      details,
      timestamp,
      userAgent: details.userAgent || '',
      ipAddress: details.ipAddress || ''
    };

    // 存储行为数据
    if (!this.userBehaviorCollection.has(userId)) {
      this.userBehaviorCollection.set(userId, []);
    }

    const userBehaviors = this.userBehaviorCollection.get(userId);
    userBehaviors.push(behaviorData);

    // 限制行为记录数量（保留最近1000条）
    if (userBehaviors.length > 1000) {
      userBehaviors.splice(0, userBehaviors.length - 1000);
    }

    this.userBehaviorCollection.set(userId, userBehaviors);

    // 发布行为追踪事件
    this.eventBus?.publish('user.behavior_tracked', {
      userId,
      action,
      behaviorId
    });
  }

  /**
   * 获取用户行为分析
   */
  async getUserBehaviorAnalysis(params) {
    const { userId, startDate, endDate, limit = 100 } = params;

    const userBehaviors = this.userBehaviorCollection.get(userId) || [];
    
    let filteredBehaviors = userBehaviors;

    // 时间过滤
    if (startDate) {
      filteredBehaviors = filteredBehaviors.filter(b => 
        new Date(b.timestamp) >= new Date(startDate)
      );
    }

    if (endDate) {
      filteredBehaviors = filteredBehaviors.filter(b => 
        new Date(b.timestamp) <= new Date(endDate)
      );
    }

    // 排序和限制
    filteredBehaviors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    filteredBehaviors = filteredBehaviors.slice(0, limit);

    // 统计分析
    const actionStats = {};
    filteredBehaviors.forEach(behavior => {
      actionStats[behavior.action] = (actionStats[behavior.action] || 0) + 1;
    });

    return {
      behaviors: filteredBehaviors,
      statistics: {
        totalActions: filteredBehaviors.length,
        actionBreakdown: actionStats,
        timeRange: {
          start: startDate,
          end: endDate
        }
      }
    };
  }

  /**
   * 获取用户列表
   */
  async getUserList(params = {}) {
    const { role, status, limit = 10, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    let users = Array.from(this.userCollection.values());

    // 过滤条件
    if (role) {
      users = users.filter(u => u.role === role);
    }

    if (status) {
      users = users.filter(u => u.status === status);
    }

    // 排序
    users.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'desc') {
        return new Date(bValue) - new Date(aValue);
      } else {
        return new Date(aValue) - new Date(bValue);
      }
    });

    // 分页
    const total = users.length;
    const paginatedUsers = users.slice(offset, offset + limit);

    return {
      users: paginatedUsers.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        status: u.status,
        profile: u.profile,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        loginCount: u.loginCount
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
   * 获取用户统计
   */
  async getUserStats() {
    const users = Array.from(this.userCollection.values());
    
    const stats = {
      total: users.length,
      byRole: {},
      byStatus: {},
      activeToday: 0,
      newThisWeek: 0
    };

    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    users.forEach(user => {
      // 按角色统计
      stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
      
      // 按状态统计
      stats.byStatus[user.status] = (stats.byStatus[user.status] || 0) + 1;
      
      // 今日活跃用户
      if (user.lastLoginAt && new Date(user.lastLoginAt).toDateString() === today.toDateString()) {
        stats.activeToday++;
      }
      
      // 本周新用户
      if (new Date(user.createdAt) >= weekAgo) {
        stats.newThisWeek++;
      }
    });

    return stats;
  }

  /**
   * 验证用户数据
   */
  validateUserData(data) {
    const errors = [];

    if (!data.username || data.username.length < 3) {
      errors.push('用户名至少需要3个字符');
    }

    if (data.username && !/^[a-zA-Z0-9_]+$/.test(data.username)) {
      errors.push('用户名只能包含字母、数字和下划线');
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('邮箱格式不正确');
    }

    if (!data.password || data.password.length < 6) {
      errors.push('密码至少需要6个字符');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 查找用户（通过用户名或邮箱）
   */
  findUserByUsernameOrEmail(username, email) {
    for (const user of this.userCollection.values()) {
      if (user.username === username.toLowerCase() || user.email === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  /**
   * 加密密码
   */
  hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * 验证密码
   */
  verifyPassword(password, hashedPassword) {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  /**
   * 生成会话ID
   */
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
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
        userCount: this.userCollection.size,
        sessionCount: this.sessionCollection.size,
        roleCount: this.roleCollection.size,
        permissionCount: this.permissionCollection.size,
        behaviorRecords: Array.from(this.userBehaviorCollection.values())
          .reduce((total, behaviors) => total + behaviors.length, 0)
      }
    };
  }

  /**
   * 停止 Agent
   */
  async stop() {
    this.logger.info('停止用户管理Agent');

    // 清理资源
    this.userCollection.clear();
    this.sessionCollection.clear();
    this.roleCollection.clear();
    this.permissionCollection.clear();
    this.userBehaviorCollection.clear();
    this.removeAllListeners();

    await super.stop();
  }
}

module.exports = UserManagementAgent;