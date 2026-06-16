const logger = require('../utils/logger');

function errorHandler(err, req, res, _next) {
  // Log error with request context
  logger.error('Unhandled error', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    error: err.message,
    stack: err.stack,
    code: err.code,
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: 400,
      message: '参数验证失败',
      requestId: req.requestId,
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
      requestId: req.requestId,
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
      requestId: req.requestId,
      error: {
        type: 'FILE_TOO_LARGE',
        detail: '文件大小不能超过 100MB',
      },
    });
  }

  // External service errors
  if (err.code === 'ALIYUN_MPS_ERROR' || err.code === 'ALIYUN_OSS_ERROR') {
    return res.status(502).json({
      code: 502,
      message: '外部服务异常',
      requestId: req.requestId,
      error: {
        type: 'EXTERNAL_SERVICE_ERROR',
        detail: err.message,
        service: err.service || 'aliyun',
      },
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    code: statusCode,
    message: err.message || '服务器内部错误',
    requestId: req.requestId,
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
    requestId: req.requestId,
    error: {
      type: 'NOT_FOUND',
      detail: `路径 ${req.method} ${req.originalUrl} 不存在`,
    },
  });
}

module.exports = { errorHandler, notFoundHandler };
