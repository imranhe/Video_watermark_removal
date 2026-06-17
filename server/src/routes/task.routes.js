const router = require('express').Router();
const taskController = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');
const { upload } = require('../middleware/upload.middleware');
const { contentSecurityCheck } = require('../middleware/content-security.middleware');

router.post('/', authenticate, upload.single('video'), taskController.create);
router.post(
  '/parse-link',
  authenticate,
  validate(schemas.parseLink),
  contentSecurityCheck((req) => req.body.url),
  taskController.parseLink
);
router.post(
  '/create-from-link',
  authenticate,
  validate(schemas.createFromLink),
  contentSecurityCheck((req) => req.body.url),
  taskController.createFromLink
);
router.get('/', authenticate, validate(schemas.taskListQuery, 'query'), taskController.list);
router.get('/:id', authenticate, taskController.detail);
router.get('/:id/progress', authenticate, taskController.progress);
router.post('/:id/retry', authenticate, taskController.retry);
router.post('/:id/cancel', authenticate, taskController.cancel);
router.delete('/:id', authenticate, taskController.delete);
router.get('/:id/download', authenticate, taskController.download);

module.exports = router;
