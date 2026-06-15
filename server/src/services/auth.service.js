const userModel = require('../models/user.model');
const { code2Session } = require('../utils/wechat');
const { generateAccessToken, generateRefreshToken, getExpiresInSeconds } = require('../utils/jwt');
const logger = require('../utils/logger');

const authService = {
  async login(code) {
    try {
      // 微信登录
      const { openid } = await code2Session(code);

      // 查找或创建用户
      let user = await userModel.findByOpenid(openid);
      if (!user) {
        user = await userModel.create({ openid });
        logger.info(`新用户注册: ${user.id}`);
      }

      // 生成 Token
      const tokenPayload = { userId: user.id, openid: user.openid };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      return {
        user: {
          id: user.id,
          openid: user.openid,
          nickname: user.nickname,
          avatar_url: user.avatar_url,
          balance: user.balance,
          vip_type: user.vip_type,
          vip_expire_at: user.vip_expire_at,
          created_at: user.created_at,
        },
        token: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: getExpiresInSeconds(),
        },
      };
    } catch (err) {
      logger.error('Login failed:', err);
      const error = new Error('微信登录失败');
      error.code = 1001;
      error.detail = err.message;
      throw error;
    }
  },

  async refreshToken(refreshToken) {
    const { verifyToken, generateAccessToken, getExpiresInSeconds } = require('../utils/jwt');
    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      const error = new Error('刷新令牌无效或已过期');
      error.code = 401;
      throw error;
    }

    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      openid: decoded.openid,
    });

    return {
      access_token: newAccessToken,
      expires_in: getExpiresInSeconds(),
    };
  },
};

module.exports = authService;
