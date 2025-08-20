const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 导入新的配置和日志系统
const { config } = require('./config/environment');
const { logger, httpLogger } = require('./config/logger');
const { healthCheck } = require('./config/health');
const connectDB = require('./config/database');

// 初始化 Agent 系统
const { initializeAgents } = require('./agents');
// 初始化工作流系统
const { initializeWorkflowSystem } = require('./workflow');

const app = express();
const PORT = process.env.PORT || 3003;

// 连接数据库
connectDB();

// 安全中间件
app.use(helmet());

// 压缩响应
app.use(compression());

// 跨域配置
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true
}));

// 请求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  }
});
app.use('/api/', limiter);

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'connected'
  });
});

// API路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/content', require('./routes/content'));
app.use('/api/inspiration', require('./routes/inspiration'));
app.use('/api/publish', require('./routes/publish'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/user', require('./routes/user'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/extract', require('./routes/extract'));
app.use('/api/hot-topics', require('./routes/hotTopics'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/payment', require('./routes/payment-callbacks'));
app.use('/api/free-apis', require('./routes/freeApis'));
app.use('/api/social-media', require('./routes/socialMedia'));
app.use('/api/advanced', require('./routes/advancedFeatures'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/workflow', require('./routes/workflow'));

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  // 使用统一日志系统记录错误
  logger.error('服务器错误', { 
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  }, err, req);
  
  // Mongoose验证错误
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    logger.warn('数据验证失败', { errors, url: req.url }, req);
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors
    });
  }
  
  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    logger.security('无效Token访问', { url: req.url }, req);
    return res.status(401).json({
      success: false,
      message: 'Token无效'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    logger.security('过期Token访问', { url: req.url }, req);
    return res.status(401).json({
      success: false,
      message: 'Token已过期'
    });
  }
  
  // MongoDB重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    logger.warn('数据重复', { field, value: err.keyValue[field] }, req);
    return res.status(400).json({
      success: false,
      message: `${field}已存在`
    });
  }
  
  // 默认错误
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

// 启动服务器
const server = app.listen(PORT, async () => {
  logger.info('服务器启动成功', {
    port: PORT,
    environment: config.get('NODE_ENV'),
    clientUrl: config.get('CLIENT_URL'),
    apiUrl: `http://localhost:${PORT}/api`,
    databaseUri: config.getDatabaseConfig().uri.replace(/\/\/.*@/, '//***:***@'), // 隐藏密码
  });
  
  // 初始化 Agent 系统
  try {
    const agents = initializeAgents();
    logger.info('Agent 系统初始化完成', {
      agentCount: Object.keys(agents).length - 1, // 减去 agentManager
      agents: ['content_analysis', 'hot_topics', 'publish_scheduler', 'user_behavior']
    });
    
    // 初始化工作流系统
    const workflowSystem = initializeWorkflowSystem(agents.agentManager);
    logger.info('工作流系统初始化完成', {
      status: workflowSystem.getStatus().status,
      workflowCount: workflowSystem.getWorkflowEngine().getWorkflows().length
    });
  } catch (error) {
    logger.error('系统初始化失败', {
      error: error.message
    }, error);
  }
  
  // 记录启动时间
  logger.performance('server_startup_time', Date.now() - process.uptime() * 1000);
});

// 优雅关闭处理
const gracefulShutdown = (signal) => {
  logger.info(`收到${signal}信号，开始优雅关闭服务器...`);
  
  server.close((err) => {
    if (err) {
      logger.error('服务器关闭时发生错误', { signal }, err);
      process.exit(1);
    }
    
    logger.info('HTTP服务器已关闭');
    
    // 关闭数据库连接
    const mongoose = require('mongoose');
    mongoose.connection.close(() => {
      logger.info('数据库连接已关闭');
      logger.info('服务器优雅关闭完成');
      process.exit(0);
    });
  });
  
  // 强制关闭超时
  setTimeout(() => {
    logger.error('强制关闭服务器（超时）');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获异常处理
process.on('uncaughtException', (err) => {
  logger.error('未捕获的异常', {}, err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝', { 
    reason: reason instanceof Error ? reason.message : reason,
    promise: promise.toString()
  });
});

module.exports = app;