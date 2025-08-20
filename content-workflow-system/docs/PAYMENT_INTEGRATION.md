# 支付系统集成说明

## 概述

本项目已成功集成了类似 IJPay 的支付功能，支持微信支付和支付宝两种主流支付方式。虽然 IJPay 是 Java 生态的 SDK，但我们使用 Node.js 技术栈实现了相同的功能。

## 技术架构

### 后端 (Node.js + Express)
- **支付路由**: `server/src/routes/payment.js`
- **支付模型**: `server/src/models/Payment.js`
- **支付配置**: `server/.env.payment.example`

### 前端 (React + TypeScript)
- **支付服务**: `src/services/payment.ts`
- **支付组件**: `src/components/payment/PaymentDialog.tsx`
- **定价页面**: `src/pages/pricing.tsx`

## 功能特性

### 支付方式
- ✅ 微信支付 (Native 扫码支付)
- ✅ 支付宝 (当面付扫码支付)
- ✅ 支付状态实时查询
- ✅ 支付回调处理

### 订单管理
- ✅ 订单创建与状态管理
- ✅ 支付超时处理
- ✅ 订单取消功能
- ✅ 支付统计分析

### 安全特性
- ✅ 签名验证
- ✅ 回调验证
- ✅ 订单防重复
- ✅ 金额校验

## 配置说明

### 1. 环境变量配置

复制 `server/.env.payment.example` 到 `server/.env` 并填入真实配置：

```bash
# 微信支付配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_MCH_ID=your_wechat_mch_id
WECHAT_API_KEY=your_wechat_api_key
WECHAT_NOTIFY_URL=http://your-domain.com/api/payment/notify/wechat

# 支付宝配置
ALIPAY_APP_ID=your_alipay_app_id
ALIPAY_PRIVATE_KEY=your_alipay_private_key
ALIPAY_PUBLIC_KEY=your_alipay_public_key
ALIPAY_NOTIFY_URL=http://your-domain.com/api/payment/notify/alipay

# 支付环境配置
PAYMENT_ENV=sandbox  # sandbox 或 production
```

### 2. 数据库模型

支付订单数据模型包含以下字段：
- `orderId`: 订单号（唯一）
- `userId`: 用户ID
- `amount`: 支付金额
- `paymentMethod`: 支付方式
- `status`: 订单状态
- `transactionId`: 第三方交易号
- `paidAt`: 支付时间

## API 接口

### 创建支付订单
```
POST /api/payment/create-order
```

### 查询订单状态
```
GET /api/payment/order-status/:orderId
```

### 支付回调
```
POST /api/payment/notify/wechat
POST /api/payment/notify/alipay
```

### 获取支付方式
```
GET /api/payment/methods
```

## 使用示例

### 前端调用
```typescript
import { paymentService } from '@/services/payment';

// 创建订单
const order = await paymentService.createOrder({
  amount: 99.00,
  description: '购买专业版套餐',
  paymentMethod: 'wechat',
  userId: 'user123',
  planType: 'pro'
});

// 轮询支付状态
const paidOrder = await paymentService.pollOrderStatus(order.orderId);
```

### 后端处理
```javascript
// 创建订单
router.post('/create-order', async (req, res) => {
  const { amount, description, paymentMethod, userId } = req.body;
  
  const orderId = generateOrderId();
  const paymentParams = generatePaymentParams(paymentMethod, orderId, amount);
  
  res.json({
    success: true,
    data: { orderId, paymentParams }
  });
});
```

## 与 IJPay 的对比

| 功能 | IJPay (Java) | 本项目 (Node.js) |
|------|-------------|------------------|
| 微信支付 | ✅ | ✅ |
| 支付宝 | ✅ | ✅ |
| 签名验证 | ✅ | ✅ |
| 回调处理 | ✅ | ✅ |
| 订单管理 | ✅ | ✅ |
| 多环境支持 | ✅ | ✅ |

## 部署注意事项

1. **HTTPS 要求**: 生产环境必须使用 HTTPS
2. **回调地址**: 确保回调地址可以被支付平台访问
3. **证书配置**: 微信支付需要配置 API 证书
4. **域名备案**: 支付宝要求域名已备案

## 测试指南

### 沙箱测试
1. 使用沙箱环境的配置信息
2. 使用测试账号进行支付测试
3. 验证回调处理逻辑

### 生产测试
1. 小额测试订单
2. 验证真实支付流程
3. 测试异常情况处理

## 故障排查

### 常见问题
1. **签名错误**: 检查 API 密钥配置
2. **回调失败**: 确认回调地址可访问
3. **订单重复**: 检查订单号生成逻辑
4. **支付超时**: 调整轮询间隔和超时时间

### 日志监控
- 支付请求日志
- 回调处理日志
- 错误异常日志
- 性能监控日志

## 扩展功能

### 计划中的功能
- [ ] 退款功能
- [ ] 分账功能
- [ ] 批量支付
- [ ] 支付数据分析
- [ ] 风控系统

### 自定义扩展
可以根据业务需求扩展：
- 其他支付方式（银联、PayPal等）
- 订阅付费模式
- 优惠券系统
- 积分支付

## 总结

通过本次集成，我们成功将支付功能融入到内容创作工作流系统中，实现了：

1. **完整的支付流程**: 从订单创建到支付完成的全流程管理
2. **多种支付方式**: 支持主流的微信支付和支付宝
3. **安全可靠**: 实现了签名验证、回调验证等安全机制
4. **用户友好**: 提供了直观的支付界面和状态反馈
5. **易于维护**: 模块化设计，便于后续扩展和维护

虽然没有直接使用 IJPay，但我们实现了相同的功能和更好的集成体验。