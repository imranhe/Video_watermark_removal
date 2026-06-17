const { createMockPool, sampleUser } = require('../../helpers');

jest.mock('../../../src/config/database', () => createMockPool());

const pool = require('../../../src/config/database');
const pointsLogModel = require('../../../src/models/points-log.model');

describe('PointsLogModel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('创建积分日志', async () => {
      pool.query.mockResolvedValue([{ insertId: 1, affectedRows: 1 }, []]);

      const result = await pointsLogModel.create({
        user_id: 'user-id',
        change_amount: -10,
        balance_after: 20,
        type: 'consume',
        description: '处理视频任务',
      });

      expect(result).toHaveProperty('id');
      expect(result.user_id).toBe('user-id');
      expect(result.change_amount).toBe(-10);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO points_logs'),
        expect.arrayContaining(['user-id', null, null, -10, 20, 'consume', '处理视频任务'])
      );
    });
  });

  describe('findByUser', () => {
    test('返回用户积分日志列表', async () => {
      const logs = [
        { id: 'log-1', change_amount: -10, type: 'consume' },
        { id: 'log-2', change_amount: 100, type: 'recharge' },
      ];
      pool.query
        .mockResolvedValueOnce([[{ total: 2 }], []])
        .mockResolvedValue([logs, []]);

      const result = await pointsLogModel.findByUser('user-id');

      expect(result.list).toEqual(logs);
      expect(result.total).toBe(2);
    });

    test('带类型过滤', async () => {
      pool.query
        .mockResolvedValueOnce([[{ total: 1 }], []])
        .mockResolvedValue([[{ id: 'log-1' }], []]);

      await pointsLogModel.findByUser('user-id', { type: 'consume' });

      const countCall = pool.query.mock.calls[0];
      expect(countCall[0]).toContain('type = ?');
      expect(countCall[1]).toContain('consume');
    });

    test('分页参数正确传递', async () => {
      pool.query
        .mockResolvedValueOnce([[{ total: 50 }], []])
        .mockResolvedValue([[], []]);

      await pointsLogModel.findByUser('user-id', {
        page: 2,
        pageSize: 10,
        offset: 10,
      });

      const selectCall = pool.query.mock.calls[1];
      expect(selectCall[1]).toContain(10); // pageSize
      expect(selectCall[1]).toContain(10); // offset
    });
  });

  describe('getBalance', () => {
    test('返回用户余额', async () => {
      pool.query.mockResolvedValue([[{ balance: 100 }], []]);

      const result = await pointsLogModel.getBalance('user-id');

      expect(result).toBe(100);
    });

    test('用户不存在时返回 0', async () => {
      pool.query.mockResolvedValue([[], []]);

      const result = await pointsLogModel.getBalance('non-existent');

      expect(result).toBe(0);
    });
  });

  describe('getSummary', () => {
    test('返回积分汇总', async () => {
      const summary = { total_earned: 500, total_spent: 200 };
      pool.query.mockResolvedValue([[summary], []]);

      const result = await pointsLogModel.getSummary('user-id');

      expect(result).toEqual(summary);
    });
  });

  describe('deductPoints (事务)', () => {
    test('成功扣减积分', async () => {
      const conn = pool._mockConn;
      conn.query
        .mockResolvedValueOnce([[{ id: 'user-id', balance: 100, version: 1 }], []]) // SELECT FOR UPDATE
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]) // UPDATE balance
        .mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }, []]); // INSERT log

      const result = await pointsLogModel.deductPoints('user-id', 10, '处理视频任务');

      expect(result.balance).toBe(90);
      expect(result).toHaveProperty('logId');
      expect(conn.beginTransaction).toHaveBeenCalled();
      expect(conn.commit).toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalled();
    });

    test('积分不足时抛出错误', async () => {
      const conn = pool._mockConn;
      conn.query.mockResolvedValueOnce([
        [{ id: 'user-id', balance: 5, version: 1 }],
        [],
      ]);

      await expect(
        pointsLogModel.deductPoints('user-id', 10, '处理视频任务')
      ).rejects.toMatchObject({
        code: 1003,
        message: '积分不足',
      });

      expect(conn.rollback).toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalled();
    });

    test('用户不存在时抛出错误', async () => {
      const conn = pool._mockConn;
      conn.query.mockResolvedValueOnce([[], []]);

      await expect(
        pointsLogModel.deductPoints('non-existent', 10, '处理视频任务')
      ).rejects.toMatchObject({
        code: 1002,
        message: '用户不存在',
      });

      expect(conn.rollback).toHaveBeenCalled();
    });

    test('乐观锁冲突时抛出并发错误', async () => {
      const conn = pool._mockConn;
      conn.query
        .mockResolvedValueOnce([[{ id: 'user-id', balance: 100, version: 1 }], []]) // SELECT FOR UPDATE
        .mockResolvedValueOnce([{ affectedRows: 0 }, []]); // UPDATE 失败 (version 不匹配)

      await expect(
        pointsLogModel.deductPoints('user-id', 10, '处理视频任务')
      ).rejects.toThrow('并发更新失败');

      expect(conn.rollback).toHaveBeenCalled();
    });
  });

  describe('addPoints (事务)', () => {
    test('成功充值积分', async () => {
      const conn = pool._mockConn;
      conn.query
        .mockResolvedValueOnce([[{ id: 'user-id', balance: 50 }], []]) // SELECT FOR UPDATE
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]) // UPDATE balance
        .mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }, []]); // INSERT log

      const result = await pointsLogModel.addPoints('user-id', 100, '购买套餐充值');

      expect(result.balance).toBe(150);
      expect(result).toHaveProperty('logId');
      expect(conn.beginTransaction).toHaveBeenCalled();
      expect(conn.commit).toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalled();
    });

    test('用户不存在时抛出错误', async () => {
      const conn = pool._mockConn;
      conn.query.mockResolvedValueOnce([[], []]);

      await expect(
        pointsLogModel.addPoints('non-existent', 100, '充值')
      ).rejects.toMatchObject({
        code: 1002,
        message: '用户不存在',
      });

      expect(conn.rollback).toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalled();
    });

    test('关联订单 ID', async () => {
      const conn = pool._mockConn;
      conn.query
        .mockResolvedValueOnce([[{ id: 'user-id', balance: 50 }], []])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }, []]);

      await pointsLogModel.addPoints('user-id', 100, '购买套餐', 'order-id');

      const insertCall = conn.query.mock.calls[2];
      expect(insertCall[1]).toContain('order-id');
      expect(insertCall[0]).toContain('type, description');
    });
  });
});
