const router = require('express').Router();
const orderController = require('../controllers/order.controller');

router.get('/', orderController.getPackages);

module.exports = router;
