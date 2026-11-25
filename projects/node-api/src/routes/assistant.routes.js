const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');

router.get('/live-token', assistantController.liveTokenStatus);
router.post('/live-token', assistantController.liveTokenCreate);
router.get('/assistant/status', assistantController.status);
router.post('/assistant', assistantController.ask);
router.post('/assistant/tts', assistantController.tts);
router.post('/assistant/transcribe', assistantController.transcribe);
router.post('/assistant/reset', assistantController.reset);

module.exports = router;
