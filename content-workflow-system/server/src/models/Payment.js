const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['wechat', 'alipay', 'unionpay', 'paypal', 'jdpay', 'qqpay']
  },
  planType: {
    type: String,
    enum: ['basic', 'pro', 'enterprise']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  transactionId: {
    type: String,
    index: true
  },
  paymentParams: {
    type: mongoose.Schema.Types.Mixed
  },
  paidAt: {
    type: Date
  },
  failedReason: {
    type: String
  },
  refundedAt: {
    type: Date
  },
  refundAmount: {
    type: Number,
    min: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// 索引
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ paymentMethod: 1, status: 1 });

// 虚拟字段
paymentSchema.virtual('isPaid').get(function() {
  return this.status === 'paid';
});

paymentSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

// 实例方法
paymentSchema.methods.markAsPaid = function(transactionId) {
  this.status = 'paid';
  this.transactionId = transactionId;
  this.paidAt = new Date();
  return this.save();
};

paymentSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.failedReason = reason;
  return this.save();
};

paymentSchema.methods.cancel = function() {
  if (this.status === 'pending') {
    this.status = 'cancelled';
    return this.save();
  }
  throw new Error('只能取消待支付的订单');
};

// 静态方法
paymentSchema.statics.findByUserId = function(userId, options = {}) {
  const query = { userId };
  if (options.status) {
    query.status = options.status;
  }
  return this.find(query).sort({ createdAt: -1 });
};

paymentSchema.statics.findPendingOrders = function() {
  return this.find({ status: 'pending' }).sort({ createdAt: -1 });
};

paymentSchema.statics.getPaymentStats = function(startDate, endDate) {
  const matchStage = {
    status: 'paid'
  };
  
  if (startDate && endDate) {
    matchStage.paidAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalOrders: { $sum: 1 },
        avgAmount: { $avg: '$amount' },
        paymentMethods: {
          $push: '$paymentMethod'
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalAmount: 1,
        totalOrders: 1,
        avgAmount: { $round: ['$avgAmount', 2] },
        wechatCount: {
          $size: {
            $filter: {
              input: '$paymentMethods',
              cond: { $eq: ['$$this', 'wechat'] }
            }
          }
        },
        alipayCount: {
          $size: {
            $filter: {
              input: '$paymentMethods',
              cond: { $eq: ['$$this', 'alipay'] }
            }
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Payment', paymentSchema);