const router = require('express').Router();
const feedbackController = require('../controllers/feedback.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');

router.post('/', authenticate, validate(schemas.createFeedback), feedbackController.create);
router.get('/', authenticate, validate(schemas.feedbackQuery, 'query'), feedbackController.list);

module.exports = router;
