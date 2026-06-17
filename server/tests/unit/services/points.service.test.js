jest.mock('../../../src/models/points-log.model');

const pointsService = require('../../../src/services/points.service');
const pointsLogModel = require('../../../src/models/points-log.model');

describe('PointsService', () => {
  const userId = 'user-123';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    test('返回余额和汇总信息', async () => {
      pointsLogModel.getBalance.mockResolvedValue(100);
      pointsLogModel.getSummary.mockResolvedValue({
        total_earned: 500,
        total_spent: 400,
      });

      const result = await pointsService.getBalance(userId);

      expect(result.balance).toBe(100);
      expect(result.total_earned).toBe(500);
      expect(result.total_spent).toBe(400);
      expect(pointsLogModel.getBalance).toHaveBeenCalledWith(userId);
      expect(pointsLogModel.getSummary).toHaveBeenCalledWith(userId);
    });

    test('返回值中的数值为整数类型', async () => {
      pointsLogModel.getBalance.mockResolvedValue(100);
      pointsLogModel.getSummary.mockResolvedValue({
        total_earned: '500',
        total_spent: '400',
      });

      const result = await pointsService.getBalance(userId);

      expect(typeof result.total_earned).toBe('number');
      expect(typeof result.total_spent).toBe('number');
    });
  });

  describe('getLogs', () => {
    test('返回分页积分日志', async () => {
      const logs = [
        { id: 'log-1', change_amount: -10, type: 'consume' },
        { id: 'log-2', change_amount: 100, type: 'recharge' },
      ];
      pointsLogModel.findByUser.mockResolvedValue({ list: logs, total: 2 });

      const result = await pointsService.getLogs(userId, { page: 1, pageSize: 20 });

      expect(result.list).toEqual(logs);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.page_size).toBe(20);
      expect(result.pagination.total_pages).toBe(1);
    });

    test('使用默认分页参数', async () => {
      pointsLogModel.findByUser.mockResolvedValue({ list: [], total: 0 });

      const result = await pointsService.getLogs(userId, {});

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.page_size).toBe(20);
    });

    test('正确计算总页数', async () => {
      pointsLogModel.findByUser.mockResolvedValue({ list: [], total: 55 });

      const result = await pointsService.getLogs(userId, { page: 1, pageSize: 20 });

      expect(result.pagination.total_pages).toBe(3); // ceil(55 / 20) = 3
    });
  });
});
