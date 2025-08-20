const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// 支付配置 - 应该从环境变量读取
const PAYMENT_CONFIG = {
  wechat: {
    appId: process.env.WECHAT_APP_ID,
    mchId: process.env.WECHAT_MCH_ID,
    apiKey: process.env.WECHAT_API_KEY,
    notifyUrl: process.env.WECHAT_NOTIFY_URL
  },
  alipay: {
    appId: process.env.ALIPAY_APP_ID,
    privateKey: process.env.ALIPAY_PRIVATE_KEY,
    publicKey: process.env.ALIPAY_PUBLIC_KEY,
    notifyUrl: process.env.ALIPAY_NOTIFY_URL
  },
  unionpay: {
    merId: process.env.UNIONPAY_MER_ID,
    certId: process.env.UNIONPAY_CERT_ID,
    privateKey: process.env.UNIONPAY_PRIVATE_KEY,
    notifyUrl: process.env.UNIONPAY_NOTIFY_URL
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    notifyUrl: process.env.PAYPAL_NOTIFY_URL,
    sandbox: process.env.PAYPAL_SANDBOX === 'true'
  },
  jdpay: {
    merchantId: process.env.JDPAY_MERCHANT_ID,
    privateKey: process.env.JDPAY_PRIVATE_KEY,
    publicKey: process.env.JDPAY_PUBLIC_KEY,
    notifyUrl: process.env.JDPAY_NOTIFY_URL
  },
  qqpay: {
    appId: process.env.QQPAY_APP_ID,
    mchId: process.env.QQPAY_MCH_ID,
    apiKey: process.env.QQPAY_API_KEY,
    notifyUrl: process.env.QQPAY_NOTIFY_URL
  }
};

// 生成订单号
function generateOrderId() {
  return 'CWS' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// 微信支付签名
function generateWechatSign(params, apiKey) {
  const sortedKeys = Object.keys(params).sort();
  const stringA = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
  const stringSignTemp = stringA + '&key=' + apiKey;
  return crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase();
}

// 创建支付订单
router.post('/create-order', async (req, res) => {
  try {
    const { amount, description, paymentMethod, userId, planType } = req.body;

    // 验证参数
    if (!amount || !description || !paymentMethod || !userId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const orderId = generateOrderId();
    const orderData = {
      orderId,
      amount: parseFloat(amount),
      description,
      paymentMethod,
      userId,
      planType,
      status: 'pending',
      createdAt: new Date()
    };

    // 根据支付方式生成支付参数
    let paymentParams = {};

    if (paymentMethod === 'wechat') {
      const params = {
        appid: PAYMENT_CONFIG.wechat.appId,
        mch_id: PAYMENT_CONFIG.wechat.mchId,
        nonce_str: crypto.randomBytes(16).toString('hex'),
        body: description,
        out_trade_no: orderId,
        total_fee: Math.round(amount * 100), // 转换为分
        spbill_create_ip: req.ip,
        notify_url: PAYMENT_CONFIG.wechat.notifyUrl,
        trade_type: 'NATIVE'
      };

      params.sign = generateWechatSign(params, PAYMENT_CONFIG.wechat.apiKey);
      paymentParams = params;

    } else if (paymentMethod === 'alipay') {
      paymentParams = {
        app_id: PAYMENT_CONFIG.alipay.appId,
        method: 'alipay.trade.precreate',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
        version: '1.0',
        notify_url: PAYMENT_CONFIG.alipay.notifyUrl,
        biz_content: JSON.stringify({
          out_trade_no: orderId,
          total_amount: amount.toFixed(2),
          subject: description
        })
      };
    } else if (paymentMethod === 'unionpay') {
      paymentParams = {
        version: '5.1.0',
        encoding: 'UTF-8',
        txnType: '01',
        txnSubType: '01',
        bizType: '000201',
        frontUrl: process.env.CLIENT_URL + '/payment/success',
        backUrl: PAYMENT_CONFIG.unionpay.notifyUrl,
        signMethod: '01',
        channelType: '07',
        accessType: '0',
        merId: PAYMENT_CONFIG.unionpay.merId,
        orderId: orderId,
        txnTime: new Date().toISOString().replace(/[-:T]/g, '').substr(0, 14),
        txnAmt: Math.round(amount * 100),
        currencyCode: '156'
      };
    } else if (paymentMethod === 'paypal') {
      paymentParams = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: (amount / 6.5).toFixed(2) // 简单汇率转换
          },
          description: description
        }],
        application_context: {
          return_url: process.env.CLIENT_URL + '/payment/success',
          cancel_url: process.env.CLIENT_URL + '/payment/cancel'
        }
      };
    } else if (paymentMethod === 'jdpay') {
      paymentParams = {
        version: '2.0',
        merchant: PAYMENT_CONFIG.jdpay.merchantId,
        tradeNum: orderId,
        tradeName: description,
        tradeDesc: description,
        tradeTime: new Date().toISOString(),
        amount: Math.round(amount * 100),
        currency: 'CNY',
        note: 'content-workflow-payment',
        callbackUrl: PAYMENT_CONFIG.jdpay.notifyUrl,
        notifyUrl: PAYMENT_CONFIG.jdpay.notifyUrl
      };
    } else if (paymentMethod === 'qqpay') {
      const params = {
        appid: PAYMENT_CONFIG.qqpay.appId,
        mch_id: PAYMENT_CONFIG.qqpay.mchId,
        nonce_str: crypto.randomBytes(16).toString('hex'),
        body: description,
        out_trade_no: orderId,
        total_fee: Math.round(amount * 100),
        spbill_create_ip: req.ip,
        notify_url: PAYMENT_CONFIG.qqpay.notifyUrl,
        trade_type: 'NATIVE'
      };
      params.sign = generateWechatSign(params, PAYMENT_CONFIG.qqpay.apiKey);
      paymentParams = params;
    }

    // 这里应该保存订单到数据库
    // await saveOrderToDatabase(orderData);

    res.json({
      success: true,
      data: {
        orderId,
        paymentParams,
        qrCode: `data:image/svg+xml;base64,${Buffer.from(`<svg>QR Code for ${orderId}</svg>`).toString('base64')}`
      }
    });

  } catch (error) {
    console.error('创建支付订单失败:', error);
    res.status(500).json({
      success: false,
      message: '创建支付订单失败'
    });
  }
});

// 查询订单状态
router.get('/order-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // 这里应该从数据库查询订单状态
    // const order = await getOrderFromDatabase(orderId);

    // 模拟订单状态
    const mockOrder = {
      orderId,
      status: Math.random() > 0.5 ? 'paid' : 'pending',
      amount: 99.00,
      createdAt: new Date(),
      paidAt: Math.random() > 0.5 ? new Date() : null
    };

    res.json({
      success: true,
      data: mockOrder
    });

  } catch (error) {
    console.error('查询订单状态失败:', error);
    res.status(500).json({
      success: false,
      message: '查询订单状态失败'
    });
  }
});

// 支付回调处理
router.post('/notify/wechat', (req, res) => {
  try {
    // 处理微信支付回调
    const { out_trade_no, transaction_id, result_code } = req.body;

    if (result_code === 'SUCCESS') {
      // 更新订单状态为已支付
      // await updateOrderStatus(out_trade_no, 'paid', transaction_id);
      console.log(`微信支付成功: ${out_trade_no}`);
    }

    res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>');
  } catch (error) {
    console.error('微信支付回调处理失败:', error);
    res.send('<xml><return_code><![CDATA[FAIL]]></return_code></xml>');
  }
});

router.post('/notify/alipay', (req, res) => {
  try {
    // 处理支付宝回调
    const { out_trade_no, trade_no, trade_status } = req.body;

    if (trade_status === 'TRADE_SUCCESS') {
      // 更新订单状态为已支付
      // await updateOrderStatus(out_trade_no, 'paid', trade_no);
      console.log(`支付宝支付成功: ${out_trade_no}`);
    }

    res.send('success');
  } catch (error) {
    console.error('支付宝回调处理失败:', error);
    res.send('fail');
  }
});

// 获取支付方式列表
router.get('/methods', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'wechat',
        name: '微信支付',
        icon: '💚',
        description: '使用微信扫码支付',
        enabled: !!PAYMENT_CONFIG.wechat.appId
      },
      {
        id: 'alipay',
        name: '支付宝',
        icon: '🔵',
        description: '使用支付宝扫码支付',
        enabled: !!PAYMENT_CONFIG.alipay.appId
      },
      {
        id: 'unionpay',
        name: '银联支付',
        icon: '🏦',
        description: '中国银联官方支付',
        enabled: !!PAYMENT_CONFIG.unionpay.merId
      },
      {
        id: 'paypal',
        name: 'PayPal',
        icon: '🌐',
        description: '国际PayPal支付',
        enabled: !!PAYMENT_CONFIG.paypal.clientId
      },
      {
        id: 'jdpay',
        name: '京东支付',
        icon: '🛒',
        description: '京东钱包支付',
        enabled: !!PAYMENT_CONFIG.jdpay.merchantId
      },
      {
        id: 'qqpay',
        name: 'QQ钱包',
        icon: '🐧',
        description: '腾讯QQ钱包支付',
        enabled: !!PAYMENT_CONFIG.qqpay.appId
      }
    ]
  });
});

module.exports = router;