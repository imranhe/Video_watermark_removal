const Joi = require('joi');
const { validate } = require('../../../src/middleware/validation.middleware');
const { createMockReq, createMockRes, createMockNext } = require('../../helpers');

describe('ValidationMiddleware', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const testSchema = Joi.object({
    name: Joi.string().required().messages({
      'any.required': '名称为必填项',
    }),
    age: Joi.number().min(0).max(150).optional(),
  });

  describe('validate', () => {
    test('有效输入替换 req.body 为验证后的值并调用 next()', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        extra: Joi.string().optional(),
      });

      const req = createMockReq({
        body: { name: '测试', extra: '数据' },
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(schema)(req, res, next);

      expect(req.body).toEqual({ name: '测试', extra: '数据' });
      expect(next).toHaveBeenCalled();
    });

    test('无效输入返回 400 并附带字段详情', () => {
      const req = createMockReq({
        body: { age: -5 }, // 缺少必填字段 name，age 不合法
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(testSchema)(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe(400);
      expect(res.body.error.type).toBe('INVALID_PARAMS');
      expect(Array.isArray(res.body.error.detail)).toBe(true);
      expect(res.body.error.detail.length).toBeGreaterThan(0);
      expect(next).not.toHaveBeenCalled();
    });

    test('stripUnknown 移除未知字段', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });

      const req = createMockReq({
        body: { name: '测试', unknown_field: '应该被移除' },
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(schema)(req, res, next);

      expect(req.body).toEqual({ name: '测试' });
      expect(req.body.unknown_field).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    test('支持验证 query 参数', () => {
      const querySchema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
      });

      const req = createMockReq({
        query: { page: '2' },
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(querySchema, 'query')(req, res, next);

      expect(req.query.page).toBe(2);
      expect(next).toHaveBeenCalled();
    });

    test('验证错误信息使用自定义 message', () => {
      const schema = Joi.object({
        code: Joi.string().required().messages({
          'string.empty': '微信登录码不能为空',
          'any.required': '微信登录码为必填项',
        }),
      });

      const req = createMockReq({ body: {} });
      const res = createMockRes();
      const next = createMockNext();

      validate(schema)(req, res, next);

      expect(res.statusCode).toBe(400);
      const fields = res.body.error.detail;
      expect(fields.some((f) => f.message.includes('微信登录码'))).toBe(true);
    });

    test('多个字段验证错误全部返回', () => {
      const schema = Joi.object({
        name: Joi.string().required().messages({
          'any.required': '名称为必填项',
        }),
        email: Joi.string().email().required().messages({
          'any.required': '邮箱为必填项',
        }),
      });

      const req = createMockReq({ body: {} });
      const res = createMockRes();
      const next = createMockNext();

      validate(schema)(req, res, next);

      expect(res.body.error.detail.length).toBe(2);
    });
  });
});
