const { msgSecCheck } = require('../utils/wechat');
const logger = require('../utils/logger');

/**
 * 内容安全检查中间件
 * 对用户提交的文本内容调用微信 msg_sec_check 接口
 * 微信审核要求 UGC 场景必须接入内容安全检测
 *
 * @param {Function} getContent - 从 req 中提取待检查文本的函数
 */
function contentSecurityCheck(getContent) {
  return async (req, res, next) => {
    try {
      const content = getContent(req);
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return next();
      }

      const openid = req.user?.openid || '';
      const result = await msgSecCheck(content.trim(), openid);

      if (!result.pass) {
        logger.warn('内容安全检查未通过', {
          userId: req.user?.id,
          content: content.substring(0, 50),
          detail: result.detail,
        });
        return res.status(400).json({
          code: 400,
          message: '内容包含违规信息，请修改后重试',
          error: {
            type: 'CONTENT_SECURITY_CHECK_FAILED',
            detail: result.detail,
          },
        });
      }

      next();
    } catch (err) {
      // 审核中间件异常不应阻塞正常请求
      logger.error('内容安全检查中间件异常', { error: err.message });
      next();
    }
  };
}

module.exports = { contentSecurityCheck };
