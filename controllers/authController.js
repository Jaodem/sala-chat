const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validar que no falte nada
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Faltan datos requeridos' });
        }

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne( { email });
        if (existingUser) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const user = new User({
            username,
            email,
            password : hashedPassword
        });

        await user.save();

        res.status(201).json({ message: 'Usuario registrado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500),json({ message: 'Error del servidor' });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar que no falte nada
        if (!email || !password) {
            return res.status(400).json({ message: 'Faltan datos requeridos' });
        }

        // Buscar usuario por email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }

        // Comparar contraseñas
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Contraseña incorrecta' });
        }

        // Crear token JWT
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

module.exports = { registerUser, loginUser };