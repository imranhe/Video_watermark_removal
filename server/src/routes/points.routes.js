const router = require('express').Router();
const pointsController = require('../controllers/points.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');

router.get('/balance', authenticate, pointsController.getBalance);
router.get('/logs', authenticate, validate(schemas.pointsLogQuery, 'query'), pointsController.getLogs);

module.exports = router;
