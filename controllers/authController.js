const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Registro
const registerUser = asyncHandler(async (req, res) => {
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

    // Verificar unicidad (case-insensitive)
    const existingEmail = await User.findOne({ email }).collation({ locale: 'en', strength: 2 });
    if (existingEmail) {
        return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Verificar si el usuario ya existe
    const existingUsername = await User.findOne( { username_lower: username.toLowerCase() });
    if (existingUsername) {
        return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = new User({
        username,
        username_lower: username.toLowerCase(),
        email,
        password : hashedPassword
    });

    await user.save();

    res.status(201).json({ message: 'Usuario registrado correctamente' });
});

// Login
const loginUser = asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;

    // Validar campos obligatorios
    if (!identifier || !password) {
        return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    // Validar longitud mínima de identifier
    if (identifier.length < 3) {
        return res.status(400).json({ message: 'El identificador debe tener al menos 3 caracteres' });
    }

    // Validar longitud mínima
    if (password.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    let user;

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(identifier)) {
        // Si es email
        user = await User.findOne({ email: identifier }).collation({ locale: 'en', strength: 2 });
    } else {
        // Si es username (se busca por campo lowercase)
        user = await User.findOne({ username_lower: identifier.toLowerCase() });
    }

    // Validar si no existe el usuario o la contraseña no coincide
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
});

module.exports = { registerUser, loginUser };