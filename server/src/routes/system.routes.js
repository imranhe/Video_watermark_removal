const router = require('express').Router();
const systemController = require('../controllers/system.controller');

router.get('/config', systemController.getConfig);
router.get('/processing-config', systemController.getProcessingConfig);

module.exports = router;
