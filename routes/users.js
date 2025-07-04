const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { getProfile, getAllUsers, deleteAccount } = require('../controllers/userController');

// Ruta para obtener datos del usuario autenticado
router.get('/me', authenticate, getProfile);

// Ruta para obtner todos los usuarios
router.get('/all', authenticate, getAllUsers);

// Ruta para eliminar la cuenta
router.delete('/me', authenticate, deleteAccount);

module.exports = router;