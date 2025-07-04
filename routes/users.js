const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { getProfile, getAllUsers } = require('../controllers/userController');

// Ruta para obtener datos del usuario autenticado
router.get('/me', authenticate, getProfile);

// Ruta para obtner todos los usuarios
router.get('/all', authenticate, getAllUsers);

module.exports = router;