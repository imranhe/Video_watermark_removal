jest.mock('../../../src/models/task.model');
jest.mock('../../../src/models/points-log.model');
jest.mock('../../../src/models/system-config.model');
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/integrations/aliyun-oss');
jest.mock('../../../src/jobs/task-processor');
jest.mock('../../../src/utils/logger');

const taskService = require('../../../src/services/task.service');
const taskModel = require('../../../src/models/task.model');
const pointsLogModel = require('../../../src/models/points-log.model');
const userModel = require('../../../src/models/user.model');
const { taskQueueManager } = require('../../../src/jobs/task-processor');

describe('TaskService', () => {
  const userId = 'user-123';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    const mockUser = {
      id: userId,
      balance: 100,
      vip_type: 'none',
      vip_expire_at: null,
      total_tasks: 0,
    };

    const mockTask = {
      id: 'task-123',
      user_id: userId,
      video_url: '/uploads/video.mp4',
      task_type: 'subtitle',
      status: 'pending',
      progress: 0,
      points_cost: 10,
      created_at: new Date(),
    };

    test('普通用户创建任务需扣积分', async () => {
      userModel.findById.mockResolvedValue(mockUser);
      pointsLogModel.deductPoints.mockResolvedValue({ balance: 90 });
      taskModel.create.mockResolvedValue(mockTask);
      userModel.update.mockResolvedValue({});
      taskQueueManager.addTask.mockResolvedValue('job-123');

      const result = await taskService.createTask(userId, 'subtitle', {
        path: '/uploads/video.mp4',
        originalname: 'video.mp4',
      });

      expect(pointsLogModel.deductPoints).toHaveBeenCalledWith(
        userId, 10, expect.any(String), null
      );
      expect(taskModel.create).toHaveBeenCalled();
      expect(result.id).toBe('task-123');
      expect(result.status).toBe('pending');
      expect(result.points_cost).toBe(10);
    });

    test('VIP 用户不扣积分', async () => {
      const vipUser = {
        ...mockUser,
        vip_type: 'monthly',
        vip_expire_at: new Date(Date.now() + 86400000), // 明天过期
      };
      userModel.findById.mockResolvedValue(vipUser);
      taskModel.create.mockResolvedValue({ ...mockTask, points_cost: 0 });
      userModel.update.mockResolvedValue({});
      taskQueueManager.addTask.mockResolvedValue('job-123');

      const result = await taskService.createTask(userId, 'subtitle', {
        path: '/uploads/video.mp4',
        originalname: 'video.mp4',
      });

      expect(pointsLogModel.deductPoints).not.toHaveBeenCalled();
      expect(result.points_cost).toBe(0);
    });

    test('积分不足时抛出错误码 1003', async () => {
      userModel.findById.mockResolvedValue(mockUser);
      const error = new Error('积分不足');
      error.code = 1003;
      pointsLogModel.deductPoints.mockRejectedValue(error);

      await expect(
        taskService.createTask(userId, 'subtitle', {
          path: '/uploads/video.mp4',
          originalname: 'video.mp4',
        })
      ).rejects.toMatchObject({ code: 1003 });
    });

    test('用户不存在时抛出错误码 1002', async () => {
      userModel.findById.mockResolvedValue(null);

      await expect(
        taskService.createTask(userId, 'subtitle', {
          path: '/uploads/video.mp4',
          originalname: 'video.mp4',
        })
      ).rejects.toMatchObject({ code: 1002 });
    });
  });

  describe('getTaskDetail', () => {
    test('返回任务详情 DTO', async () => {
      const task = {
        id: 'task-123',
        user_id: userId,
        video_url: '/uploads/video.mp4',
        result_url: '/uploads/result.mp4',
        task_type: 'subtitle',
        status: 'completed',
        progress: 100,
        points_cost: 10,
        params: '{"region": {"x": 0, "y": 0}}',
        error_message: null,
        retry_count: 0,
        priority: 0,
        created_at: new Date(),
        completed_at: new Date(),
      };
      taskModel.findById.mockResolvedValue(task);

      const result = await taskService.getTaskDetail('task-123', userId);

      expect(result.id).toBe('task-123');
      expect(result.status).toBe('completed');
      expect(result.params).toEqual({ region: { x: 0, y: 0 } });
    });

    test('任务不存在时抛出错误码 1004', async () => {
      taskModel.findById.mockResolvedValue(null);

      await expect(
        taskService.getTaskDetail('non-existent', userId)
      ).rejects.toMatchObject({ code: 1004 });
    });

    test('非任务所有者抛出错误码 1004', async () => {
      taskModel.findById.mockResolvedValue({ id: 'task-123', user_id: 'other-user' });

      await expect(
        taskService.getTaskDetail('task-123', userId)
      ).rejects.toMatchObject({ code: 1004 });
    });
  });

  describe('cancelTask', () => {
    test('取消任务并退还积分', async () => {
      const task = {
        id: 'task-123',
        user_id: userId,
        status: 'pending',
        points_cost: 10,
      };
      taskModel.findById.mockResolvedValue(task);
      taskModel.cancel.mockResolvedValue();
      pointsLogModel.addPoints.mockResolvedValue({ balance: 110 });

      const result = await taskService.cancelTask('task-123', userId);

      expect(result.status).toBe('cancelled');
      expect(result.points_refunded).toBe(10);
      expect(taskModel.cancel).toHaveBeenCalledWith('task-123');
      expect(pointsLogModel.addPoints).toHaveBeenCalledWith(
        userId, 10, expect.any(String), null
      );
    });

    test('已完成的任务不能取消', async () => {
      taskModel.findById.mockResolvedValue({
        id: 'task-123',
        user_id: userId,
        status: 'completed',
      });

      await expect(
        taskService.cancelTask('task-123', userId)
      ).rejects.toMatchObject({ code: 400 });
    });
  });

  describe('getTaskList', () => {
    test('返回分页任务列表', async () => {
      const tasks = [{ id: 'task-1' }, { id: 'task-2' }];
      taskModel.findByUser.mockResolvedValue({ list: tasks, total: 2 });

      const result = await taskService.getTaskList(userId, { page: 1, pageSize: 20 });

      expect(result.list).toEqual(tasks);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });
  });
});
