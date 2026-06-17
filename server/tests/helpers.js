const { v4: uuidv4 } = require('uuid');

/**
 * 创建模拟数据库连接池
 */
function createMockPool() {
  const mockConn = {
    query: jest.fn().mockResolvedValue([[], []]),
    beginTransaction: jest.fn().mockResolvedValue(),
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
    release: jest.fn(),
  };

  return {
    query: jest.fn().mockResolvedValue([[], []]),
    getConnection: jest.fn().mockResolvedValue(mockConn),
    end: jest.fn().mockResolvedValue(),
    _mockConn: mockConn,
  };
}

/**
 * 创建模拟 Express 请求
 */
function createMockReq(overrides = {}) {
  return {
    headers: {},
    body: {},
    params: {},
    query: {},
    ip: '127.0.0.1',
    method: 'GET',
    path: '/test',
    originalUrl: '/test',
    user: null,
    requestId: uuidv4(),
    startTime: Date.now(),
    ...overrides,
  };
}

/**
 * 创建模拟 Express 响应
 */
function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status: jest.fn().mockImplementation(function (code) {
      res.statusCode = code;
      return res;
    }),
    json: jest.fn().mockImplementation(function (data) {
      res.body = data;
      return res;
    }),
    set: jest.fn().mockImplementation(function (name, value) {
      res.headers[name] = value;
      return res;
    }),
    setHeader: jest.fn().mockImplementation(function (name, value) {
      res.headers[name] = value;
      return res;
    }),
    send: jest.fn().mockImplementation(function (data) {
      res.body = data;
      return res;
    }),
    end: jest.fn(),
  };
  return res;
}

/**
 * 创建模拟 next 函数
 */
function createMockNext() {
  return jest.fn();
}

/**
 * 生成测试用户数据
 */
function sampleUser(overrides = {}) {
  return {
    id: uuidv4(),
    openid: 'test_openid_123456',
    nickname: '测试用户',
    avatar_url: 'https://example.com/avatar.jpg',
    phone: null,
    balance: 30,
    vip_type: 'none',
    vip_expire_at: null,
    total_tasks: 0,
    total_spent: 0,
    version: 1,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * 生成测试任务数据
 */
function sampleTask(overrides = {}) {
  return {
    id: uuidv4(),
    user_id: uuidv4(),
    video_url: 'https://example.com/video.mp4',
    result_url: null,
    status: 'pending',
    task_type: 'subtitle',
    progress: 0,
    params: null,
    points_cost: 10,
    priority: 0,
    retry_count: 0,
    error_message: null,
    completed_at: null,
    deleted_at: null,
    version: 1,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * 生成测试订单数据
 */
function sampleOrder(overrides = {}) {
  return {
    id: uuidv4(),
    order_no: 'ORD202401010001',
    user_id: uuidv4(),
    package_id: uuidv4(),
    package_name: '基础套餐',
    amount: 9.9,
    credits: 100,
    status: 'pending',
    payment_method: 'wechat',
    payment_params: null,
    transaction_id: null,
    paid_at: null,
    deleted_at: null,
    version: 1,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * 生成测试套餐数据
 */
function samplePackage(overrides = {}) {
  return {
    id: uuidv4(),
    name: '基础套餐',
    type: 'points',
    price: 9.9,
    credits: 100,
    duration_days: null,
    description: '100积分',
    is_active: true,
    sort_order: 1,
    created_at: new Date('2024-01-01'),
    ...overrides,
  };
}

module.exports = {
  createMockPool,
  createMockReq,
  createMockRes,
  createMockNext,
  sampleUser,
  sampleTask,
  sampleOrder,
  samplePackage,
};
