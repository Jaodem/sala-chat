const Message = require('../models/Message');
const User = require('../models/User');

// Historial global: últimos 50 mensajes (para debug o pruebas)
const getGlobalChatHistory = async (req, res) => {
    try {
        const messages = await Message.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .select('-__v') // Excluir campo innecesario
            .lean();

            res.json({
                message: 'Historial global de mensajes',
                data: messages.reverse()
            });
    } catch (error) {
        console.error('Error al obtener historial global:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// Historial con un usuario específico
const getChatWithUser = async (req, res) => {
    try {
        const currentUserId = req.user.userId; // Obtenido del token
        const otherUserId = req.params.userId;

        // Buscar el username del otro usuario para mostrarlo en el mensaje
        const otherUser = await User.findById(otherUserId).select('username').lean();
        const otherUsername = otherUser ? otherUser.username : otherUserId; // fallback al id si no existe

        // Buscar mensajes entre ambos usuarios
        const messages = await Message.find({
            $or: [
                { userId: currentUserId, toUserId: otherUserId },
                { userId: otherUserId, toUserId: currentUserId }
            ]
        })
            .sort({ createdAt: -1 }) // Orden cronológico
            .select('-__v') // Excluir campo innecesario
            .lean();

        res.json({
            message: `Historial con el usuario ${otherUsername}`,
            data: messages.reverse() // Mostrar en orden cronológico
        });
    } catch (error) {
        console.error('Error al obtener historial con usuario:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

module.exports = {
    getGlobalChatHistory,
    getChatWithUser
};