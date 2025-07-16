const { verifySocketToken } = require('../utils/socketUtils');
const Message = require('../models/Message');

const connectedUsers = new Map(); // userId -> { socketId, username }

module.exports = async (socket, io) => {
    let userId, username;

    try {
        ({ userId, username } = verifySocketToken(socket));
    } catch (error) {
        console.log(`❌ Conexión rechazada: ${error.message}`);
        return socket.disconnect();
    }

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

    // Manejar recepción de mensajes privados
    socket.on('send-message', async (data) => {
        console.log('🟡  LLEGÓ del cliente →', data);
        await sendPrivateMessage(data, { socket, io, userId, username });
    });

    // User está escribiendo
    socket.on('typing', ({ toUserId }) => {
        const recipient = connectedUsers.get(toUserId);
        if (recipient) {
            io.to(recipient.socketId).emit('user-typing', {
                fromUserId: userId,
                fromUsername: username
            });
        }
    });

    // User deja de escribir
    socket.on('stop-typing', ({ toUserId }) => {
        const recipient = connectedUsers.get(toUserId);
        if (recipient) {
            io.to(recipient.socketId).emit('user-stop-typing', {
                fromUserId: userId
            });
        }
    });

    // Manejar desconexión
    socket.on('disconnect', () => {
        connectedUsers.delete(userId);
        console.log(`🔌 Usuario desconectado: ${username} (${userId})`);

        socket.broadcast.emit('user-disconnected', { userId });

        // Emitir lista actualizada a todos
        io.emit('user-list', getConnectedUserList());
    });
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
        const recipient = connectedUsers.get(toUserId);
        if (recipient) {
            io.to(recipient.socketId).emit('private-message', {
                ...payload,
                createdAt: saved.createdAt
            });
        }

        // Enviar también al emisor
        socket.emit('private-message', {
            ...payload,
            createdAt: saved.createdAt
        });
    } catch (error) {
        console.error('❌ Error al guardar mensaje:', error.message);
    }
}