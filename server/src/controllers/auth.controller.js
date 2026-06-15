const authService = require('../services/auth.service');
const { successResponse } = require('../utils/helpers');

const authController = {
  async login(req, res, next) {
    try {
      const { code } = req.body;
      const result = await authService.login(code);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async refresh(req, res, next) {
    try {
      const { refresh_token } = req.body;
      const result = await authService.refreshToken(refresh_token);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
