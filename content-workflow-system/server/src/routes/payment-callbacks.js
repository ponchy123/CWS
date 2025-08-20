const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// 银联支付回调
router.post('/notify/unionpay', (req, res) => {
  try {
    const { orderId, respCode, queryId } = req.body;

    if (respCode === '00') {
      // 更新订单状态为已支付
      console.log(`银联支付成功: ${orderId}`);
      // await updateOrderStatus(orderId, 'paid', queryId);
    }

    res.send('ok');
  } catch (error) {
    console.error('银联支付回调处理失败:', error);
    res.send('fail');
  }
});

// PayPal支付回调
router.post('/notify/paypal', (req, res) => {
  try {
    const { resource } = req.body;
    
    if (resource && resource.status === 'COMPLETED') {
      const orderId = resource.purchase_units[0].custom_id;
      const transactionId = resource.id;
      
      console.log(`PayPal支付成功: ${orderId}`);
      // await updateOrderStatus(orderId, 'paid', transactionId);
    }

    res.status(200).send('SUCCESS');
  } catch (error) {
    console.error('PayPal支付回调处理失败:', error);
    res.status(500).send('ERROR');
  }
});

// 京东支付回调
router.post('/notify/jdpay', (req, res) => {
  try {
    const { tradeNum, status, amount } = req.body;

    if (status === 'SUCCESS') {
      console.log(`京东支付成功: ${tradeNum}`);
      // await updateOrderStatus(tradeNum, 'paid', tradeNum);
    }

    res.send('SUCCESS');
  } catch (error) {
    console.error('京东支付回调处理失败:', error);
    res.send('FAIL');
  }
});

// QQ钱包支付回调
router.post('/notify/qqpay', (req, res) => {
  try {
    const { out_trade_no, transaction_id, result_code } = req.body;

    if (result_code === 'SUCCESS') {
      console.log(`QQ钱包支付成功: ${out_trade_no}`);
      // await updateOrderStatus(out_trade_no, 'paid', transaction_id);
    }

    res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>');
  } catch (error) {
    console.error('QQ钱包支付回调处理失败:', error);
    res.send('<xml><return_code><![CDATA[FAIL]]></return_code></xml>');
  }
});

module.exports = router;