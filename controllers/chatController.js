const Message = require('../models/Message');

const getChatHistory = async (req, res) => {
    try {
        // Limitar la cantidad a los últimos 50 mensajes
        const messages = await Message.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

            // Enviar en orden cronológico (del más antiguo al más nuevo)
            res.json(messages.reverse());
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

module.exports = { getChatHistory };