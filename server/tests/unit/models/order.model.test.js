const { createMockPool, sampleOrder } = require('../../helpers');

jest.mock('../../../src/config/database', () => createMockPool());

const pool = require('../../../src/config/database');
const orderModel = require('../../../src/models/order.model');

describe('OrderModel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('创建订单并返回完整数据', async () => {
      const order = sampleOrder();
      pool.query
        .mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }, []]) // INSERT
        .mockResolvedValue([[order], []]); // findById

      const result = await orderModel.create({
        user_id: order.user_id,
        package_id: order.package_id,
        package_name: order.package_name,
        amount: order.amount,
        credits: order.credits,
        payment_method: 'wechat',
      });

      expect(result).toEqual(order);
      const insertCall = pool.query.mock.calls[0];
      expect(insertCall[0]).toContain('INSERT INTO orders');
      expect(insertCall[1]).toContain(order.user_id);
      expect(insertCall[1]).toContain(order.package_id);
      expect(insertCall[1]).toContain(order.amount);
    });

    test('payment_params 使用 JSON.stringify 序列化', async () => {
      const order = sampleOrder();
      const paymentParams = { prepay_id: 'wx123456', nonce_str: 'abc' };

      pool.query
        .mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }, []])
        .mockResolvedValue([[order], []]);

      await orderModel.create({
        user_id: order.user_id,
        package_id: order.package_id,
        package_name: order.package_name,
        amount: order.amount,
        credits: order.credits,
        payment_method: 'wechat',
        payment_params: paymentParams,
      });

      const insertCall = pool.query.mock.calls[0];
      expect(insertCall[1]).toContain(JSON.stringify(paymentParams));
    });
  });

  describe('findById', () => {
    test('返回订单数据', async () => {
      const order = sampleOrder();
      pool.query.mockResolvedValue([[order], []]);

      const result = await orderModel.findById(order.id);

      expect(result).toEqual(order);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('deleted_at IS NULL'),
        [order.id]
      );
    });

    test('软删除的订单返回 null', async () => {
      pool.query.mockResolvedValue([[], []]);

      const result = await orderModel.findById('deleted-order-id');

      expect(result).toBeNull();
    });
  });

  describe('findByOrderNo', () => {
    test('通过订单号查找订单', async () => {
      const order = sampleOrder();
      pool.query.mockResolvedValue([[order], []]);

      const result = await orderModel.findByOrderNo(order.order_no);

      expect(result).toEqual(order);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM orders WHERE order_no = ? LIMIT 1',
        [order.order_no]
      );
    });

    test('订单不存在时返回 null', async () => {
      pool.query.mockResolvedValue([[], []]);

      const result = await orderModel.findByOrderNo('NON_EXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('findByUser', () => {
    test('返回用户订单列表和总数', async () => {
      const orders = [sampleOrder(), sampleOrder()];
      pool.query
        .mockResolvedValueOnce([[{ total: 2 }], []]) // COUNT
        .mockResolvedValue([orders, []]); // SELECT

      const result = await orderModel.findByUser('user-id', {
        page: 1,
        pageSize: 20,
        offset: 0,
      });

      expect(result.list).toEqual(orders);
      expect(result.total).toBe(2);
    });

    test('带状态过滤', async () => {
      pool.query
        .mockResolvedValueOnce([[{ total: 1 }], []])
        .mockResolvedValue([[sampleOrder()], []]);

      await orderModel.findByUser('user-id', { status: 'paid' });

      const countCall = pool.query.mock.calls[0];
      expect(countCall[0]).toContain('status = ?');
      expect(countCall[1]).toContain('paid');
    });

    test('分页参数正确传递', async () => {
      pool.query
        .mockResolvedValueOnce([[{ total: 30 }], []])
        .mockResolvedValue([[], []]);

      await orderModel.findByUser('user-id', {
        page: 3,
        pageSize: 10,
        offset: 20,
      });

      const selectCall = pool.query.mock.calls[1];
      expect(selectCall[0]).toContain('LIMIT ? OFFSET ?');
      expect(selectCall[1]).toContain(10); // pageSize
      expect(selectCall[1]).toContain(20); // offset
    });
  });

  describe('update', () => {
    test('更新订单状态', async () => {
      const order = sampleOrder({ status: 'paid' });
      pool.query
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValue([[order], []]);

      await orderModel.update(order.id, { status: 'paid' });

      const updateCall = pool.query.mock.calls[0];
      expect(updateCall[0]).toContain('UPDATE orders SET');
      expect(updateCall[0]).toContain('status = ?');
      expect(updateCall[0]).toContain('version = version + 1');
    });

    test('无字段更新时直接返回 findById 结果', async () => {
      const order = sampleOrder();
      pool.query.mockResolvedValue([[order], []]);

      const result = await orderModel.update(order.id, {});

      expect(result).toEqual(order);
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('markPaid', () => {
    test('标记订单为已支付', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 1 }, []]);

      await orderModel.markPaid('order-id', 'txn_12345');

      const call = pool.query.mock.calls[0];
      expect(call[0]).toContain("status = 'paid'");
      expect(call[0]).toContain('transaction_id = ?');
      expect(call[0]).toContain('paid_at = ?');
      expect(call[1]).toContain('txn_12345');
    });
  });

  describe('getStats', () => {
    test('返回订单统计信息', async () => {
      const stats = {
        total_revenue: 999.9,
        total_orders: 100,
        paid_orders: 80,
      };
      pool.query.mockResolvedValue([[stats], []]);

      const result = await orderModel.getStats();

      expect(result).toEqual(stats);
    });
  });

  describe('getTodayStats', () => {
    test('返回今日订单统计', async () => {
      const stats = {
        total_orders: 10,
        total_revenue: 99.9,
      };
      pool.query.mockResolvedValue([[stats], []]);

      const result = await orderModel.getTodayStats();

      expect(result).toEqual(stats);
    });
  });
});
