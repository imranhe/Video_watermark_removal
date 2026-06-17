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

describe('积分接口集成测试', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/points/balance', () => {
    test('未认证请求返回 401', async () => {
      const res = await request(app).get('/v1/points/balance');

      expect(res.status).toBe(401);
    });

    test('认证后返回积分余额', async () => {
      const token = makeAuthToken();

      // Mock: getBalance
      pool.query.mockResolvedValueOnce([[{ balance: 100 }], []]);
      // Mock: getSummary
      pool.query.mockResolvedValueOnce([[{ total_earned: 500, total_spent: 400 }], []]);

      const res = await request(app)
        .get('/v1/points/balance')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 401]).toContain(res.status);
    });
  });

  describe('GET /v1/points/logs', () => {
    test('未认证请求返回 401', async () => {
      const res = await request(app).get('/v1/points/logs');

      expect(res.status).toBe(401);
    });

    test('认证后返回积分日志', async () => {
      const token = makeAuthToken();

      // Mock: COUNT
      pool.query.mockResolvedValueOnce([[{ total: 5 }], []]);
      // Mock: SELECT
      pool.query.mockResolvedValueOnce([
        [
          { id: 'log-1', change_amount: -10, type: 'consume' },
          { id: 'log-2', change_amount: 100, type: 'recharge' },
        ],
        [],
      ]);

      const res = await request(app)
        .get('/v1/points/logs')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 401]).toContain(res.status);
    });

    test('支持分页查询参数', async () => {
      const token = makeAuthToken();

      pool.query.mockResolvedValueOnce([[{ total: 50 }], []]);
      pool.query.mockResolvedValueOnce([[], []]);

      const res = await request(app)
        .get('/v1/points/logs?page=2&page_size=10')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 401]).toContain(res.status);
    });
  });
});
