const getProfile = (req, res) => {
    try {
        if (!req.user || !req.user.username || !req.user.userId) {
            return res.status(400).json({ message: 'Datos de usuario incompletos en el token' });
        }

        res.json({
            message: 'Información protegida del usuario',
            data: {
                userId: req.user.userId,
                username: req.user.username,
                email: req.user.email,
                issuedAt: req.user.iat,
                expiresAt: req.user.exp
            }
        });
    } catch (error) {
        console.error('Error en getProfile:', error);
        res.status(500).json({ message: 'Error interno en el servidor' });
    }
};

module.exports = { getProfile };