jest.mock('../../../src/models/order.model');
jest.mock('../../../src/models/package.model');
jest.mock('../../../src/models/points-log.model');
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/utils/payment');
jest.mock('../../../src/utils/logger');

const orderService = require('../../../src/services/order.service');
const orderModel = require('../../../src/models/order.model');
const packageModel = require('../../../src/models/package.model');
const pointsLogModel = require('../../../src/models/points-log.model');
const userModel = require('../../../src/models/user.model');
const wechatPayClient = require('../../../src/utils/payment');

describe('OrderService', () => {
  const userId = 'user-123';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const mockPkg = {
      id: 'pkg-123',
      name: '基础套餐',
      type: 'points',
      price: 9.9,
      credits: 100,
      is_active: true,
    };

    const mockUser = {
      id: userId,
      openid: 'openid-123',
    };

    test('创建订单成功', async () => {
      const mockOrder = {
        id: 'order-123',
        order_no: 'ORD202401010001',
        user_id: userId,
        package_id: 'pkg-123',
        package_name: '基础套餐',
        amount: 9.9,
        credits: 100,
        status: 'pending',
        payment_method: 'wechat',
        payment_params: '{"prepay_id": "wx123"}',
        created_at: new Date(),
      };

      packageModel.findById.mockResolvedValue(mockPkg);
      userModel.findById.mockResolvedValue(mockUser);
      wechatPayClient.createPayment.mockResolvedValue({ prepay_id: 'wx123' });
      orderModel.create.mockResolvedValue(mockOrder);

      const result = await orderService.createOrder(userId, 'pkg-123', 'wechat');

      expect(result.id).toBe('order-123');
      expect(result.amount).toBe(9.9);
      expect(result.credits).toBe(100);
      expect(result.status).toBe('pending');
      expect(wechatPayClient.createPayment).toHaveBeenCalled();
    });

    test('套餐不存在时抛出错误码 1008', async () => {
      packageModel.findById.mockResolvedValue(null);

      await expect(
        orderService.createOrder(userId, 'non-existent-pkg', 'wechat')
      ).rejects.toMatchObject({ code: 1008 });
    });

    test('套餐已下架时抛出错误码 1008', async () => {
      packageModel.findById.mockResolvedValue({ ...mockPkg, is_active: false });

      await expect(
        orderService.createOrder(userId, 'pkg-123', 'wechat')
      ).rejects.toMatchObject({ code: 1008 });
    });

    test('用户不存在时抛出错误码 1002', async () => {
      packageModel.findById.mockResolvedValue(mockPkg);
      userModel.findById.mockResolvedValue(null);

      await expect(
        orderService.createOrder(userId, 'pkg-123', 'wechat')
      ).rejects.toMatchObject({ code: 1002 });
    });
  });

  describe('handlePaymentCallback', () => {
    test('支付成功后标记订单已支付并充值积分', async () => {
      const order = {
        id: 'order-123',
        order_no: 'ORD202401010001',
        user_id: userId,
        package_id: 'pkg-123',
        package_name: '基础套餐',
        amount: 9.9,
        credits: 100,
        status: 'pending',
      };

      orderModel.findByOrderNo.mockResolvedValue(order);
      orderModel.markPaid.mockResolvedValue();
      pointsLogModel.addPoints.mockResolvedValue({ balance: 130 });
      packageModel.findById.mockResolvedValue({
        id: 'pkg-123',
        type: 'points',
        duration_days: null,
      });

      await orderService.handlePaymentCallback({
        transaction_id: 'txn-123',
        out_trade_no: 'ORD202401010001',
      });

      expect(orderModel.markPaid).toHaveBeenCalledWith('order-123', 'txn-123');
      expect(pointsLogModel.addPoints).toHaveBeenCalledWith(
        userId, 100, expect.any(String), 'order-123'
      );
    });

    test('订单不存在时静默返回', async () => {
      orderModel.findByOrderNo.mockResolvedValue(null);

      await orderService.handlePaymentCallback({
        transaction_id: 'txn-123',
        out_trade_no: 'NON_EXISTENT',
      });

      expect(orderModel.markPaid).not.toHaveBeenCalled();
    });

    test('已支付订单不再处理', async () => {
      orderModel.findByOrderNo.mockResolvedValue({
        id: 'order-123',
        status: 'paid',
      });

      await orderService.handlePaymentCallback({
        transaction_id: 'txn-123',
        out_trade_no: 'ORD202401010001',
      });

      expect(orderModel.markPaid).not.toHaveBeenCalled();
    });
  });

  describe('getOrderDetail', () => {
    test('返回订单详情', async () => {
      const order = {
        id: 'order-123',
        order_no: 'ORD202401010001',
        user_id: userId,
        package_id: 'pkg-123',
        package_name: '基础套餐',
        amount: 9.9,
        credits: 100,
        status: 'paid',
        payment_method: 'wechat',
        transaction_id: 'txn-123',
        paid_at: new Date(),
        created_at: new Date(),
      };
      orderModel.findById.mockResolvedValue(order);

      const result = await orderService.getOrderDetail('order-123', userId);

      expect(result.id).toBe('order-123');
      expect(result.status).toBe('paid');
    });

    test('订单不存在时抛出 404', async () => {
      orderModel.findById.mockResolvedValue(null);

      await expect(
        orderService.getOrderDetail('non-existent', userId)
      ).rejects.toMatchObject({ code: 404 });
    });
  });
});
