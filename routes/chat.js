const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getGlobalChatHistory, getChatWithUser } = require('../controllers/chatController');

// Endpoint para obtener el historial global de mensajes (opcional)
router.get('/history/global', authMiddleware, getGlobalChatHistory);

// Endpoint para obtener el historial entre dos usuarios
router.get('/history/:userId', authMiddleware, getChatWithUser);

module.exports = router;