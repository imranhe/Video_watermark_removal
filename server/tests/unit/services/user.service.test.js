jest.mock('../../../src/models/user.model');
jest.mock('../../../src/utils/logger');

const userService = require('../../../src/services/user.service');
const userModel = require('../../../src/models/user.model');

describe('UserService', () => {
  const userId = 'user-123';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserInfo', () => {
    test('返回用户信息 DTO', async () => {
      const user = {
        id: userId,
        openid: 'openid-123',
        nickname: '测试用户',
        avatar_url: 'https://example.com/avatar.jpg',
        phone: '13800138000',
        balance: 50,
        vip_type: 'monthly',
        vip_expire_at: new Date('2024-12-31'),
        total_tasks: 10,
        total_spent: 100,
        created_at: new Date(),
        updated_at: new Date(),
      };
      userModel.findById.mockResolvedValue(user);

      const result = await userService.getUserInfo(userId);

      expect(result.id).toBe(userId);
      expect(result.nickname).toBe('测试用户');
      expect(result.balance).toBe(50);
      expect(result.vip_type).toBe('monthly');
    });

    test('用户不存在时抛出错误码 1002', async () => {
      userModel.findById.mockResolvedValue(null);

      await expect(
        userService.getUserInfo('non-existent')
      ).rejects.toMatchObject({
        code: 1002,
        message: '用户不存在',
      });
    });
  });

  describe('updateUser', () => {
    test('更新用户信息并返回', async () => {
      const user = { id: userId };
      const updatedUser = {
        id: userId,
        nickname: '新昵称',
        avatar_url: 'https://new-avatar.jpg',
        phone: '13900139000',
        updated_at: new Date(),
      };
      userModel.findById.mockResolvedValue(user);
      userModel.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUser(userId, {
        nickname: '新昵称',
        avatar_url: 'https://new-avatar.jpg',
        phone: '13900139000',
      });

      expect(result.nickname).toBe('新昵称');
      expect(result.avatar_url).toBe('https://new-avatar.jpg');
      expect(userModel.update).toHaveBeenCalledWith(userId, {
        nickname: '新昵称',
        avatar_url: 'https://new-avatar.jpg',
        phone: '13900139000',
      });
    });

    test('用户不存在时抛出错误码 1002', async () => {
      userModel.findById.mockResolvedValue(null);

      await expect(
        userService.updateUser('non-existent', { nickname: 'test' })
      ).rejects.toMatchObject({ code: 1002 });
    });
  });

  describe('getUserStats', () => {
    test('返回用户统计信息', async () => {
      userModel.findById.mockResolvedValue({ id: userId });
      userModel.getStats.mockResolvedValue({
        total_tasks: 20,
        completed_tasks: 15,
        failed_tasks: 5,
        total_points_used: -200,
        total_points_recharged: 500,
        balance: 300,
        vip_type: 'none',
        vip_expire_at: null,
      });

      const result = await userService.getUserStats(userId);

      expect(result.total_tasks).toBe(20);
      expect(result.completed_tasks).toBe(15);
      expect(result.failed_tasks).toBe(5);
      expect(result.total_points_used).toBe(200); // 取绝对值
      expect(result.total_points_recharged).toBe(500);
      expect(result.current_balance).toBe(300);
    });

    test('用户不存在时抛出错误码 1002', async () => {
      userModel.findById.mockResolvedValue(null);

      await expect(
        userService.getUserStats('non-existent')
      ).rejects.toMatchObject({ code: 1002 });
    });
  });
});
