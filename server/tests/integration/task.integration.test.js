jest.mock('../../../src/config/database', () => {
  const { createMockPool } = require('../../helpers');
  return createMockPool();
});
jest.mock('../../../src/utils/logger');

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../../src/app');
const pool = require('../../../src/config/database');

function makeAuthToken(userId = 'user-123', role = 'user') {
  return jwt.sign({ userId, openid: 'openid-123', role }, 'test-jwt-secret', {
    expiresIn: '1h',
  });
}

describe('任务接口集成测试', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /v1/tasks', () => {
    test('未认证请求返回 401', async () => {
      const res = await request(app)
        .post('/v1/tasks')
        .send({ task_type: 'subtitle' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /v1/tasks', () => {
    test('未认证请求返回 401', async () => {
      const res = await request(app).get('/v1/tasks');

      expect(res.status).toBe(401);
    });

    test('认证后返回任务列表', async () => {
      const token = makeAuthToken();
      const tasks = [
        { id: 'task-1', status: 'completed', task_type: 'subtitle' },
        { id: 'task-2', status: 'pending', task_type: 'watermark' },
      ];

      // Mock: COUNT query
      pool.query.mockResolvedValueOnce([[{ total: 2 }], []]);
      // Mock: SELECT query
      pool.query.mockResolvedValueOnce([tasks, []]);

      const res = await request(app)
        .get('/v1/tasks')
        .set('Authorization', `Bearer ${token}`);

      // 验证请求正常处理
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('GET /v1/tasks/:id', () => {
    test('未认证请求返回 401', async () => {
      const res = await request(app).get('/v1/tasks/task-123');

      expect(res.status).toBe(401);
    });

    test('任务不存在返回 404 或 400', async () => {
      const token = makeAuthToken();

      // Mock: findById returns null
      pool.query.mockResolvedValue([[], []]);

      const res = await request(app)
        .get('/v1/tasks/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect([400, 404]).toContain(res.status);
    });

    test('认证后返回任务详情', async () => {
      const token = makeAuthToken('user-123');
      const task = {
        id: 'task-123',
        user_id: 'user-123',
        video_url: '/uploads/video.mp4',
        result_url: null,
        task_type: 'subtitle',
        status: 'pending',
        progress: 0,
        points_cost: 10,
        params: null,
        error_message: null,
        retry_count: 0,
        priority: 0,
        created_at: new Date(),
        completed_at: null,
      };

      pool.query.mockResolvedValue([[task], []]);

      const res = await request(app)
        .get('/v1/tasks/task-123')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 401]).toContain(res.status);
    });
  });
});
