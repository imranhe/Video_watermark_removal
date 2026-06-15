const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');

router.get('/info', authenticate, userController.getInfo);
router.put('/info', authenticate, validate(schemas.updateUser), userController.updateInfo);
router.get('/stats', authenticate, userController.getStats);

module.exports = router;
