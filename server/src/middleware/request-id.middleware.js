const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Request ID middleware
 *
 * Adds unique request ID to each request for tracing and audit logging.
 */
function requestIdMiddleware(req, res, next) {
  // Get request ID from header or generate new one
  const requestId = req.headers['x-request-id'] || uuidv4();

  // Attach to request object
  req.requestId = requestId;
  req.id = requestId;

  // Add to response headers
  res.setHeader('X-Request-ID', requestId);

  // Add request start time for latency tracking
  req.startTime = Date.now();

  // Log request with ID
  logger.info('Request started', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip || req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent'],
    userId: req.user?.id,
  });

  // Track response
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const duration = Date.now() - req.startTime;

    // Log response
    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
    });

    // Log slow requests (> 1000ms)
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        requestId,
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
      });
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
}

/**
 * Security audit middleware
 *
 * Logs sensitive operations for compliance and security monitoring.
 */
function securityAuditMiddleware(req, res, next) {
  // Define sensitive operations
  const sensitiveOperations = {
    'POST /v1/auth/login': 'USER_LOGIN',
    'POST /v1/auth/refresh': 'TOKEN_REFRESH',
    'POST /v1/tasks': 'TASK_CREATE',
    'POST /v1/orders': 'ORDER_CREATE',
    'POST /v1/orders/callback/wechat': 'PAYMENT_CALLBACK',
    'PUT /v1/user/info': 'USER_UPDATE',
    'DELETE /v1/tasks': 'TASK_DELETE',
  };

  const operationKey = `${req.method} ${req.route?.path || req.path}`;
  const operationType = sensitiveOperations[operationKey];

  if (operationType) {
    logger.info('Sensitive operation', {
      requestId: req.requestId,
      operation: operationType,
      userId: req.user?.id,
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method,
      body: operationType === 'PAYMENT_CALLBACK' ? '[REDACTED]' : req.body,
      timestamp: new Date().toISOString(),
    });
  }

  next();
}

/**
 * Error context middleware
 *
 * Enriches errors with request context for better debugging.
 */
function errorContextMiddleware(err, req, res, next) {
  err.requestId = req.requestId;
  err.method = req.method;
  err.path = req.path;
  err.userId = req.user?.id;
  err.ip = req.ip || req.headers['x-forwarded-for'];

  next(err);
}

module.exports = {
  requestIdMiddleware,
  securityAuditMiddleware,
  errorContextMiddleware,
};
