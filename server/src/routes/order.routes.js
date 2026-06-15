const router = require('express').Router();
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');

router.post('/', authenticate, validate(schemas.createOrder), orderController.create);
router.get('/', authenticate, validate(schemas.orderListQuery, 'query'), orderController.list);
router.get('/:id', authenticate, orderController.detail);
router.post('/callback/wechat', orderController.wechatCallback);

module.exports = router;
