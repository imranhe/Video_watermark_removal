const axios = require('axios');
const config = require('../config/wechat');

/**
 * 微信登录 - code2Session
 */
async function code2Session(code) {
  try {
    const response = await axios.get(config.loginUrl, {
      params: {
        appid: config.appId,
        secret: config.appSecret,
        js_code: code,
        grant_type: 'authorization_code',
      },
    });

    const data = response.data;
    if (data.errcode) {
      throw new Error(`微信登录失败: ${data.errmsg || data.errcode}`);
    }

    return {
      openid: data.openid,
      sessionKey: data.session_key,
      unionid: data.unionid || null,
    };
  } catch (err) {
    throw new Error(`微信登录失败: ${err.message}`);
  }
}

/**
 * 获取微信 Access Token
 */
async function getAccessToken() {
  try {
    const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
      params: {
        appid: config.appId,
        secret: config.appSecret,
        grant_type: 'client_credential',
      },
    });

    if (response.data.errcode) {
      throw new Error(`获取AccessToken失败: ${response.data.errmsg}`);
    }

    return response.data.access_token;
  } catch (err) {
    throw new Error(`获取AccessToken失败: ${err.message}`);
  }
}

module.exports = {
  code2Session,
  getAccessToken,
};
