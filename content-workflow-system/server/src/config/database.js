const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // 使用Docker MongoDB的认证连接
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/content-workflow?authSource=admin',
      {
        serverSelectionTimeoutMS: 5000, // 减少服务器选择超时时间
        connectTimeoutMS: 10000, // 减少连接超时时间
        socketTimeoutMS: 0, // 禁用socket超时
        bufferCommands: false, // 禁用mongoose缓冲
        maxPoolSize: 10, // 连接池大小
        minPoolSize: 2, // 减少最小连接池大小
        maxIdleTimeMS: 30000, // 最大空闲时间
        heartbeatFrequencyMS: 2000, // 增加心跳频率
        retryWrites: true, // 启用重试写入
        w: 'majority', // 写入确认
      }
    );

    console.log(`✅ MongoDB连接成功: ${conn.connection.host}`);
    
    // 监听连接事件
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB连接错误:', err.message);
      // 不抛出错误，继续运行
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB连接断开，使用模拟数据');
    });

    // 优雅关闭
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('📴 MongoDB连接已关闭');
      } catch (err) {
        console.log('📴 服务器关闭');
      }
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB连接失败:', error.message);
    console.log('⚠️ 服务器将使用模拟数据继续运行');
    // 设置全局标志，表示使用模拟数据
    global.USE_MOCK_DATA = true;
  }
};

module.exports = connectDB;
