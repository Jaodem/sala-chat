const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Ruta para obtener datos del usuario autenticado
router.get('/me', authMiddleware, (req, res) => {
    try {
        const { userId, username, email } = req.user;

        if (!userId || !username) {
            return res.status(400).json({ message: 'Datos de usuario incompletos en el token' });
        }

        res.json({
            message: 'Informacion del usuario autenticado',
            data: {
                userId,
                username,
                email
            }
        });
    } catch (error) {
        console.error('Error en /api/users/me:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;