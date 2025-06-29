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
        const username = decoded.username;

        // Asociar userId con el socket.id
        connectedUsers.set(userId, socket.id);
        console.log(`✅ Usuario conectado: ${username} (${userId})`);

        // Emitir evento a otros (por ejemplo, que se conectó un usuario)
        socket.broadcast.emit('user-connected', {
            userId,
            username
        });

        // Recibir mensajes y reenviar a todos (excepto al que lo envía)
        socket.on('send-message', (data) => {
            if (!data.message || typeof data.message !== 'string') return;

            const payload = {
                userId,
                username,
                message: data.message.trim()
            };

            console.log(`📝 Mensaje de ${username}: ${payload.message}`);

            // Enviar a todos excepto al remitente
            socket.broadcast.emit('chat-message', payload);

            // También podés reenviárselo al que lo envió, si se desea
            socket.emit('chat-message', payload);
        });

        // Manejar desconexión
        socket.on('disconnect', () => {
            connectedUsers.delete(userId);
            console.log(`🔌 Usuario desconectado: ${username} (${userId})`);
            socket.broadcast.emit('user-disconnected', { userId });
        });

        // Aquí se agregarían más eventos luego (como recibir/emitir mensajes)
    } catch (error) {
        console.log('❌ Token inválido:', error.message);
        socket.disconnect();
    }
};