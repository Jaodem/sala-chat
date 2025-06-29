const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    // El token se espera en el header Authorization con formato "Bearer TOKEN"
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
    }

    const token = authHeader.split(' ')[1]; // Separar "Bearer" del token

    if (!token) {
        return res.status(401).json({ message: 'Token mal formado o no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Guardar payload decodificado para usar en la ruta
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
}

module.exports = authMiddleware;