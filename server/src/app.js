const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const logger = require('./utils/logger');

// 路由
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const taskRoutes = require('./routes/task.routes');
const packageRoutes = require('./routes/package.routes');
const orderRoutes = require('./routes/order.routes');
const pointsRoutes = require('./routes/points.routes');
const notificationRoutes = require('./routes/notification.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const systemRoutes = require('./routes/system.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// ============================================
// 中间件
// ============================================

// 安全头部
app.use(helmet());

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// 请求日志
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.text({ type: 'text/xml' }));

// 静态文件 - 上传目录
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// ============================================
// API 路由 - 挂载到 /v1
// ============================================

app.use('/v1/auth', authRoutes);
app.use('/v1/user', userRoutes);
app.use('/v1/tasks', taskRoutes);
app.use('/v1/packages', packageRoutes);
app.use('/v1/orders', orderRoutes);
app.use('/v1/points', pointsRoutes);
app.use('/v1/notifications', notificationRoutes);
app.use('/v1/feedbacks', feedbackRoutes);
app.use('/v1/system', systemRoutes);
app.use('/v1/admin', adminRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// 错误处理
// ============================================

// 业务错误码处理
app.use((err, req, res, next) => {
  if (err.code) {
    const httpStatus = err.code >= 1000 ? 400 : err.code;
    return res.status(httpStatus).json({
      code: err.code,
      message: err.message,
      error: err.detail ? {
        type: err.detail,
        detail: err.message,
      } : undefined,
    });
  }
  next(err);
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
