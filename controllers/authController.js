const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validar campos obligatorios
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Faltan datos requeridos' });
        }

        // Validar longitud username
        if (username.length < 3) {
            return res.status(400).json({ message: 'El nombre de usuario debe tener al menos 3 caracteres' });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Email inválido' });
        }

        // Validar fortaleza de password
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&_\-])[A-Za-z\d@$!%*#?&_\-]{6,}$/;

        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: 'La contraseña debe tener al menos 6 caracteres e incluir minúscula, mayúscula, número y símbolo especial'
            });
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
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar campos obligatorios
        if (!email || !password) {
            return res.status(400).json({ message: 'Faltan datos requeridos' });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Email inválido' });
        }

        // Validar longitud mínima
        if (password.length < 6) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Validar si no existe el usuario o la contraseña no coincide
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Crear token JWT
        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                email: user.email
            },
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