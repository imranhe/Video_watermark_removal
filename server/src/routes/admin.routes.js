const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const orderService = require('../services/order.service');
const { successResponse } = require('../utils/helpers');

router.get('/stats/today', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const result = await orderService.getAdminTodayStats();
    res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
