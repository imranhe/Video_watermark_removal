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

/**
 * 文本内容安全检查（msg_sec_check）
 * 微信要求 UGC 场景必须接入
 * @param {string} content - 待检查文本
 * @param {string} openid - 用户 openid（可选）
 * @returns {Promise<{pass: boolean, detail?: string}>}
 */
async function msgSecCheck(content, openid = '') {
  try {
    const accessToken = await getAccessToken();
    const response = await axios.post(
      `https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${accessToken}`,
      {
        content,
        version: 2,
        scene: 2, // 2=评论场景
        openid,
      }
    );

    const data = response.data;
    if (data.errcode === 0) {
      return { pass: true };
    }
    // errcode 87014 = 内容含有违规内容
    return { pass: false, detail: data.errmsg || '内容包含违规信息' };
  } catch (err) {
    // 接口异常时放行，避免阻塞正常用户
    console.error('内容安全检查失败:', err.message);
    return { pass: true };
  }
}

module.exports = {
  code2Session,
  getAccessToken,
  msgSecCheck,
};
