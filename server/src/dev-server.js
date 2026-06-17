#!/usr/bin/env node

/**
 * 开发模式启动脚本
 * 跳过数据库和 Redis，使用内存存储
 * 快速验证项目能否运行
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');

// 加载开发配置
require('dotenv').config({ path: path.resolve(__dirname, '../.env.dev') });

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 内存存储（模拟数据库）
// ============================================

const memoryDB = {
  users: new Map(),
  tasks: new Map(),
  orders: new Map(),
  pointsLogs: new Map(),

  // 初始化测试数据
  init() {
    // 测试用户
    this.users.set('user-1', {
      id: 'user-1',
      openid: 'test-openid-1',
      nickname: '测试用户',
      avatar_url: '',
      balance: 1000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    console.log('✓ 内存数据库已初始化');
    console.log('  测试用户: user-1 (积分: 1000)');

    // 管理员用户（密码: admin123）
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    this.admins = new Map();
    this.admins.set('admin-1', {
      id: 'admin-1',
      username: 'admin',
      password_hash: adminPasswordHash,
      name: '系统管理员',
      email: 'admin@example.com',
      role_id: 'role-admin',
      role: 'admin',
      status: 'active',
      last_login_at: null,
      created_at: new Date().toISOString()
    });

    // 模拟管理数据
    this.announcements = new Map();
    this.faqs = new Map();
    this.feedbackList = new Map();
    this.systemConfigs = new Map();
    this.adminLogs = [];

    // 初始公告
    this.announcements.set('ann-1', {
      id: 'ann-1',
      title: '欢迎使用视频去字幕工具',
      content: '新用户注册即送 30 积分，快来体验吧！',
      status: 'published',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    });

    // 初始 FAQ
    this.faqs.set('faq-1', {
      id: 'faq-1',
      question: '如何使用视频去字幕功能？',
      answer: '上传视频后选择处理区域，系统会自动去除字幕。',
      sort_order: 1,
      status: 'active',
      created_at: new Date().toISOString()
    });
    this.faqs.set('faq-2', {
      id: 'faq-2',
      question: '积分如何获取？',
      answer: '新用户注册赠送 30 积分，也可以通过购买套餐获取。',
      sort_order: 2,
      status: 'active',
      created_at: new Date().toISOString()
    });

    // 初始系统配置
    this.systemConfigs.set('app_version', { config_key: 'app_version', config_value: '1.0.0', description: '应用版本号' });
    this.systemConfigs.set('min_version', { config_key: 'min_version', config_value: '1.0.0', description: '最低支持版本' });
    this.systemConfigs.set('maintenance_mode', { config_key: 'maintenance_mode', config_value: 'false', description: '维护模式开关' });

    console.log('  管理员: admin / admin123');
  }
};

// 初始化数据库
memoryDB.init();

// ============================================
// 中间件配置
// ============================================

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// ============================================
// API 路由
// ============================================

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'development',
    timestamp: new Date().toISOString(),
    message: '✓ 后端服务运行正常（开发模式）'
  });
});

// ============================================
// 认证 API
// ============================================

app.post('/v1/auth/wechat-login', (req, res) => {
  const { code } = req.body;

  // 模拟微信登录
  const userId = 'user-1';
  const user = memoryDB.users.get(userId);

  res.json({
    code: 200,
    message: '登录成功',
    data: {
      token: 'dev-token-' + Date.now(),
      refreshToken: 'dev-refresh-token-' + Date.now(),
      userInfo: user
    }
  });
});

app.post('/v1/auth/alipay-login', (req, res) => {
  const { authCode } = req.body;

  const userId = 'user-1';
  const user = memoryDB.users.get(userId);

  res.json({
    code: 200,
    message: '登录成功',
    data: {
      token: 'dev-token-' + Date.now(),
      refreshToken: 'dev-refresh-token-' + Date.now(),
      userInfo: user
    }
  });
});

// ============================================
// 用户 API
// ============================================

app.get('/v1/user/profile', (req, res) => {
  const userId = 'user-1';
  const user = memoryDB.users.get(userId);

  res.json({
    code: 200,
    data: user
  });
});

app.put('/v1/user/profile', (req, res) => {
  const userId = 'user-1';
  const user = memoryDB.users.get(userId);
  const updates = req.body;

  Object.assign(user, updates, { updated_at: new Date().toISOString() });

  res.json({
    code: 200,
    message: '更新成功',
    data: user
  });
});

// ============================================
// 任务 API
// ============================================

app.post('/v1/tasks', upload.single('video'), (req, res) => {
  const userId = 'user-1';
  const { type } = req.body;
  const videoFile = req.file;

  if (!videoFile) {
    return res.status(400).json({
      code: 400,
      message: '请上传视频文件'
    });
  }

  const taskId = 'task-' + Date.now();
  const task = {
    id: taskId,
    user_id: userId,
    video_url: `/uploads/${videoFile.filename}`,
    result_url: null,
    status: 'pending',
    task_type: type || 'subtitle',
    progress: 0,
    error_message: null,
    params: {},
    created_at: new Date().toISOString(),
    completed_at: null
  };

  memoryDB.tasks.set(taskId, task);

  // 模拟异步处理
  setTimeout(() => {
    task.status = 'processing';
    task.progress = 30;
    console.log(`任务 ${taskId} 开始处理...`);
  }, 1000);

  setTimeout(() => {
    task.progress = 60;
    console.log(`任务 ${taskId} 处理中: 60%`);
  }, 2000);

  setTimeout(() => {
    task.status = 'completed';
    task.progress = 100;
    task.result_url = task.video_url; // 模拟处理完成
    task.completed_at = new Date().toISOString();
    console.log(`任务 ${taskId} 处理完成 ✓`);
  }, 3000);

  res.json({
    code: 200,
    message: '任务已创建',
    data: task
  });
});

app.get('/v1/tasks', (req, res) => {
  const userId = 'user-1';
  const tasks = Array.from(memoryDB.tasks.values())
    .filter(t => t.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({
    code: 200,
    data: {
      list: tasks,
      total: tasks.length
    }
  });
});

app.get('/v1/tasks/:id', (req, res) => {
  const { id } = req.params;
  const task = memoryDB.tasks.get(id);

  if (!task) {
    return res.status(404).json({
      code: 404,
      message: '任务不存在'
    });
  }

  res.json({
    code: 200,
    data: task
  });
});

app.get('/v1/tasks/:id/progress', (req, res) => {
  const { id } = req.params;
  const task = memoryDB.tasks.get(id);

  if (!task) {
    return res.status(404).json({
      code: 404,
      message: '任务不存在'
    });
  }

  res.json({
    code: 200,
    data: {
      status: task.status,
      progress: task.progress,
      result_url: task.result_url
    }
  });
});

app.delete('/v1/tasks/:id', (req, res) => {
  const { id } = req.params;

  if (!memoryDB.tasks.has(id)) {
    return res.status(404).json({
      code: 404,
      message: '任务不存在'
    });
  }

  memoryDB.tasks.delete(id);

  res.json({
    code: 200,
    message: '任务已删除'
  });
});

// ============================================
// 订单 API
// ============================================

app.post('/v1/orders', (req, res) => {
  const userId = 'user-1';
  const { packageId, amount, credits } = req.body;

  const orderId = 'order-' + Date.now();
  const order = {
    id: orderId,
    user_id: userId,
    amount: amount || 10.00,
    credits: credits || 100,
    status: 'pending',
    platform: 'wechat',
    created_at: new Date().toISOString()
  };

  memoryDB.orders.set(orderId, order);

  res.json({
    code: 200,
    message: '订单已创建',
    data: order
  });
});

app.get('/v1/orders', (req, res) => {
  const userId = 'user-1';
  const orders = Array.from(memoryDB.orders.values())
    .filter(o => o.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({
    code: 200,
    data: {
      list: orders,
      total: orders.length
    }
  });
});

// ============================================
// 积分 API
// ============================================

app.get('/v1/points/balance', (req, res) => {
  const userId = 'user-1';
  const user = memoryDB.users.get(userId);

  res.json({
    code: 200,
    data: {
      balance: user.balance
    }
  });
});

app.post('/v1/points/deduct', (req, res) => {
  const userId = 'user-1';
  const { amount, taskId } = req.body;
  const user = memoryDB.users.get(userId);

  if (user.balance < amount) {
    return res.status(400).json({
      code: 400,
      message: '积分不足'
    });
  }

  user.balance -= amount;

  res.json({
    code: 200,
    message: '积分扣除成功',
    data: {
      balance: user.balance,
      deducted: amount
    }
  });
});

// ============================================
// 套餐 API
// ============================================

app.get('/v1/packages', (req, res) => {
  res.json({
    code: 200,
    data: [
      {
        id: 'pkg-1',
        name: '体验套餐',
        credits: 10,
        price: 1.00,
        description: '10 积分，适合体验'
      },
      {
        id: 'pkg-2',
        name: '基础套餐',
        credits: 100,
        price: 9.90,
        description: '100 积分，适合轻度使用'
      },
      {
        id: 'pkg-3',
        name: '标准套餐',
        credits: 500,
        price: 39.90,
        description: '500 积分，适合经常使用'
      },
      {
        id: 'pkg-4',
        name: '高级套餐',
        credits: 1000,
        price: 69.90,
        description: '1000 积分，适合重度使用'
      }
    ]
  });
});

// ============================================
// 通知 API
// ============================================

app.get('/v1/notifications', (req, res) => {
  res.json({
    code: 200,
    data: {
      list: [],
      total: 0
    }
  });
});

// ============================================
// 反馈 API
// ============================================

app.post('/v1/feedbacks', (req, res) => {
  const { content, type } = req.body;

  res.json({
    code: 200,
    message: '反馈已提交，感谢您的建议！'
  });
});

// ============================================
// 系统配置 API
// ============================================

app.get('/v1/system/config', (req, res) => {
  res.json({
    code: 200,
    data: {
      version: '1.0.0',
      minVersion: '1.0.0',
      forceUpdate: false,
      maintenance: false,
      announcement: '欢迎使用视频去字幕小程序！'
    }
  });
});

// ============================================
// 管理后台 API（模拟）
// ============================================

// 管理员登录
app.post('/v1/admin/login', (req, res) => {
  const { username, password } = req.body;
  const admin = Array.from(memoryDB.admins.values()).find(a => a.username === username);

  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(400).json({
      code: 1001,
      message: '用户名或密码错误'
    });
  }

  admin.last_login_at = new Date().toISOString();
  memoryDB.adminLogs.push({
    id: 'log-' + Date.now(),
    admin_id: admin.id,
    action: 'login',
    ip: req.ip,
    created_at: new Date().toISOString()
  });

  res.json({
    code: 200,
    data: {
      token: 'admin-dev-token-' + Date.now(),
      admin: { id: admin.id, username: admin.username, name: admin.name, role: 'admin' }
    }
  });
});

// 仪表盘统计
app.get('/v1/admin/stats/today', (req, res) => {
  res.json({
    code: 200,
    data: {
      new_users: 5,
      active_users: 12,
      total_tasks: 30,
      completed_tasks: 25,
      failed_tasks: 2,
      total_revenue: 399.50,
      total_credits_used: 150
    }
  });
});

// 用户列表
app.get('/v1/admin/users', (req, res) => {
  const users = Array.from(memoryDB.users.values());
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.page_size) || 20;
  const start = (page - 1) * pageSize;
  const list = users.slice(start, start + pageSize);
  res.json({
    code: 200,
    data: {
      list,
      pagination: { page, page_size: pageSize, total: users.length, total_pages: Math.ceil(users.length / pageSize) }
    }
  });
});

// 用户详情
app.get('/v1/admin/users/:id', (req, res) => {
  const user = memoryDB.users.get(req.params.id);
  if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });
  res.json({ code: 200, data: { ...user, task_count: 0, points_summary: { total_earned: 0, total_spent: 0 } } });
});

// 更新用户状态
app.put('/v1/admin/users/:id/status', (req, res) => {
  const user = memoryDB.users.get(req.params.id);
  if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });
  user.status = req.body.status;
  res.json({ code: 200, data: { id: user.id, status: user.status } });
});

// 调整用户积分
app.put('/v1/admin/users/:id/balance', (req, res) => {
  const user = memoryDB.users.get(req.params.id);
  if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });
  user.balance += req.body.amount;
  res.json({ code: 200, data: { id: user.id, balance: user.balance } });
});

// 任务列表
app.get('/v1/admin/tasks', (req, res) => {
  const tasks = Array.from(memoryDB.tasks.values());
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.page_size) || 20;
  const start = (page - 1) * pageSize;
  const list = tasks.slice(start, start + pageSize);
  res.json({
    code: 200,
    data: {
      list,
      pagination: { page, page_size: pageSize, total: tasks.length, total_pages: Math.ceil(tasks.length / pageSize) }
    }
  });
});

// 任务详情
app.get('/v1/admin/tasks/:id', (req, res) => {
  const task = memoryDB.tasks.get(req.params.id);
  if (!task) return res.status(404).json({ code: 404, message: '任务不存在' });
  res.json({ code: 200, data: task });
});

// 更新任务状态
app.put('/v1/admin/tasks/:id/status', (req, res) => {
  const task = memoryDB.tasks.get(req.params.id);
  if (!task) return res.status(404).json({ code: 404, message: '任务不存在' });
  task.status = req.body.status;
  res.json({ code: 200, data: { id: task.id, status: task.status } });
});

// 订单列表
app.get('/v1/admin/orders', (req, res) => {
  const orders = Array.from(memoryDB.orders.values());
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.page_size) || 20;
  const start = (page - 1) * pageSize;
  const list = orders.slice(start, start + pageSize);
  res.json({
    code: 200,
    data: {
      list,
      pagination: { page, page_size: pageSize, total: orders.length, total_pages: Math.ceil(orders.length / pageSize) }
    }
  });
});

// 订单退款
app.post('/v1/admin/orders/:id/refund', (req, res) => {
  const order = memoryDB.orders.get(req.params.id);
  if (!order) return res.status(404).json({ code: 404, message: '订单不存在' });
  order.status = 'refunded';
  res.json({ code: 200, data: { id: order.id, status: 'refunded' } });
});

// 公告列表
app.get('/v1/admin/announcements', (req, res) => {
  const list = Array.from(memoryDB.announcements.values());
  res.json({ code: 200, data: { list, pagination: { page: 1, page_size: 20, total: list.length, total_pages: 1 } } });
});

// 创建公告
app.post('/v1/admin/announcements', (req, res) => {
  const id = 'ann-' + Date.now();
  const ann = { id, ...req.body, created_at: new Date().toISOString() };
  memoryDB.announcements.set(id, ann);
  res.status(201).json({ code: 200, data: ann });
});

// 更新公告
app.put('/v1/admin/announcements/:id', (req, res) => {
  const ann = memoryDB.announcements.get(req.params.id);
  if (!ann) return res.status(404).json({ code: 404, message: '公告不存在' });
  Object.assign(ann, req.body);
  res.json({ code: 200, data: ann });
});

// 删除公告
app.delete('/v1/admin/announcements/:id', (req, res) => {
  if (!memoryDB.announcements.has(req.params.id)) return res.status(404).json({ code: 404, message: '公告不存在' });
  memoryDB.announcements.delete(req.params.id);
  res.json({ code: 200, message: '删除成功' });
});

// FAQ 列表
app.get('/v1/admin/faqs', (req, res) => {
  const list = Array.from(memoryDB.faqs.values());
  res.json({ code: 200, data: { list, pagination: { page: 1, page_size: 20, total: list.length, total_pages: 1 } } });
});

// 创建 FAQ
app.post('/v1/admin/faqs', (req, res) => {
  const id = 'faq-' + Date.now();
  const faq = { id, ...req.body, created_at: new Date().toISOString() };
  memoryDB.faqs.set(id, faq);
  res.status(201).json({ code: 200, data: faq });
});

// 更新 FAQ
app.put('/v1/admin/faqs/:id', (req, res) => {
  const faq = memoryDB.faqs.get(req.params.id);
  if (!faq) return res.status(404).json({ code: 404, message: 'FAQ 不存在' });
  Object.assign(faq, req.body);
  res.json({ code: 200, data: faq });
});

// 删除 FAQ
app.delete('/v1/admin/faqs/:id', (req, res) => {
  if (!memoryDB.faqs.has(req.params.id)) return res.status(404).json({ code: 404, message: 'FAQ 不存在' });
  memoryDB.faqs.delete(req.params.id);
  res.json({ code: 200, message: '删除成功' });
});

// 反馈列表
app.get('/v1/admin/feedbacks', (req, res) => {
  const list = Array.from(memoryDB.feedbackList.values());
  res.json({ code: 200, data: { list, pagination: { page: 1, page_size: 20, total: list.length, total_pages: 1 } } });
});

// 更新反馈
app.put('/v1/admin/feedbacks/:id', (req, res) => {
  const fb = memoryDB.feedbackList.get(req.params.id);
  if (!fb) return res.status(404).json({ code: 404, message: '反馈不存在' });
  Object.assign(fb, req.body, { updated_at: new Date().toISOString() });
  res.json({ code: 200, data: fb });
});

// 系统配置列表
app.get('/v1/admin/configs', (req, res) => {
  const list = Array.from(memoryDB.systemConfigs.values());
  res.json({ code: 200, data: list });
});

// 更新系统配置
app.put('/v1/admin/configs/:key', (req, res) => {
  const config = memoryDB.systemConfigs.get(req.params.key);
  if (!config) return res.status(404).json({ code: 404, message: '配置项不存在' });
  config.config_value = req.body.config_value;
  if (req.body.description) config.description = req.body.description;
  res.json({ code: 200, data: config });
});

// 操作日志
app.get('/v1/admin/logs', (req, res) => {
  res.json({
    code: 200,
    data: {
      list: memoryDB.adminLogs.slice(0, 20),
      pagination: { page: 1, page_size: 20, total: memoryDB.adminLogs.length, total_pages: 1 }
    }
  });
});

// ============================================
// 错误处理
// ============================================

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: `接口不存在: ${req.method} ${req.path}`
  });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================
// 启动服务器
// ============================================

app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║   🎬 视频去字幕小程序 - 后端服务 (开发模式)              ║');
  console.log('║                                                          ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║   🚀 服务地址: http://localhost:${PORT}                      ║`);
  console.log('║   📊 健康检查: http://localhost:3000/health               ║');
  console.log('║   📝 API 文档: 查看 server/README.md                      ║');
  console.log('║                                                          ║');
  console.log('║   ✓ 内存数据库（无需 MySQL）                             ║');
  console.log('║   ✓ 模拟第三方服务（无需真实配置）                       ║');
  console.log('║   ✓ 测试用户已创建（积分: 1000）                         ║');
  console.log('║                                                          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('可用的 API:');
  console.log('  POST /v1/auth/wechat-login   - 微信登录');
  console.log('  GET  /v1/user/profile        - 用户信息');
  console.log('  POST /v1/tasks               - 创建任务（上传视频）');
  console.log('  GET  /v1/tasks               - 任务列表');
  console.log('  GET  /v1/tasks/:id/progress  - 任务进度');
  console.log('  GET  /v1/packages            - 套餐列表');
  console.log('  POST /v1/orders              - 创建订单');
  console.log('  GET  /v1/points/balance      - 积分余额');
  console.log('');
  console.log('按 Ctrl+C 停止服务');
  console.log('');
});

module.exports = app;
