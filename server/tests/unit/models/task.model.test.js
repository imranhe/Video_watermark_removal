const { createMockPool, sampleTask } = require('../../helpers');

jest.mock('../../../src/config/database', () => createMockPool());

const pool = require('../../../src/config/database');
const taskModel = require('../../../src/models/task.model');

describe('TaskModel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('创建任务并返回完整数据', async () => {
      const task = sampleTask();
      pool.query
        .mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }, []]) // INSERT
        .mockResolvedValue([[task], []]); // findById

      const result = await taskModel.create({
        user_id: task.user_id,
        video_url: task.video_url,
        task_type: 'subtitle',
        points_cost: 10,
      });

      expect(result).toEqual(task);
      const insertCall = pool.query.mock.calls[0];
      expect(insertCall[0]).toContain('INSERT INTO tasks');
      expect(insertCall[1]).toContain(task.user_id);
      expect(insertCall[1]).toContain(task.video_url);
      expect(insertCall[1]).toContain('subtitle');
    });

    test('params 使用 JSON.stringify 序列化', async () => {
      const task = sampleTask();
      const params = { x: 10, y: 20, width: 100, height: 50 };

      pool.query
        .mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }, []])
        .mockResolvedValue([[task], []]);

      await taskModel.create({
        user_id: task.user_id,
        video_url: task.video_url,
        task_type: 'subtitle',
        params,
      });

      const insertCall = pool.query.mock.calls[0];
      expect(insertCall[1]).toContain(JSON.stringify(params));
    });

    test('params 为 null 时不序列化', async () => {
      const task = sampleTask();
      pool.query
        .mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }, []])
        .mockResolvedValue([[task], []]);

      await taskModel.create({
        user_id: task.user_id,
        video_url: task.video_url,
        task_type: 'subtitle',
      });

      const insertCall = pool.query.mock.calls[0];
      expect(insertCall[1]).toContain(null);
    });
  });

  describe('findById', () => {
    test('返回任务数据', async () => {
      const task = sampleTask();
      pool.query.mockResolvedValue([[task], []]);

      const result = await taskModel.findById(task.id);

      expect(result).toEqual(task);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('deleted_at IS NULL'),
        [task.id]
      );
    });

    test('软删除的任务不会被查到', async () => {
      pool.query.mockResolvedValue([[], []]);

      const result = await taskModel.findById('deleted-task-id');

      expect(result).toBeNull();
    });
  });

  describe('findByUser', () => {
    test('返回用户任务列表和总数', async () => {
      const tasks = [sampleTask(), sampleTask()];
      pool.query
        .mockResolvedValueOnce([[{ total: 2 }], []]) // COUNT
        .mockResolvedValue([tasks, []]); // SELECT

      const result = await taskModel.findByUser('user-id', {
        page: 1,
        pageSize: 20,
        offset: 0,
      });

      expect(result.list).toEqual(tasks);
      expect(result.total).toBe(2);
    });

    test('带状态过滤', async () => {
      pool.query
        .mockResolvedValueOnce([[{ total: 1 }], []])
        .mockResolvedValue([[sampleTask()], []]);

      await taskModel.findByUser('user-id', { status: 'completed' });

      const countCall = pool.query.mock.calls[0];
      expect(countCall[0]).toContain('status = ?');
      expect(countCall[1]).toContain('completed');
    });

    test('带任务类型过滤', async () => {
      pool.query
        .mockResolvedValueOnce([[{ total: 1 }], []])
        .mockResolvedValue([[sampleTask()], []]);

      await taskModel.findByUser('user-id', { task_type: 'watermark' });

      const countCall = pool.query.mock.calls[0];
      expect(countCall[0]).toContain('task_type = ?');
      expect(countCall[1]).toContain('watermark');
    });

    test('分页参数正确传递', async () => {
      pool.query
        .mockResolvedValueOnce([[{ total: 50 }], []])
        .mockResolvedValue([[], []]);

      await taskModel.findByUser('user-id', {
        page: 2,
        pageSize: 10,
        offset: 10,
      });

      const selectCall = pool.query.mock.calls[1];
      expect(selectCall[0]).toContain('LIMIT ? OFFSET ?');
      expect(selectCall[1]).toContain(10); // pageSize
      expect(selectCall[1]).toContain(10); // offset
    });
  });

  describe('update', () => {
    test('更新任务状态', async () => {
      const task = sampleTask({ status: 'processing' });
      pool.query
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValue([[task], []]);

      await taskModel.update(task.id, { status: 'processing' });

      const updateCall = pool.query.mock.calls[0];
      expect(updateCall[0]).toContain('status = ?');
      expect(updateCall[0]).toContain('version = version + 1');
    });

    test('使用乐观锁更新', async () => {
      const task = sampleTask({ version: 2 });
      pool.query
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValue([[task], []]);

      await taskModel.update(task.id, {
        status: 'completed',
        expected_version: 1,
      });

      const updateCall = pool.query.mock.calls[0];
      expect(updateCall[0]).toContain('WHERE id = ? AND version = ?');
      expect(updateCall[1]).toContain(1); // expected_version
      expect(updateCall[1]).toContain(2); // expected_version + 1
    });

    test('无字段更新时直接返回 findById 结果', async () => {
      const task = sampleTask();
      pool.query.mockResolvedValue([[task], []]);

      const result = await taskModel.update(task.id, {});

      expect(result).toEqual(task);
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('softDelete', () => {
    test('软删除任务', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 1 }, []]);

      await taskModel.softDelete('task-id');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('deleted_at = NOW()'),
        ['task-id']
      );
    });
  });

  describe('cancel', () => {
    test('取消任务', async () => {
      pool.query.mockResolvedValue([{ affectedRows: 1 }, []]);

      await taskModel.cancel('task-id');

      const call = pool.query.mock.calls[0];
      expect(call[0]).toContain("status = 'cancelled'");
      expect(call[0]).toContain("status IN ('pending', 'processing')");
    });
  });

  describe('getProcessingCount', () => {
    test('返回处理中的任务数量', async () => {
      pool.query.mockResolvedValue([[{ count: 3 }], []]);

      const result = await taskModel.getProcessingCount('user-id');

      expect(result).toBe(3);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("status IN ('pending', 'processing')"),
        ['user-id']
      );
    });
  });

  describe('getProgress', () => {
    test('返回任务进度信息', async () => {
      const progressData = {
        id: 'task-id',
        status: 'processing',
        progress: 50,
        elapsed: 30,
        updated_at: new Date(),
      };
      pool.query.mockResolvedValue([[progressData], []]);

      const result = await taskModel.getProgress('task-id');

      expect(result.id).toBe('task-id');
      expect(result.status).toBe('processing');
      expect(result.progress).toBe(50);
      expect(result.estimated_time).toBeDefined();
    });

    test('任务不存在时返回 null', async () => {
      pool.query.mockResolvedValue([[], []]);

      const result = await taskModel.getProgress('non-existent');

      expect(result).toBeNull();
    });
  });
});
