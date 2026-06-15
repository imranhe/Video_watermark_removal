const userService = require('../services/user.service');
const { successResponse } = require('../utils/helpers');

const userController = {
  async getInfo(req, res, next) {
    try {
      const result = await userService.getUserInfo(req.user.id);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async updateInfo(req, res, next) {
    try {
      const result = await userService.updateUser(req.user.id, req.body);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const result = await userService.getUserStats(req.user.id);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },
};

module.exports = userController;
