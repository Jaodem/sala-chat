const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

const connectedUsers = new Map(); // userId -> { socketId, username }

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

        // Guardar usuario conectado
        connectedUsers.set(userId, {
            socketId: socket.id,
            username
        });

        console.log(`✅ Usuario conectado: ${username} (${userId})`);

        // Avisar a los demás
        socket.broadcast.emit('user-connected', { userId, username });

        // Emitir lista actualizada a todos los usuarios
        io.emit('user-list', getConnectedUserList());

        // Mensaje privado
        socket.on('send-message', async (data) => {
            sendPrivateMessage(data, { socket, io, userId, username });
        });

        // Manejar desconexión
        socket.on('disconnect', () => {
            connectedUsers.delete(userId);
            console.log(`🔌 Usuario desconectado: ${username} (${userId})`);

            socket.broadcast.emit('user-disconnected', { userId });

            // Emitir la lista actualizada a todos
            io.emit('user-list', getConnectedUserList());
        });

    } catch (error) {
        console.log('❌ Token inválido:', error.message);
        socket.disconnect();
    }
};

// Función para devolver la lista de usuarios conectados
function getConnectedUserList() {
    const users = [];
    for (const [userId, { username }] of connectedUsers.entries()) {
        users.push({ userId, username });
    }
    return users;
}

// Lógica del envío de mensajes
async function sendPrivateMessage(data, { socket, io, userId, username }) {
    const { message, toUserId, toUsername } = data;

    if (!message || !toUserId || !toUsername) return;

    const payload = {
        userId,
        username,
        toUserId,
        toUsername,
        message: message.trim()
    };

    try {
        const saved = await Message.create(payload);
        console.log(`✉️ ${username} -> ${toUsername}: ${message}`);

        // Enviar al destinatario si está conectado
        const toSocketId = connectedUsers.get(toUserId);
        if (toSocketId) {
            io.to(toSocketId).emit('private-message', {
                ...payload,
                createdAt: saved.createdAt
            });
        }

        // Enviar también al emisor
        socket.emit('private-message', {
            ...payload,
            createdAt: saved.createdAt
        });
    } catch (err) {
        console.error('❌ Error al guardar mensaje:', err.message);
    }
}