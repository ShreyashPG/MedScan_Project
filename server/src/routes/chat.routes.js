const express = require('express');
const router = express.Router();
const { sendMessage, getChatSuggestions } = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/message', sendMessage);
router.get('/suggestions', getChatSuggestions);

module.exports = router;
