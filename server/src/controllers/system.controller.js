const systemService = require('../services/system.service');
const { successResponse } = require('../utils/helpers');

const systemController = {
  async getConfig(req, res, next) {
    try {
      const result = await systemService.getSystemConfig();
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async getProcessingConfig(req, res, next) {
    try {
      const result = await systemService.getProcessingConfig();
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },
};

module.exports = systemController;
