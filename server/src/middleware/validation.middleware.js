const Joi = require('joi');

function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));

      return res.status(400).json({
        code: 400,
        message: '参数验证失败',
        error: {
          type: 'INVALID_PARAMS',
          detail: details,
        },
      });
    }

    req[property] = value;
    next();
  };
}

// 通用验证规则
const schemas = {
  // 微信登录
  login: Joi.object({
    code: Joi.string().required().messages({
      'string.empty': '微信登录码不能为空',
      'any.required': '微信登录码为必填项',
    }),
  }),

  // 刷新 Token
  refreshToken: Joi.object({
    refresh_token: Joi.string().required().messages({
      'string.empty': '刷新令牌不能为空',
      'any.required': '刷新令牌为必填项',
    }),
  }),

  // 更新用户信息
  updateUser: Joi.object({
    nickname: Joi.string().max(50).optional(),
    avatar_url: Joi.string().uri().optional(),
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional(),
  }),

  // 创建任务
  createTask: Joi.object({
    task_type: Joi.string().valid('subtitle', 'watermark', 'logo').required(),
    region: Joi.object({
      x: Joi.number().min(0).required(),
      y: Joi.number().min(0).required(),
      width: Joi.number().min(1).required(),
      height: Joi.number().min(1).required(),
    }).optional(),
  }),

  // 任务列表查询
  taskListQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    page_size: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('pending', 'processing', 'completed', 'failed').optional(),
    task_type: Joi.string().valid('subtitle', 'watermark', 'logo').optional(),
  }),

  // 创建订单
  createOrder: Joi.object({
    package_id: Joi.string().required(),
    payment_method: Joi.string().valid('wechat', 'alipay').required(),
  }),

  // 订单列表查询
  orderListQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    page_size: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('pending', 'paid', 'cancelled', 'refunded').optional(),
  }),

  // 积分记录查询
  pointsLogQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    page_size: Joi.number().integer().min(1).max(100).default(20),
    type: Joi.string().valid('consume', 'recharge', 'gift', 'refund').optional(),
  }),

  // 通知列表查询
  notificationQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    page_size: Joi.number().integer().min(1).max(100).default(20),
    is_read: Joi.boolean().optional(),
  }),

  // 提交反馈
  createFeedback: Joi.object({
    type: Joi.string().valid('bug', 'feature', 'complaint', 'other').required(),
    content: Joi.string().min(1).max(1000).required(),
    contact: Joi.string().max(100).optional(),
  }),

  // 反馈列表查询
  feedbackQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    page_size: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('pending', 'processing', 'resolved').optional(),
  }),
};

module.exports = { validate, schemas };
