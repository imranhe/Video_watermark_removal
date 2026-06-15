const crypto = require('crypto');
const axios = require('axios');
const config = require('../config/wechat');

/**
 * 创建微信支付 JSAPI 订单
 */
async function createPayment(orderNo, openid, amount, description) {
  // 实际生产环境中需要调用微信支付 API V3
  // 这里返回模拟的支付参数供开发和测试使用
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');

  // 模拟支付参数
  return {
    appId: config.appId,
    timeStamp: timestamp,
    nonceStr,
    package: `prepay_id=mock_${orderNo}`,
    signType: 'RSA',
    paySign: crypto
      .createHash('sha256')
      .update(`${config.appId}\n${timestamp}\n${nonceStr}\nprepay_id=mock_${orderNo}\n`)
      .digest('hex'),
  };
}

/**
 * 验证微信支付回调签名
 */
function verifyPaymentSign(xmlData, sign) {
  // 生产环境中需要验证微信支付回调签名
  // 这里简化处理
  return true;
}

/**
 * 解析微信支付回调 XML
 */
function parsePaymentCallback(xmlData) {
  // 生产环境中需要解析 XML
  // 这里简化处理
  return {
    return_code: 'SUCCESS',
    result_code: 'SUCCESS',
    out_trade_no: xmlData.match(/<out_trade_no><!\[CDATA\[(.*?)\]\]><\/out_trade_no>/)?.[1],
    transaction_id: xmlData.match(/<transaction_id><!\[CDATA\[(.*?)\]\]><\/transaction_id>/)?.[1],
    total_fee: xmlData.match(/<total_fee><!\[CDATA\[(\d+)\]\]><\/total_fee>/)?.[1],
    openid: xmlData.match(/<openid><!\[CDATA\[(.*?)\]\]><\/openid>/)?.[1],
  };
}

module.exports = {
  createPayment,
  verifyPaymentSign,
  parsePaymentCallback,
};
