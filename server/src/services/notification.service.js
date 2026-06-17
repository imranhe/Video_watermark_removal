const notificationModel = require('../models/notification.model');
const taskModel = require('../models/task.model');

const notificationService = {
  async getNotifications(userId, options = {}) {
    return notificationModel.findByUser(userId, options);
  },

  async markAsRead(notificationId, userId) {
    const notif = await notificationModel.findById(notificationId);
    if (!notif || notif.user_id !== userId) {
      const error = new Error('通知不存在');
      error.code = 404;
      throw error;
    }

    await notificationModel.markAsRead(notificationId, userId);
    return { id: notificationId, is_read: true };
  },

  async markAllAsRead(userId) {
    const updatedCount = await notificationModel.markAllAsRead(userId);
    return { updated_count: updatedCount };
  },

  async createNotification(userId, type, title, content) {
    return notificationModel.create({
      user_id: userId,
      type,
      title,
      content,
    });
  },

  /**
   * 发送任务完成通知
   */
  async sendTaskCompleteNotification(userId, taskId) {
    const task = await taskModel.findById(taskId);
    const taskTypeMap = { subtitle: '去字幕', watermark: '去水印', logo: '去图标' };
    const typeName = taskTypeMap[task?.task_type] || '视频处理';

    return this.createNotification(
      userId,
      'task_complete',
      '任务处理完成',
      `您的${typeName}任务已处理完成，快来查看结果吧！`
    );
  },

  /**
   * 发送支付成功通知
   */
  async sendPaymentSuccessNotification(userId, orderNo, amount) {
    return this.createNotification(
      userId,
      'payment_success',
      '支付成功',
      `订单 ${orderNo} 支付成功，金额 ¥${amount}`
    );
  },
};

module.exports = notificationService;
