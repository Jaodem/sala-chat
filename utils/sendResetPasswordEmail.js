const getTransporter = require('./emailTransport');
const nodemailer = require('nodemailer');

async function sendResetPasswordEmail(to, token) {
    const transporter = await getTransporter();

    const resetUrl = `http://localhost:3000/api/auth/reset-password?token=${token}`;

    const mailOptions = {
        from: '"Sala Chat 👋" <no-reply@sala-chat.com>',
        to,
        subject: 'Restablecer tu contraseña',
        html: `
            <h2>Restablecer contraseña</h2>
            <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>Este enlace expirará en 1 hora. Si no solicitaste esto, ignora este mensaje.</p>
        `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✉️ Mensaje de recuperación enviado:', info.messageId);
    console.log('🔗 Vista previa:', nodemailer.getTestMessageUrl(info));
}

module.exports = { sendResetPasswordEmail };