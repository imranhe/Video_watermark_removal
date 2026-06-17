module.exports = {
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET,
  mchId: process.env.WECHAT_MCH_ID,
  merchantId: process.env.WECHAT_MCH_ID, // payment.js 读取此字段
  apiKey: process.env.WECHAT_API_KEY,
  serialNo: process.env.WECHAT_SERIAL_NO,
  notifyUrl: process.env.WECHAT_NOTIFY_URL,
  payPrivateKeyPath: process.env.WECHAT_PAY_PRIVATE_KEY_PATH,
  payPublicKeyPath: process.env.WECHAT_PAY_PUBLIC_KEY_PATH,

  // 微信登录接口
  loginUrl: 'https://api.weixin.qq.com/sns/jscode2session',

  // 微信支付接口
  payUrl: 'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi',
  refundUrl: 'https://api.mch.weixin.qq.com/v3/refund/domestic/refunds',
};
