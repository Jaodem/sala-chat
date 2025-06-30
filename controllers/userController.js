const getProfile = (req, res) => {
    try {
        if (!req.user || !req.user.username || !req.user.userId) {
            return res.status(400).json({ message: 'Datos de usuario incompletos en el token' });
        }

        res.json({
            message: 'Informarión del usuario autenticado',
            data: {
                userId: req.user.userId,
                username: req.user.username,
                email: req.user.email
            }
        });
    } catch (error) {
        console.error('Error en getProfile:', error);
        res.status(500).json({ message: 'Error interno en el servidor' });
    }
};

module.exports = { getProfile };