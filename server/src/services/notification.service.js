const notificationModel = require('../models/notification.model');

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
};

module.exports = notificationService;
