const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'El nombre de usuario es obligatorio'],
        unique: true,
        trim: true,
        minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres'],
        maxlength: [20, 'El nombre de usuario debe tener máximo 20 caracteres'],
    },
    username_lower: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        select: false // No se expone en respuesta
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido'],
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        token: String,
        expiresAt: Date
    }
}, {
    timestamps: true
});

// Índice único para el email con collation
userSchema.index({ email: 1}, { unique: true, collation: { locale: 'en', strength: 2 } });

// Pre-save: forzar username a minúsculas
userSchema.pre('save', function(next) {
    if (this.isModified('username')) {
        this.username_lower = this.username.toLowerCase();
    }
    next();
});

module.exports = mongoose.model('User', userSchema);