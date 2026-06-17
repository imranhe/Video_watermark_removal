const orderService = require('../services/order.service');
const wechatPayClient = require('../utils/payment');
const { successResponse, paginate } = require('../utils/helpers');

const orderController = {
  async getPackages(req, res, next) {
    try {
      const result = await orderService.getPackages();
      res.json(successResponse({ list: result }));
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { package_id, payment_method } = req.body;
      const result = await orderService.createOrder(
        req.user.id,
        package_id,
        payment_method
      );
      res.status(201).json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async detail(req, res, next) {
    try {
      const result = await orderService.getOrderDetail(req.params.id, req.user.id);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async list(req, res, next) {
    try {
      const query = req.query;
      const { page, pageSize, offset } = paginate(query.page, query.page_size);
      const result = await orderService.getOrderList(req.user.id, {
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

  async refund(req, res, next) {
    try {
      const result = await orderService.requestRefund(req.user.id, req.params.id);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async wechatCallback(req, res, next) {
    try {
      // 微信支付 V3 回调：JSON 格式 + AES-GCM 加密
      const callbackData = await wechatPayClient.processCallback(
        req.headers,
        JSON.stringify(req.body)
      );

      await orderService.handlePaymentCallback(callbackData);

      // V3 返回 JSON 响应
      res.json({ code: 'SUCCESS', message: 'OK' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = orderController;
