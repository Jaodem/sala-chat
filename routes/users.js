const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getProfile, getAllUsers } = require('../controllers/userController');

// Ruta para obtener datos del usuario autenticado
router.get('/me', authMiddleware, getProfile);

// Ruta para obtner todos los usuarios
router.get('/all', authMiddleware, getAllUsers);

module.exports = router;