const feedbackService = require('../services/feedback.service');
const { successResponse, paginate } = require('../utils/helpers');

const feedbackController = {
  async create(req, res, next) {
    try {
      const { type, content, contact } = req.body;
      const result = await feedbackService.createFeedback(
        req.user.id,
        type,
        content,
        contact
      );
      res.status(201).json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async list(req, res, next) {
    try {
      const query = req.query;
      const { page, pageSize, offset } = paginate(query.page, query.page_size);
      const result = await feedbackService.getFeedbacks(req.user.id, {
        page,
        pageSize,
        offset,
        status: query.status,
      });
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },
};

module.exports = feedbackController;
