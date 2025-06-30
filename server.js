require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Rutas
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/users');

// Inicializaciones
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*'}
});

// Middlewares
app.use(cors());
app.use(express.json());

// Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

// Sockets
const chatSocket = require('./sockets/chatSocket');
io.on('connection', (socket) => chatSocket(socket, io));

// Conexión a Mongo y servidor
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        server.listen(process.env.PORT, () =>
            console.log(`Servidor corriendo en puerto ${process.env.PORT}`)
        );
    })
    .catch(err => console.error('Error al conectar a MongoDB', err));