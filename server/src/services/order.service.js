const orderModel = require('../models/order.model');
const packageModel = require('../models/package.model');
const pointsLogModel = require('../models/points-log.model');
const userModel = require('../models/user.model');
const wechatPayClient = require('../utils/payment');
const logger = require('../utils/logger');

const orderService = {
  async getPackages() {
    return packageModel.findAll(true);
  },

  async createOrder(userId, packageId, paymentMethod) {
    // 检查套餐
    const pkg = await packageModel.findById(packageId);
    if (!pkg || !pkg.is_active) {
      const error = new Error('套餐不存在或已下架');
      error.code = 1008;
      throw error;
    }

    // 获取用户 openid
    const user = await userModel.findById(userId);
    if (!user) {
      const error = new Error('用户不存在');
      error.code = 1002;
      throw error;
    }

    // 创建支付参数
    const orderNo = `ORD${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const paymentParams = await wechatPayClient.createPayment(
      orderNo,
      user.openid,
      pkg.price,
      pkg.name
    );

    // 创建订单
    const order = await orderModel.create({
      user_id: userId,
      package_id: packageId,
      package_name: pkg.name,
      amount: pkg.price,
      credits: pkg.credits || 0,
      payment_method: paymentMethod,
      payment_params: paymentParams,
      status: 'pending',
    });

    return {
      id: order.id,
      order_no: order.order_no,
      user_id: order.user_id,
      package_id: order.package_id,
      package_name: order.package_name,
      amount: parseFloat(order.amount),
      credits: order.credits,
      status: order.status,
      payment_method: order.payment_method,
      payment_params: typeof order.payment_params === 'string'
        ? JSON.parse(order.payment_params)
        : order.payment_params,
      created_at: order.created_at,
    };
  },

  async getOrderDetail(orderId, userId) {
    const order = await orderModel.findById(orderId);
    if (!order || order.user_id !== userId) {
      const error = new Error('订单不存在');
      error.code = 404;
      throw error;
    }

    return {
      id: order.id,
      order_no: order.order_no,
      user_id: order.user_id,
      package_id: order.package_id,
      package_name: order.package_name,
      amount: parseFloat(order.amount),
      credits: order.credits,
      status: order.status,
      payment_method: order.payment_method,
      transaction_id: order.transaction_id,
      paid_at: order.paid_at,
      created_at: order.created_at,
    };
  },

  async getOrderList(userId, options = {}) {
    const result = await orderModel.findByUser(userId, options);
    return {
      list: result.list,
      pagination: {
        page: options.page || 1,
        page_size: options.pageSize || 20,
        total: result.total,
        total_pages: Math.ceil(result.total / (options.pageSize || 20)),
      },
    };
  },

  async handlePaymentCallback(callbackData) {
    const transactionId = callbackData.transaction_id;
    const orderNo = callbackData.out_trade_no;

    const order = await orderModel.findByOrderNo(orderNo);
    if (!order) {
      logger.warn(`支付回调：订单不存在 ${orderNo}`);
      return;
    }

    if (order.status === 'paid') {
      logger.info(`支付回调：订单已支付 ${orderNo}`);
      return;
    }

    // 标记订单已支付
    await orderModel.markPaid(order.id, transactionId);

    // 充值积分（如果是积分套餐）
    if (order.credits > 0) {
      await pointsLogModel.addPoints(
        order.user_id,
        order.credits,
        `购买${order.package_name}套餐`,
        order.id
      );
    }

    // 如果购买的是 VIP 套餐，更新用户 VIP 状态
    const pkg = await packageModel.findById(order.package_id);
    if (pkg && pkg.type !== 'points' && pkg.duration_days) {
      const user = await userModel.findById(order.user_id);
      let vipExpireAt;
      if (user.vip_expire_at && new Date(user.vip_expire_at) > new Date()) {
        vipExpireAt = new Date(user.vip_expire_at);
        vipExpireAt.setDate(vipExpireAt.getDate() + pkg.duration_days);
      } else {
        vipExpireAt = new Date();
        vipExpireAt.setDate(vipExpireAt.getDate() + pkg.duration_days);
      }

      await userModel.update(order.user_id, {
        vip_type: pkg.type,
        vip_expire_at: vipExpireAt,
      });
    }

    logger.info(`支付成功: 订单=${orderNo}, 用户=${order.user_id}, 金额=${order.amount}`);
  },

  async getAdminTodayStats() {
    const orderStats = await orderModel.getTodayStats();
    const pool = require('../config/database');

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
      WHERE DATE(created_at) = CURDATE()
    `);

    const [activeUsers] = await pool.query(`
      SELECT COUNT(DISTINCT user_id) AS active_users
      FROM tasks
      WHERE DATE(created_at) = CURDATE()
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
      total_revenue: parseFloat(orderStats?.total_revenue || '0'),
      total_credits_used: parseInt(creditsUsed[0]?.total_credits_used || '0'),
    };
  },
};

module.exports = orderService;
