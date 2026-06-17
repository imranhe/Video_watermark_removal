const adminModel = require('../models/admin.model');
const adminLogModel = require('../models/admin-log.model');
const announcementModel = require('../models/announcement.model');
const faqModel = require('../models/faq.model');
const userModel = require('../models/user.model');
const taskModel = require('../models/task.model');
const orderModel = require('../models/order.model');
const pointsLogModel = require('../models/points-log.model');
const notificationModel = require('../models/notification.model');
const wechatPayClient = require('../utils/payment');
const pool = require('../config/database');
const { generateAccessToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

const adminService = {
  // ===== 认证 =====
  async login(username, password, ip) {
    const admin = await adminModel.findByUsername(username);
    if (!admin) {
      const error = new Error('用户名或密码错误');
      error.code = 1001;
      throw error;
    }

    if (admin.status !== 'active') {
      const error = new Error('账号已被禁用');
      error.code = 1001;
      throw error;
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      const error = new Error('用户名或密码错误');
      error.code = 1001;
      throw error;
    }

    // 更新最后登录时间
    await adminModel.updateLastLogin(admin.id);

    // 生成 token
    const token = generateAccessToken({ userId: admin.id, role: 'admin' });

    // 记录登录日志
    await adminLogModel.create({
      admin_id: admin.id,
      action: 'login',
      target_type: 'admin',
      target_id: admin.id,
      detail: { username },
      ip,
    });

    return {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: 'admin',
      },
    };
  },

  // ===== 仪表盘统计 =====
  async getTodayStats() {
    const [orderStats] = await pool.query(`
      SELECT
        COUNT(*) AS total_orders,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_revenue
      FROM orders
      WHERE DATE(created_at) = CURDATE() AND deleted_at IS NULL
    `);

    const [userStats] = await pool.query(`
      SELECT
        COUNT(*) AS total_users,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS new_users
      FROM users
    `);

    const [taskStats] = await pool.query(`
      SELECT
        COUNT(*) AS total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_tasks
      FROM tasks
      WHERE DATE(created_at) = CURDATE() AND deleted_at IS NULL
    `);

    const [activeUsers] = await pool.query(`
      SELECT COUNT(DISTINCT user_id) AS active_users
      FROM tasks
      WHERE DATE(created_at) = CURDATE() AND deleted_at IS NULL
    `);

    const [creditsUsed] = await pool.query(`
      SELECT COALESCE(SUM(ABS(change_amount)), 0) AS total_credits_used
      FROM points_logs
      WHERE type = 'consume' AND DATE(created_at) = CURDATE()
    `);

    return {
      new_users: parseInt(userStats[0]?.new_users || '0'),
      active_users: parseInt(activeUsers[0]?.active_users || '0'),
      total_tasks: parseInt(taskStats[0]?.total_tasks || '0'),
      completed_tasks: parseInt(taskStats[0]?.completed_tasks || '0'),
      failed_tasks: parseInt(taskStats[0]?.failed_tasks || '0'),
      total_revenue: parseFloat(orderStats[0]?.total_revenue || '0'),
      total_credits_used: parseInt(creditsUsed[0]?.total_credits_used || '0'),
    };
  },

  // ===== 用户管理 =====
  async getUsers(options = {}) {
    const { page = 1, pageSize = 20, offset = 0, status, vip_type, search } = options;
    const conditions = [];
    const values = [];

    if (status) {
      conditions.push('status = ?');
      values.push(status);
    }
    if (vip_type) {
      conditions.push('vip_type = ?');
      values.push(vip_type);
    }
    if (search) {
      conditions.push('nickname LIKE ?');
      values.push(`%${search}%`);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM users ${whereClause}`,
      values
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );

    return {
      list: rows,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  },

  async getUserDetail(userId) {
    const user = await userModel.findById(userId);
    if (!user) {
      const error = new Error('用户不存在');
      error.code = 1002;
      throw error;
    }

    const [taskCount] = await pool.query(
      'SELECT COUNT(*) AS count FROM tasks WHERE user_id = ? AND deleted_at IS NULL',
      [userId]
    );

    const pointsSummary = await pointsLogModel.getSummary(userId);

    return {
      ...user,
      task_count: taskCount[0].count,
      points_summary: pointsSummary,
    };
  },

  async updateUserStatus(userId, status, adminId, ip) {
    const user = await userModel.findById(userId);
    if (!user) {
      const error = new Error('用户不存在');
      error.code = 1002;
      throw error;
    }

    await userModel.update(userId, { status });

    await adminLogModel.create({
      admin_id: adminId,
      action: 'update_user_status',
      target_type: 'user',
      target_id: userId,
      detail: { old_status: user.status, new_status: status },
      ip,
    });

    return { id: userId, status };
  },

  async adjustUserBalance(userId, amount, reason, adminId, ip) {
    const user = await userModel.findById(userId);
    if (!user) {
      const error = new Error('用户不存在');
      error.code = 1002;
      throw error;
    }

    let result;
    if (amount > 0) {
      result = await pointsLogModel.addPoints(userId, amount, reason || '管理员调整');
    } else {
      result = await pointsLogModel.deductPoints(userId, Math.abs(amount), reason || '管理员调整');
    }

    await adminLogModel.create({
      admin_id: adminId,
      action: 'adjust_balance',
      target_type: 'user',
      target_id: userId,
      detail: { amount, reason, old_balance: user.balance, new_balance: result.balance },
      ip,
    });

    return { id: userId, balance: result.balance };
  },

  // ===== 任务管理 =====
  async getTasks(options = {}) {
    const { page = 1, pageSize = 20, offset = 0, status, task_type, user_id } = options;
    const conditions = ['deleted_at IS NULL'];
    const values = [];

    if (status) {
      conditions.push('status = ?');
      values.push(status);
    }
    if (task_type) {
      conditions.push('task_type = ?');
      values.push(task_type);
    }
    if (user_id) {
      conditions.push('user_id = ?');
      values.push(user_id);
    }

    const whereClause = conditions.join(' AND ');

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM tasks WHERE ${whereClause}`,
      values
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM tasks WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );

    return {
      list: rows,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  },

  async getTaskDetail(taskId) {
    const [rows] = await pool.query(
      'SELECT * FROM tasks WHERE id = ? LIMIT 1',
      [taskId]
    );
    if (!rows[0]) {
      const error = new Error('任务不存在');
      error.code = 1004;
      throw error;
    }
    return rows[0];
  },

  async updateTaskStatus(taskId, status, adminId, ip) {
    const task = await this.getTaskDetail(taskId);
    await taskModel.update(taskId, { status });

    await adminLogModel.create({
      admin_id: adminId,
      action: 'update_task_status',
      target_type: 'task',
      target_id: taskId,
      detail: { old_status: task.status, new_status: status },
      ip,
    });

    return { id: taskId, status };
  },

  // ===== 订单管理 =====
  async getOrders(options = {}) {
    const { page = 1, pageSize = 20, offset = 0, status, payment_method } = options;
    const conditions = ['deleted_at IS NULL'];
    const values = [];

    if (status) {
      conditions.push('status = ?');
      values.push(status);
    }
    if (payment_method) {
      conditions.push('payment_method = ?');
      values.push(payment_method);
    }

    const whereClause = conditions.join(' AND ');

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM orders WHERE ${whereClause}`,
      values
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM orders WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );

    return {
      list: rows,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  },

  async refundOrder(orderId, reason, adminId, ip) {
    const order = await orderModel.findById(orderId);
    if (!order) {
      const error = new Error('订单不存在');
      error.code = 1005;
      throw error;
    }

    if (order.status !== 'paid') {
      const error = new Error('只能退款已支付的订单');
      error.code = 1006;
      throw error;
    }

    // 生成退款单号
    const refundNo = `REF${order.order_no}${Date.now()}`;

    try {
      // 调用微信支付退款接口
      const refundResult = await wechatPayClient.refund(
        order.order_no,
        refundNo,
        parseFloat(order.amount),
        parseFloat(order.amount),
        reason || '管理员退款'
      );

      // 更新订单状态为已退款
      await orderModel.update(orderId, {
        status: 'refunded',
        refund_id: refundResult.refund_id,
        refund_no: refundNo,
        refunded_at: new Date(),
      });

      // 退还积分
      if (order.credits > 0) {
        await pointsLogModel.addPoints(
          order.user_id,
          order.credits,
          `订单退款 ${order.order_no}`,
          order.id
        );
      }

      // 记录管理员操作日志
      await adminLogModel.create({
        admin_id: adminId,
        action: 'refund_order',
        target_type: 'order',
        target_id: orderId,
        detail: {
          order_no: order.order_no,
          amount: order.amount,
          credits: order.credits,
          refund_id: refundResult.refund_id,
          refund_status: refundResult.status,
          reason: reason || '管理员退款',
        },
        ip,
      });

      // 发送通知给用户
      await notificationModel.create({
        user_id: order.user_id,
        type: 'refund',
        title: '退款通知',
        content: `您的订单 ${order.order_no} 已成功退款，退款金额 ¥${parseFloat(order.amount).toFixed(2)}。${order.credits > 0 ? `已退还 ${order.credits} 积分。` : ''}退款将在 1-5 个工作日内到账。`,
      });

      logger.info('订单退款成功', {
        orderId,
        orderNo: order.order_no,
        amount: order.amount,
        refundId: refundResult.refund_id,
        refundStatus: refundResult.status,
        adminId,
      });

      return {
        id: orderId,
        status: 'refunded',
        refund_id: refundResult.refund_id,
        refund_status: refundResult.status,
      };
    } catch (error) {
      logger.error('订单退款失败', {
        orderId,
        orderNo: order.order_no,
        amount: order.amount,
        error: error.message,
        adminId,
      });

      const err = new Error(`退款失败: ${error.message}`);
      err.code = 1020;
      throw err;
    }
  },

  // ===== 公告管理 =====
  async getAnnouncements(options) {
    return announcementModel.findAll(options);
  },

  async createAnnouncement(data) {
    const announcement = await announcementModel.create(data);
    return announcement;
  },

  async updateAnnouncement(id, data) {
    const existing = await announcementModel.findById(id);
    if (!existing) {
      const error = new Error('公告不存在');
      error.code = 1007;
      throw error;
    }
    return announcementModel.update(id, data);
  },

  async deleteAnnouncement(id) {
    const existing = await announcementModel.findById(id);
    if (!existing) {
      const error = new Error('公告不存在');
      error.code = 1007;
      throw error;
    }
    await announcementModel.delete(id);
  },

  // ===== FAQ 管理 =====
  async getFaqs(options) {
    return faqModel.findAll(options);
  },

  async createFaq(data) {
    return faqModel.create(data);
  },

  async updateFaq(id, data) {
    const existing = await faqModel.findById(id);
    if (!existing) {
      const error = new Error('FAQ 不存在');
      error.code = 1008;
      throw error;
    }
    return faqModel.update(id, data);
  },

  async deleteFaq(id) {
    const existing = await faqModel.findById(id);
    if (!existing) {
      const error = new Error('FAQ 不存在');
      error.code = 1008;
      throw error;
    }
    await faqModel.delete(id);
  },

  // ===== 反馈管理 =====
  async getFeedbacks(options = {}) {
    const { page = 1, pageSize = 20, offset = 0, status } = options;
    const conditions = [];
    const values = [];

    if (status) {
      conditions.push('status = ?');
      values.push(status);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM feedbacks ${whereClause}`,
      values
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM feedbacks ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );

    return {
      list: rows,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  },

  async updateFeedback(id, data, adminId, ip) {
    const [existing] = await pool.query('SELECT * FROM feedbacks WHERE id = ? LIMIT 1', [id]);
    if (!existing[0]) {
      const error = new Error('反馈不存在');
      error.code = 1009;
      throw error;
    }

    const fields = [];
    const values = [];

    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.reply !== undefined) {
      fields.push('reply = ?');
      values.push(data.reply);
    }

    if (fields.length > 0) {
      fields.push('updated_at = NOW()');
      values.push(id);
      await pool.query(`UPDATE feedbacks SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    await adminLogModel.create({
      admin_id: adminId,
      action: 'update_feedback',
      target_type: 'feedback',
      target_id: id,
      detail: data,
      ip,
    });

    const [updated] = await pool.query('SELECT * FROM feedbacks WHERE id = ? LIMIT 1', [id]);
    return updated[0];
  },

  // ===== 系统配置 =====
  async getSystemConfigs() {
    const [rows] = await pool.query('SELECT * FROM system_configs ORDER BY config_key ASC');
    return rows;
  },

  async updateSystemConfig(key, value, adminId, ip) {
    const [existing] = await pool.query(
      'SELECT * FROM system_configs WHERE config_key = ? LIMIT 1',
      [key]
    );

    if (!existing[0]) {
      const error = new Error('配置项不存在');
      error.code = 1010;
      throw error;
    }

    const description = existing[0].description;
    await pool.query(
      'UPDATE system_configs SET config_value = ?, updated_at = NOW() WHERE config_key = ?',
      [value, key]
    );

    await adminLogModel.create({
      admin_id: adminId,
      action: 'update_config',
      target_type: 'system_config',
      target_id: key,
      detail: { key, old_value: existing[0].config_value, new_value: value },
      ip,
    });

    return { config_key: key, config_value: value, description };
  },

  // ===== 操作日志 =====
  async getAdminLogs(options) {
    return adminLogModel.findAll(options);
  },
};

module.exports = adminService;
