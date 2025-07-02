const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const getProfile = asyncHandler((req, res) => {
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
});

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find(
        { _id: {$ne: req.user.userId } }, // Se excluye al usuario actual
        '_id username' // Solo devolver los campos necesarios
    )
    .sort({ username: 1 }) // Obtener alfabéticamente por nombre de usuario
    .lean();

    res.json({
        message: 'Lista de usuarios registrados.',
        data: users
    });
});

module.exports = {
    getProfile,
    getAllUsers
};