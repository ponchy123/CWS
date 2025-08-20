const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '标题不能为空'],
    trim: true,
    maxlength: [200, '标题最多200个字符']
  },
  content: {
    type: String,
    required: [true, '内容不能为空']
  },
  summary: {
    type: String,
    maxlength: [500, '摘要最多500个字符']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, '分类不能为空'],
    enum: ['职业发展', 'AI工具', '行业分析', '文案技巧', '产品设计', '营销策略']
  },
  tags: [{
    type: String,
    trim: true
  }],
  platforms: [{
    name: {
      type: String,
      enum: ['知乎', 'B站', '公众号', '小红书', '抖音']
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'failed'],
      default: 'draft'
    },
    publishedAt: Date,
    url: String,
    metrics: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 }
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'published', 'archived'],
    default: 'draft'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  scheduledAt: Date,
  publishedAt: Date,
  coverImage: String,
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }],
  seo: {
    keywords: [String],
    description: String
  },
  analytics: {
    totalViews: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    totalShares: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 索引
contentSchema.index({ author: 1, status: 1 });
contentSchema.index({ category: 1, tags: 1 });
contentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Content', contentSchema);