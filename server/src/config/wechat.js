module.exports = {
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET,
  mchId: process.env.WECHAT_MCH_ID,
  apiKey: process.env.WECHAT_API_KEY,

  // 微信登录接口
  loginUrl: 'https://api.weixin.qq.com/sns/jscode2session',

  // 微信支付接口
  payUrl: 'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi',
  refundUrl: 'https://api.mch.weixin.qq.com/v3/refund/domestic/refunds',
};
