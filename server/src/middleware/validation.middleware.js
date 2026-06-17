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

  // 链接解析
  parseLink: Joi.object({
    url: Joi.string().uri().required().messages({
      'string.uri': '请输入有效的视频链接',
      'any.required': '视频链接不能为空',
    }),
  }),

  // 从链接创建任务
  createFromLink: Joi.object({
    url: Joi.string().uri().required().messages({
      'string.uri': '请输入有效的视频链接',
      'any.required': '视频链接不能为空',
    }),
    task_type: Joi.string().valid('subtitle', 'watermark', 'logo').default('subtitle'),
    region: Joi.string().allow(null, '').optional(),
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

  // ===== 管理员认证 =====
  adminLogin: Joi.object({
    username: Joi.string().required().messages({
      'string.empty': '用户名不能为空',
      'any.required': '用户名为必填项',
    }),
    password: Joi.string().required().messages({
      'string.empty': '密码不能为空',
      'any.required': '密码为必填项',
    }),
  }),

  // ===== 管理员 - 用户查询 =====
  adminUserQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    page_size: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('active', 'banned').optional(),
    vip_type: Joi.string().valid('none', 'monthly', 'quarterly', 'yearly').optional(),
    search: Joi.string().max(100).optional(),
  }),

  // ===== 管理员 - 任务查询 =====
  adminTaskQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    page_size: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'cancelled').optional(),
    task_type: Joi.string().valid('subtitle', 'watermark', 'logo').optional(),
    user_id: Joi.string().optional(),
  }),

  // ===== 管理员 - 订单查询 =====
  adminOrderQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    page_size: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('pending', 'paid', 'failed', 'refunded', 'cancelled').optional(),
    payment_method: Joi.string().valid('wechat', 'alipay').optional(),
  }),

  // ===== 更新用户状态 =====
  updateUserStatus: Joi.object({
    status: Joi.string().valid('active', 'banned').required().messages({
      'any.only': '状态只能是 active 或 banned',
      'any.required': '状态为必填项',
    }),
  }),

  // ===== 调整用户积分 =====
  adjustBalance: Joi.object({
    amount: Joi.number().integer().required().messages({
      'number.base': '积分数量必须为数字',
      'any.required': '积分为必填项',
    }),
    description: Joi.string().max(200).optional(),
  }),

  // ===== 更新任务状态 =====
  updateTaskStatus: Joi.object({
    status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'cancelled').required().messages({
      'any.only': '无效的任务状态',
      'any.required': '状态为必填项',
    }),
  }),

  // ===== 创建公告 =====
  createAnnouncement: Joi.object({
    title: Joi.string().max(200).required().messages({
      'string.empty': '公告标题不能为空',
      'any.required': '标题为必填项',
    }),
    content: Joi.string().required().messages({
      'string.empty': '公告内容不能为空',
      'any.required': '内容为必填项',
    }),
    status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
  }),

  // ===== 更新公告 =====
  updateAnnouncement: Joi.object({
    title: Joi.string().max(200).optional(),
    content: Joi.string().optional(),
    status: Joi.string().valid('draft', 'published', 'archived').optional(),
  }),

  // ===== 创建 FAQ =====
  createFaq: Joi.object({
    question: Joi.string().max(500).required().messages({
      'string.empty': '问题不能为空',
      'any.required': '问题为必填项',
    }),
    answer: Joi.string().required().messages({
      'string.empty': '回答不能为空',
      'any.required': '回答为必填项',
    }),
    sort_order: Joi.number().integer().min(0).default(0),
    status: Joi.string().valid('active', 'hidden').default('active'),
  }),

  // ===== 更新 FAQ =====
  updateFaq: Joi.object({
    question: Joi.string().max(500).optional(),
    answer: Joi.string().optional(),
    sort_order: Joi.number().integer().min(0).optional(),
    status: Joi.string().valid('active', 'hidden').optional(),
  }),

  // ===== 更新反馈 =====
  updateFeedback: Joi.object({
    status: Joi.string().valid('pending', 'processing', 'resolved').optional(),
    reply: Joi.string().max(1000).optional(),
  }),

  // ===== 更新系统配置 =====
  updateConfig: Joi.object({
    config_value: Joi.string().required().messages({
      'string.empty': '配置值不能为空',
      'any.required': '配置值为必填项',
    }),
    description: Joi.string().max(200).optional(),
  }),

  // ===== 管理员退款 =====
  adminRefundOrder: Joi.object({
    reason: Joi.string().max(200).default('管理员退款').messages({
      'string.max': '退款原因不能超过 200 个字符',
    }),
  }),
};

module.exports = { validate, schemas };
