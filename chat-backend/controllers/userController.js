const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
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

// Para eliminar la cuenta
const deleteAccount = asyncHandler(async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'La contraseña es requerida para eliminar la cuenta' });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    await user.deleteOne();

    res.json({ message: 'Cuenta eliminada exitosamente' });
});

module.exports = {
    getProfile,
    getAllUsers,
    deleteAccount,
};