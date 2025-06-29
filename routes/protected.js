const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.get('/profile', authMiddleware, (req, res) => {
    try {
        if (!req.user || !req.user.username || !req.user.userId) {
            return res.status(400).json({ message: 'Datos de usuario incompletos en token'});
        }
        // req.user viene del middleware, con los datos decodificados del token
        res.json({
            message: 'Información protegida del usuario',
            data: {
                userId: req.user.userId,
                username: req.user.username,
                email: req.user.email,
                issueAt: req.user.iat,
                expiresAt: req.user.exp
            }
        });
    } catch (error) {
        console.error('Error en ruta protegida', error);
        res.status(500).json({ message: 'Error interno en el servidor' });
    }
});

module.exports = router;