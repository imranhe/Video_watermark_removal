const pointsLogModel = require('../models/points-log.model');

const pointsService = {
  async getBalance(userId) {
    const balance = await pointsLogModel.getBalance(userId);
    const summary = await pointsLogModel.getSummary(userId);

    return {
      balance,
      total_earned: parseInt(summary.total_earned),
      total_spent: parseInt(summary.total_spent),
    };
  },

  async getLogs(userId, options = {}) {
    const result = await pointsLogModel.findByUser(userId, options);
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

module.exports = pointsService;
