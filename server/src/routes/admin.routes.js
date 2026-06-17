const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');
const adminController = require('../controllers/admin.controller');

// ===== 登录（公开接口） =====
router.post('/login', validate(schemas.adminLogin, 'body'), adminController.login);

// ===== 以下路由均需管理员权限 =====
router.use(authenticate, requireAdmin);

// 仪表盘
router.get('/stats/today', adminController.getTodayStats);

// 用户管理
router.get('/users', validate(schemas.adminUserQuery, 'query'), adminController.getUsers);
router.get('/users/:id', adminController.getUserDetail);
router.put('/users/:id/status', validate(schemas.updateUserStatus, 'body'), adminController.updateUserStatus);
router.put('/users/:id/balance', validate(schemas.adjustBalance, 'body'), adminController.adjustUserBalance);

// 任务管理
router.get('/tasks', validate(schemas.adminTaskQuery, 'query'), adminController.getTasks);
router.get('/tasks/:id', adminController.getTaskDetail);
router.put('/tasks/:id/status', validate(schemas.updateTaskStatus, 'body'), adminController.updateTaskStatus);

// 订单管理
router.get('/orders', validate(schemas.adminOrderQuery, 'query'), adminController.getOrders);
router.post('/orders/:id/refund', validate(schemas.adminRefundOrder, 'body'), adminController.refundOrder);

// 公告管理
router.get('/announcements', adminController.getAnnouncements);
router.post('/announcements', validate(schemas.createAnnouncement, 'body'), adminController.createAnnouncement);
router.put('/announcements/:id', validate(schemas.updateAnnouncement, 'body'), adminController.updateAnnouncement);
router.delete('/announcements/:id', adminController.deleteAnnouncement);

// FAQ 管理
router.get('/faqs', adminController.getFaqs);
router.post('/faqs', validate(schemas.createFaq, 'body'), adminController.createFaq);
router.put('/faqs/:id', validate(schemas.updateFaq, 'body'), adminController.updateFaq);
router.delete('/faqs/:id', adminController.deleteFaq);

// 反馈管理
router.get('/feedbacks', adminController.getFeedbacks);
router.put('/feedbacks/:id', validate(schemas.updateFeedback, 'body'), adminController.updateFeedback);

// 系统配置
router.get('/configs', adminController.getSystemConfigs);
router.put('/configs/:key', validate(schemas.updateConfig, 'body'), adminController.updateSystemConfig);

// 操作日志
router.get('/logs', adminController.getAdminLogs);

module.exports = router;
