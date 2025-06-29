const jwt = require('jsonwebtoken');

const connectedUsers = new Map(); // userId -> socket.id

module.exports = (socket, io) => {
    // Leer token enviado desde el cliente
    const token = socket.handshake.auth.token;

    if (!token) {
        console.log('❌ Conexión rechazada: no se envió token');
        return socket.disconnect();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // Asociar userId con el socket.id
        connectedUsers.set(userId, socket.id);
        console.log(`✅ Usuario conectado: ${decoded.username} (${userId})`);

        // Emitir evento a otros (por ejemplo, que se conectó un usuario)
        socket.broadcast.emit('user-connected', {
            userId,
            username: decoded.username
        });

        // Manejar desconexión
        socket.on('disconnect', () => {
            connectedUsers.delete(userId);
            console.log(`🔌 Usuario desconectado: ${decoded.username} (${userId})`);
            socket.broadcast.emit('user-disconnected', { userId });
        });

        // Aquí se agregarían más eventos luego (como recibir/emitir mensajes)
    } catch (error) {
        console.log('❌ Token inválido:', error.message);
        socket.disconnect();
    }
};