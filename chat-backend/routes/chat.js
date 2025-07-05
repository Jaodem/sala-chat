const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { getGlobalChatHistory, getChatWithUser } = require('../controllers/chatController');

// Endpoint para obtener el historial global de mensajes (opcional)
router.get('/history/global', authenticate, getGlobalChatHistory);

// Endpoint para obtener el historial entre dos usuarios
router.get('/history/:userId', authenticate, getChatWithUser);

module.exports = router;