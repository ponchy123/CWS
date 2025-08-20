const mongoose = require('mongoose');

const inspirationSchema = new mongoose.Schema({
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
  source: {
    type: String,
    trim: true
  },
  sourceUrl: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['article', 'video', 'image', 'audio', 'link', 'tutorial', 'case_study', 'news', 'data_report', 'product_update', 'policy_update', 'industry_report'],
    default: 'article'
  },
  category: {
    type: String,
    required: [true, '分类不能为空'],
    enum: ['职业发展', 'AI工具', '行业分析', '文案技巧', '产品设计', '营销策略', '电商营销', '内容创作', '创作者经济']
  },
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['待处理', '进行中', '已完成', '已放弃'],
    default: '待处理'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isStarred: {
    type: Boolean,
    default: false
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }],
  relatedContent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  },
  notes: String,
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 索引
inspirationSchema.index({ author: 1, status: 1 });
inspirationSchema.index({ category: 1, tags: 1 });
inspirationSchema.index({ isStarred: 1 });
inspirationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Inspiration', inspirationSchema);