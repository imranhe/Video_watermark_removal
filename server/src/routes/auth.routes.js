const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { validate, schemas } = require('../middleware/validation.middleware');

router.post('/login', validate(schemas.login), authController.login);
router.post('/refresh', validate(schemas.refreshToken), authController.refresh);

module.exports = router;
