const orderService = require('../services/order.service');
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

  async wechatCallback(req, res, next) {
    try {
      // 解析微信支付回调 XML
      const xmlData = req.body.toString();
      const { parsePaymentCallback } = require('../utils/payment');
      const callbackData = parsePaymentCallback(xmlData);

      await orderService.handlePaymentCallback(callbackData);

      // 返回成功响应 XML
      res.set('Content-Type', 'text/xml');
      res.send(`<xml>
        <return_code><![CDATA[SUCCESS]]></return_code>
        <return_msg><![CDATA[OK]]></return_msg>
      </xml>`);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = orderController;
