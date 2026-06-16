const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const logger = require('../utils/logger');

/**
 * Redis connection for rate limiting
 */
let redisClient;

function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      enableOfflineQueue: false,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error for rate limiting', { error: err.message });
    });
  }

  return redisClient;
}

/**
 * Create rate limiter with optional Redis store
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Limit each IP to 100 requests per windowMs
    message = '请求过于频繁，请稍后再试',
    skipSuccessfulRequests = false,
    keyGenerator = (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown',
  } = options;

  const limiterOptions = {
    windowMs,
    max,
    message: {
      code: 429,
      message,
      error: {
        type: 'RATE_LIMIT_EXCEEDED',
        detail: `请求次数超限，请在 ${Math.ceil(windowMs / 60000)} 分钟后重试`,
      },
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skipSuccessfulRequests,
    keyGenerator,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
      });

      res.status(429).json({
        code: 429,
        message,
        error: {
          type: 'RATE_LIMIT_EXCEEDED',
          detail: `请求次数超限，请在 ${Math.ceil(windowMs / 60000)} 分钟后重试`,
        },
      });
    },
  };

  // Use Redis store if available (for distributed rate limiting)
  if (process.env.REDIS_HOST) {
    try {
      const client = getRedisClient();
      limiterOptions.store = new RedisStore({
        sendCommand: (...args) => client.call(...args),
        prefix: 'rl:',
      });
      logger.info('Using Redis store for rate limiting');
    } catch (error) {
      logger.warn('Failed to initialize Redis store, using memory store', {
        error: error.message,
      });
    }
  }

  return rateLimit(limiterOptions);
}

/**
 * Global rate limiter for all requests
 */
const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP per 15 minutes
  message: '请求过于频繁，请稍后再试',
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  message: '登录尝试次数过多，请稍后再试',
  skipSuccessfulRequests: true, // Only count failed attempts
});

/**
 * Upload rate limiter
 */
const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: '上传次数过于频繁，请稍后再试',
});

/**
 * Payment rate limiter
 */
const paymentLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 payment attempts per hour
  message: '支付请求过于频繁，请稍后再试',
});

/**
 * API rate limiter (higher limit for general API)
 */
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per IP per 15 minutes
  message: 'API 请求过于频繁，请稍后再试',
});

/**
 * User-specific rate limiter
 */
const userLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // 150 requests per user per 15 minutes
  keyGenerator: (req) => req.user?.id || req.ip,
  message: '用户请求过于频繁，请稍后再试',
});

module.exports = {
  globalLimiter,
  authLimiter,
  uploadLimiter,
  paymentLimiter,
  apiLimiter,
  userLimiter,
  createRateLimiter,
  getRedisClient,
};
