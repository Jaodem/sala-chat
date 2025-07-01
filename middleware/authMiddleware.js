const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    // El token se espera en el header Authorization con formato "Bearer TOKEN"
    const authHeader = req.headers.authorization;

    // Verificar si el encabezado Authorization está presente y bien formado
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token no proporcionado o mal formado' });
    }

    const token = authHeader.split(' ')[1]; // Separar "Bearer" del token

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email
        };
        next();
    } catch (error) {
        console.error('Error al verificar token:', error.message);
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
}

module.exports = authMiddleware;