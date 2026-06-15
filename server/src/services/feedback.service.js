const feedbackModel = require('../models/feedback.model');

const feedbackService = {
  async createFeedback(userId, type, content, contact) {
    return feedbackModel.create({
      user_id: userId,
      type,
      content,
      contact,
    });
  },

  async getFeedbacks(userId, options = {}) {
    const result = await feedbackModel.findByUser(userId, options);
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
};

module.exports = feedbackService;
