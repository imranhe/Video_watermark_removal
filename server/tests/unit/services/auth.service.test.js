jest.mock('../../../src/models/user.model');
jest.mock('../../../src/utils/wechat');
jest.mock('../../../src/utils/jwt');
jest.mock('../../../src/utils/logger');

const authService = require('../../../src/services/auth.service');
const userModel = require('../../../src/models/user.model');
const { code2Session } = require('../../../src/utils/wechat');
const { generateAccessToken, generateRefreshToken, getExpiresInSeconds } = require('../../../src/utils/jwt');

describe('AuthService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-123',
      openid: 'openid-123',
      nickname: '测试用户',
      avatar_url: 'https://example.com/avatar.jpg',
      balance: 30,
      vip_type: 'none',
      vip_expire_at: null,
      created_at: new Date(),
    };

    test('已有用户登录返回用户信息和令牌', async () => {
      code2Session.mockResolvedValue({ openid: 'openid-123' });
      userModel.findByOpenid.mockResolvedValue(mockUser);
      generateAccessToken.mockReturnValue('access-token-123');
      generateRefreshToken.mockReturnValue('refresh-token-123');
      getExpiresInSeconds.mockReturnValue(3600);

      const result = await authService.login('wx-code-123');

      expect(result.user.id).toBe('user-123');
      expect(result.user.openid).toBe('openid-123');
      expect(result.user.nickname).toBe('测试用户');
      expect(result.token.access_token).toBe('access-token-123');
      expect(result.token.refresh_token).toBe('refresh-token-123');
      expect(result.token.expires_in).toBe(3600);
      expect(code2Session).toHaveBeenCalledWith('wx-code-123');
    });

    test('新用户登录时自动注册', async () => {
      code2Session.mockResolvedValue({ openid: 'new-openid' });
      userModel.findByOpenid.mockResolvedValue(null);
      userModel.create.mockResolvedValue(mockUser);
      generateAccessToken.mockReturnValue('access-token-new');
      generateRefreshToken.mockReturnValue('refresh-token-new');
      getExpiresInSeconds.mockReturnValue(3600);

      const result = await authService.login('wx-code-new');

      expect(userModel.create).toHaveBeenCalledWith({ openid: 'new-openid' });
      expect(result.user.id).toBe('user-123');
    });

    test('微信登录失败时抛出错误码 1001', async () => {
      code2Session.mockRejectedValue(new Error('invalid code'));

      await expect(authService.login('invalid-code')).rejects.toMatchObject({
        code: 1001,
        message: '微信登录失败',
        detail: 'invalid code',
      });
    });
  });

  describe('refreshToken', () => {
    const { verifyToken } = require('../../../src/utils/jwt');

    test('有效刷新令牌返回新 access token', async () => {
      const decoded = { userId: 'user-123', openid: 'openid-123' };
      verifyToken.mockReturnValue(decoded);
      generateAccessToken.mockReturnValue('new-access-token');
      getExpiresInSeconds.mockReturnValue(3600);

      const result = await authService.refreshToken('valid-refresh-token');

      expect(result.access_token).toBe('new-access-token');
      expect(result.expires_in).toBe(3600);
      expect(verifyToken).toHaveBeenCalledWith('valid-refresh-token');
    });

    test('无效或过期的刷新令牌抛出 401', async () => {
      verifyToken.mockReturnValue(null);

      await expect(authService.refreshToken('expired-token')).rejects.toMatchObject({
        code: 401,
        message: '刷新令牌无效或已过期',
      });
    });
  });
});
