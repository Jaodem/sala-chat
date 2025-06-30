const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    toUsername: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);