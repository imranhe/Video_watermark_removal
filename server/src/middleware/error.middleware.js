const logger = require('../utils/logger');

function errorHandler(err, req, res, _next) {
  logger.error('Unhandled error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: 400,
      message: '参数验证失败',
      error: {
        type: 'INVALID_PARAMS',
        detail: err.details || err.message,
      },
    });
  }

  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({
      code: 401,
      message: '未授权',
      error: {
        type: 'UNAUTHORIZED',
        detail: err.message,
      },
    });
  }

  if (err.statusCode === 413) {
    return res.status(413).json({
      code: 400,
      message: '文件大小超限',
      error: {
        type: 'FILE_TOO_LARGE',
        detail: '文件大小不能超过 100MB',
      },
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    code: statusCode,
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? {
      type: 'INTERNAL_ERROR',
      detail: err.stack,
    } : undefined,
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    code: 404,
    message: '资源不存在',
    error: {
      type: 'NOT_FOUND',
      detail: `路径 ${req.method} ${req.originalUrl} 不存在`,
    },
  });
}

module.exports = { errorHandler, notFoundHandler };
