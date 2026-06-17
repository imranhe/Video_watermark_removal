const { createMockPool, sampleUser } = require('../../helpers');

jest.mock('../../../src/config/database', () => createMockPool());

const pool = require('../../../src/config/database');
const userModel = require('../../../src/models/user.model');

describe('UserModel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    test('存在用户时返回用户数据', async () => {
      const user = sampleUser();
      pool.query.mockResolvedValue([[user], []]);

      const result = await userModel.findById(user.id);

      expect(result).toEqual(user);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ? LIMIT 1',
        [user.id]
      );
    });

    test('不存在用户时返回 null', async () => {
      pool.query.mockResolvedValue([[], []]);

      const result = await userModel.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByOpenid', () => {
    test('存在用户时返回用户数据', async () => {
      const user = sampleUser();
      pool.query.mockResolvedValue([[user], []]);

      const result = await userModel.findByOpenid(user.openid);

      expect(result).toEqual(user);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE openid = ? LIMIT 1',
        [user.openid]
      );
    });

    test('不存在用户时返回 null', async () => {
      pool.query.mockResolvedValue([[], []]);

      const result = await userModel.findByOpenid('non-existent-openid');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    test('使用默认值创建用户', async () => {
      const newUser = sampleUser();
      pool.query
        .mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }, []]) // INSERT
        .mockResolvedValue([[newUser], []]); // findById

      const result = await userModel.create({ openid: newUser.openid });

      expect(pool.query).toHaveBeenCalledTimes(2);
      // 验证 INSERT SQL 包含正确字段
      const insertCall = pool.query.mock.calls[0];
      expect(insertCall[0]).toContain('INSERT INTO users');
      expect(insertCall[1]).toContain(newUser.openid);
      expect(insertCall[1]).toContain('微信用户'); // 默认昵称
      expect(insertCall[1]).toContain(30); // 默认积分
      expect(insertCall[1]).toContain('none'); // 默认 vip_type
    });

    test('使用自定义数据创建用户', async () => {
      const customUser = sampleUser({ nickname: '自定义昵称', balance: 100 });
      pool.query
        .mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }, []])
        .mockResolvedValue([[customUser], []]);

      await userModel.create({
        openid: customUser.openid,
        nickname: '自定义昵称',
        balance: 100,
      });

      const insertCall = pool.query.mock.calls[0];
      expect(insertCall[1]).toContain('自定义昵称');
      expect(insertCall[1]).toContain(100);
    });
  });

  describe('update', () => {
    test('更新指定字段', async () => {
      const userId = 'test-user-id';
      const updatedUser = sampleUser({ id: userId, nickname: '新昵称' });

      pool.query
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]) // UPDATE
        .mockResolvedValue([[updatedUser], []]); // findById

      const result = await userModel.update(userId, { nickname: '新昵称' });

      expect(result).toEqual(updatedUser);
      const updateCall = pool.query.mock.calls[0];
      expect(updateCall[0]).toContain('UPDATE users SET');
      expect(updateCall[0]).toContain('nickname = ?');
      expect(updateCall[0]).toContain('updated_at = NOW()');
    });

    test('无字段更新时直接返回 findById 结果', async () => {
      const user = sampleUser();
      pool.query.mockResolvedValue([[user], []]);

      const result = await userModel.update(user.id, {});

      expect(result).toEqual(user);
      // 只调用 findById 一次
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    test('同时更新多个字段', async () => {
      const userId = 'test-user-id';
      const updatedUser = sampleUser({ id: userId });

      pool.query
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValue([[updatedUser], []]);

      await userModel.update(userId, {
        nickname: '新昵称',
        avatar_url: 'https://new-avatar.jpg',
        balance: 200,
      });

      const updateCall = pool.query.mock.calls[0];
      expect(updateCall[0]).toContain('nickname = ?');
      expect(updateCall[0]).toContain('avatar_url = ?');
      expect(updateCall[0]).toContain('balance = ?');
    });
  });

  describe('getStats', () => {
    test('返回用户统计信息', async () => {
      const stats = {
        balance: 50,
        vip_type: 'none',
        vip_expire_at: null,
        total_tasks: 10,
        total_spent: 100,
        completed_tasks: 8,
        failed_tasks: 2,
        total_points_used: -100,
        total_points_recharged: 180,
      };
      pool.query.mockResolvedValue([[stats], []]);

      const result = await userModel.getStats('user-id');

      expect(result).toEqual(stats);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['user-id'])
      );
    });

    test('用户不存在时返回 null', async () => {
      pool.query.mockResolvedValue([[], []]);

      const result = await userModel.getStats('non-existent-id');

      expect(result).toBeNull();
    });
  });
});
