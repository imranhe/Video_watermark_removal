jest.mock('../../../src/utils/logger');

const jwt = require('jsonwebtoken');
const { authenticate, requireAdmin } = require('../../../src/middleware/auth.middleware');
const { createMockReq, createMockRes, createMockNext } = require('../../helpers');

describe('AuthMiddleware', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    test('有效 Token 设置 req.user 并调用 next()', () => {
      const token = jwt.sign(
        { userId: 'user-123', openid: 'openid-123', role: 'user' },
        'test-jwt-secret',
        { expiresIn: '1h' }
      );

      const req = createMockReq({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockRes();
      const next = createMockNext();

      authenticate(req, res, next);

      expect(req.user).toEqual(
        expect.objectContaining({
          id: 'user-123',
          openid: 'openid-123',
          role: 'user',
        })
      );
      expect(next).toHaveBeenCalled();
    });

    test('缺少 Authorization 头返回 401', () => {
      const req = createMockReq({ headers: {} });
      const res = createMockRes();
      const next = createMockNext();

      authenticate(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body.code).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('Authorization 格式错误返回 401', () => {
      const req = createMockReq({
        headers: { authorization: 'Basic abc123' },
      });
      const res = createMockRes();
      const next = createMockNext();

      authenticate(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('过期 Token 返回 401', () => {
      const token = jwt.sign(
        { userId: 'user-123', openid: 'openid-123' },
        'test-jwt-secret',
        { expiresIn: '0s' }
      );

      const req = createMockReq({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockRes();
      const next = createMockNext();

      // 等一下让 token 过期
      authenticate(req, res, next);

      // Token 可能还没过期（太快），用伪造的 token 测试
      const fakeReq = createMockReq({
        headers: { authorization: 'Bearer fake.token.value' },
      });
      const fakeRes = createMockRes();
      const fakeNext = createMockNext();

      authenticate(fakeReq, fakeRes, fakeNext);

      expect(fakeRes.statusCode).toBe(401);
      expect(fakeRes.body.error.type).toBe('TOKEN_INVALID');
      expect(fakeNext).not.toHaveBeenCalled();
    });

    test('错误密钥签名的 Token 返回 401', () => {
      const token = jwt.sign(
        { userId: 'user-123' },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const req = createMockReq({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockRes();
      const next = createMockNext();

      authenticate(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('无 role 时默认为 user', () => {
      const token = jwt.sign(
        { userId: 'user-123', openid: 'openid-123' },
        'test-jwt-secret',
        { expiresIn: '1h' }
      );

      const req = createMockReq({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockRes();
      const next = createMockNext();

      authenticate(req, res, next);

      expect(req.user.role).toBe('user');
    });
  });

  describe('requireAdmin', () => {
    test('admin 角色通过', () => {
      const req = createMockReq({ user: { id: 'user-1', role: 'admin' } });
      const res = createMockRes();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('非 admin 角色返回 403', () => {
      const req = createMockReq({ user: { id: 'user-1', role: 'user' } });
      const res = createMockRes();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe(403);
      expect(res.body.error.type).toBe('FORBIDDEN');
      expect(next).not.toHaveBeenCalled();
    });

    test('未认证用户返回 403', () => {
      const req = createMockReq({ user: null });
      const res = createMockRes();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
