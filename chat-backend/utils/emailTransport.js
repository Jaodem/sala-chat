const nodemailer = require('nodemailer');

let transporter = null;

async function getTransporter() {
    if (transporter) return transporter; // Reutiliza el transporte si ya fue creado

    // Crear cuenta de prueba en Ethereal
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });

    console.log('Cuenta Ethereal creada:', testAccount.user);

    return transporter;
}

module.exports = getTransporter;