const jwt = require('jsonwebtoken');

/**
 * Verificar el token enviado desde el socket
 * @param {object} socket - El socket del cliente.
 * @returns {object} Un objeto con userId y username si el token es válido.
 * @throws {Error} Si el token está ausente o es inválido
 */

function verifySocketToken(socket) {
    const token = socket.handshake.auth.token;

    if (!token) {
        throw new Error('Token no enviado');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return {
            userId: decoded.userId,
            username: decoded.username
        }
    } catch (error) {
        throw new Error('Token inválido');
    }
}

module.exports = { verifySocketToken };