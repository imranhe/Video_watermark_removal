const pointsService = require('../services/points.service');
const { successResponse, paginate } = require('../utils/helpers');

const pointsController = {
  async getBalance(req, res, next) {
    try {
      const result = await pointsService.getBalance(req.user.id);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async getLogs(req, res, next) {
    try {
      const query = req.query;
      const { page, pageSize, offset } = paginate(query.page, query.page_size);
      const result = await pointsService.getLogs(req.user.id, {
        page,
        pageSize,
        offset,
        type: query.type,
      });
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },
};

module.exports = pointsController;
