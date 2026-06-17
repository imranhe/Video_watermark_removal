const router = require('express').Router();
const feedbackController = require('../controllers/feedback.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');
const { contentSecurityCheck } = require('../middleware/content-security.middleware');

router.post(
  '/',
  authenticate,
  validate(schemas.createFeedback),
  contentSecurityCheck((req) => req.body.content),
  feedbackController.create
);
router.get('/', authenticate, validate(schemas.feedbackQuery, 'query'), feedbackController.list);

module.exports = router;
