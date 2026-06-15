const notificationService = require('../services/notification.service');
const { successResponse, paginate } = require('../utils/helpers');

const notificationController = {
  async list(req, res, next) {
    try {
      const query = req.query;
      const { page, pageSize, offset } = paginate(query.page, query.page_size);
      const isRead = query.is_read !== undefined ? query.is_read === 'true' : undefined;
      const result = await notificationService.getNotifications(req.user.id, {
        page,
        pageSize,
        offset,
        is_read: isRead,
      });
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const result = await notificationService.markAsRead(req.params.id, req.user.id);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },
};

module.exports = notificationController;
