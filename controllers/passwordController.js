const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { sendResetPasswordEmail } = require('../utils/sendResetPasswordEmail');

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Validación básica
    if (!email) {
        return res.status(400).json({ message: 'El email es obligatorio' });
    }

    // Validar el formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Formato de email inválido' });
    }

    const user = await User.findOne({ email }).collation({ locale: 'en', strength: 2 });

    // Siempre devolver la misma respuesta por seguridad
    if (!user) {
        return res.status(200).json({ message: 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña' });
    }

    // Generar token y expiración de una hora
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Guardar en el usuario
    user.resetPasswordToken = { token, expiresAt };
    await user.save();

    // Simulación de envío por mail (por ahora solo por consola)
    await sendResetPasswordEmail(email, token);

    res.status(200).json({ message: 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña' });
});

// Para resetear la contraseña
const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.body;
    const { password } = req.body;

    // Validar que existan los datos
    if (!token || !password) {
        return res.status(400).json({ message: 'Token y nueva contraseña son requeridos' });
    }

    // Validar fortaleza de la nueva contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&_\-])[A-Za-z\d@$!%*#?&_\-]{6,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message: 'La contraseña debe tener al menos 6 caracteres e incluir minúscula, mayúscula, número y símbolo especial'
        });
    }

    const user = await User.findOne({ 'resetPasswordToken.token': token });

    if (!user) {
        return res.status(400).json({ message: 'Token inválido o usuario no encontrado' });
    }

    if (user.resetPasswordToken.expiresAt < Date.now()) {
        return res.status(400).json({ message: 'El token ha expirado' });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;

    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente' });
});

// Para reenviar el mail de reseteo de contraseña
const resendResetPasswordEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Validación básica
    if (!email) {
        return res.status(400).json({ message: 'El email es obligatorio' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Formato de email inválido' });
    }

    const user = await User.findOne({ email }).collation({ locale: 'en', strength: 2 });

    // Siempre misma respuesta por seguridad
    if (!user) {
        return res.status(200).json({ message: 'Si el email está registrado, recibirás nuevamente el enlace' });
    }

    // Generar nuevo token y expiración
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordToken = { token, expiresAt};
    await user.save();

    await sendResetPasswordEmail(email, token);

    return res.status(200).json({ message: 'Si el email está registrado, recibirás nuevamente el enlace' });
});

// Para cambiar contraseña estando ya logueado
const changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Debes ingresar la contraseña actual y la nueva' });
    }

    // Buscar usuario
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar la contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
    }

    // Validar la nueva contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&_\-])[A-Za-z\d@$!%*#?&_\-]{6,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            message: 'La nueva contraseña debe tener al menos 6 caracteres e incluir minúscula, mayúscula, número y símbolo especial'
        });
    }
    
    // Verificar que la nueva contraseña no sea igual a la actual
    const samePassword = await bcrypt.compare(newPassword, user.password);
    if (samePassword) {
        return res.status(400).json({ message: 'La nueva contraseña no puede ser igual a la actual' });
    }

    // Hashear y guardar
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente' });
});

module.exports = { forgotPassword, resetPassword, resendResetPasswordEmail, changePassword };