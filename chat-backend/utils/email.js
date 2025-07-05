const getTransporter = require('./emailTransport');
const nodemailer = require('nodemailer');

async function sendVerificationEmail(to, token) {
    const transporter = await getTransporter();

    const verificationUrl = `http://localhost:3000/api/auth/verify-email?token=${token}`;

    const mailOptions = {
        from: '"Sala Chat 👋" <no-reply@sala-chat.com>',
        to,
        subject: 'Verifica tu correo electrónico',
        html: `
            <h2>Hola!</h2>
            <p>Por favor, verifica tu correo electrónico haciendo click en el enlace:</p>
            <a href="${verificationUrl}">${verificationUrl}</a>
            <p>Si no solicitaste esto, ignora este correo.</p>
        `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Mensaje enviado:', info.messageId);
    console.log('Vista previa URL:', nodemailer.getTestMessageUrl(info));
}

module.exports = { sendVerificationEmail };