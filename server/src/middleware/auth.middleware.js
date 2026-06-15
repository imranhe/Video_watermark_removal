const { verifyToken } = require('../utils/jwt');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      message: '未授权',
      error: {
        type: 'UNAUTHORIZED',
        detail: '缺少有效的 Token',
      },
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      code: 401,
      message: 'Token 已过期或无效',
      error: {
        type: 'TOKEN_INVALID',
        detail: '请重新登录',
      },
    });
  }

  req.user = {
    id: decoded.userId,
    openid: decoded.openid,
    role: decoded.role || 'user',
  };
  next();
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    code: 403,
    message: '禁止访问',
    error: {
      type: 'FORBIDDEN',
      detail: '需要管理员权限',
    },
  });
}

module.exports = { authenticate, requireAdmin };
