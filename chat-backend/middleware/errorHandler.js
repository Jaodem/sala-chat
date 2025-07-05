const errorHandler = (err, req, res, next) => {
    console.error('🛑 Error capturado:', err);

    let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    let message = err.message || 'Error interno del servidor';

    // Error de clave duplicada en MongoDb
    if (err.code === 11000) {
        const campo = Object.keys(err.keyValue || {})[0];
        message = `El campo "${campo === 'username_lower' ? 'username' : campo}" ya está en uso`;
        statusCode = 400;
    }

    // Errores de validación en Mongoose
    if (err.name === 'ValidationError') {
        const errores = Object.values(err.errors).map(e => e.message);
        message = errores.join(', ');
        statusCode = 400;
    }

    res.status(statusCode).json({
        message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

module.exports = errorHandler;