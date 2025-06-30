const express = require('express');
const router = express.Router();

const chatController = require('../controllers/chatController');

// Endpoint para obtener el historial de mensajes
router.get('/history', chatController.getChatHistory);

module.exports = router;