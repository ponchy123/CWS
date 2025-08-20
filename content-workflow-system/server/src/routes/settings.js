const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// 获取系统设置
router.get('/', auth, async (req, res) => {
  try {
    // 检查用户是否存在
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    let user = await User.findById(req.user.id);
    
    // 如果用户不存在，创建一个默认用户
    if (!user) {
      try {
        user = new User({
          _id: req.user.id,
          username: req.user.username || 'developer',
          email: req.user.email || 'dev@example.com',
          password: 'defaultpassword123', // 这会被加密
          profile: {
            phone: '',
            company: '',
            position: '',
            location: '',
            bio: ''
          },
          settings: {
            theme: 'auto',
            language: 'zh-CN',
            notifications: {
              email: true,
              push: false,
              sms: false
            }
          },
          role: 'admin',
          isActive: true
        });
        await user.save();
        console.log('创建默认用户成功:', user._id);
      } catch (createError) {
        console.error('创建默认用户失败:', createError);
        // 如果创建失败，返回默认数据
        return res.json({
          success: true,
          data: {
            profile: {},
            settings: {},
            preferences: {
              theme: 'auto',
              language: 'zh-CN',
              notifications: {
                email: true,
                push: false,
                sms: false
              }
            }
          }
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        profile: user.profile || {},
        settings: user.settings || {},
        preferences: {
          theme: (user.settings && user.settings.theme) || 'auto',
          language: (user.settings && user.settings.language) || 'zh-CN',
          notifications: (user.settings && user.settings.notifications) || {
            email: true,
            push: false,
            sms: false
          }
        }
      }
    });
  } catch (error) {
    console.error('获取设置错误:', error);
    res.status(500).json({
      success: false,
      message: '获取设置失败'
    });
  }
});

// 更新系统设置
router.put('/', auth, async (req, res) => {
  try {
    const { profile, settings, preferences } = req.body;
    
    const updateData = {};
    if (profile) updateData.profile = { ...req.user.profile, ...profile };
    if (settings) updateData.settings = { ...req.user.settings, ...settings };
    if (preferences) {
      updateData.settings = {
        ...req.user.settings,
        theme: preferences.theme || req.user.settings.theme,
        language: preferences.language || req.user.settings.language,
        notifications: preferences.notifications || req.user.settings.notifications
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: '设置更新成功',
      data: {
        profile: user.profile,
        settings: user.settings
      }
    });
  } catch (error) {
    console.error('更新设置错误:', error);
    res.status(500).json({
      success: false,
      message: '更新设置失败'
    });
  }
});

// 重置设置
router.post('/reset', auth, async (req, res) => {
  try {
    const defaultSettings = {
      theme: 'auto',
      language: 'zh-CN',
      notifications: {
        email: true,
        push: false,
        sms: false
      }
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { settings: defaultSettings },
      { new: true }
    );

    res.json({
      success: true,
      message: '设置已重置为默认值',
      data: user.settings
    });
  } catch (error) {
    console.error('重置设置错误:', error);
    res.status(500).json({
      success: false,
      message: '重置设置失败'
    });
  }
});

// 导出用户数据
router.get('/export', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    const exportData = {
      user: user.toJSON(),
      exportTime: new Date().toISOString(),
      version: '1.0'
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=user-data.json');
    res.json(exportData);
  } catch (error) {
    console.error('导出数据错误:', error);
    res.status(500).json({
      success: false,
      message: '导出数据失败'
    });
  }
});

module.exports = router;