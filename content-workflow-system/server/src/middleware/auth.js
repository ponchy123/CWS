const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // 开发环境下绕过认证
    if (process.env.NODE_ENV === 'development') {
      const mongoose = require('mongoose');
      const userId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
      req.user = {
        _id: userId,
        id: userId.toString(), // 添加 id 字段
        username: 'developer',
        email: 'dev@example.com',
        role: 'admin',
        isActive: true
      };
      return next();
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，请提供有效的token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('认证错误:', error);
    res.status(401).json({
      success: false,
      message: 'Token无效'
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限'
      });
    }
    
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: '权限验证失败'
    });
  }
};

module.exports = { auth, adminAuth };