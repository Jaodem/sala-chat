const { io } = require('socket.io-client');

const socketA = io('http://localhost:3000', {
    auth: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODYzMzUxMzAzMzVhYzNlYTg5MWNmNzQiLCJ1c2VybmFtZSI6InJvbyIsImVtYWlsIjoicm9AbWFpbC5jb20iLCJpYXQiOjE3NTE0MTY0NjIsImV4cCI6MTc1MTQyMDA2Mn0.PXTZziv2JQTeb9VLDm9XXzMo_H-XF_apdApDiQDNj2Y"
    }
});

const socketB = io('http://localhost:3000', {
    auth: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODYzMzUwNzAzMzVhYzNlYTg5MWNmNzEiLCJ1c2VybmFtZSI6ImphbyIsImVtYWlsIjoiamFvQG1haWwuY29tIiwiaWF0IjoxNzUxNDE2NDIwLCJleHAiOjE3NTE0MjAwMjB9.J4QwTsQGRs99AAuOpy8jkyedXByRI_CdemP1F6cMXVM"
    }
});

// Escuchas comunes
function setupListeners(socket, name) {
    socket.on('connect', () => {
        console.log(`✅ ${name} conectado`);
    });

    socket.on('user-list', (list) => {
        console.log(`📋 ${name} recibió lista de usuarios:`, list);
    });

    socket.on('user-connected', (user) => {
        console.log(`🔔 ${name} detecta conexión de:`, user);
    });

    socket.on("user-disconnected", (user) => {
        console.log(`🔌 ${name} detecta desconexión de:`, user);
    });

    socket.on("private-message", (msg) => {
        console.log(`✉️ ${name} recibió mensaje:`, msg);
    });

    socket.on("connect_error", (err) => {
        console.error(`❌ Error de conexión en ${name}:`, err.message);
    });
}

setupListeners(socketA, 'Usuario A');
setupListeners(socketB, 'Usuario B');

// Emitir un mensaje desde A hacia B cuando esté conectado
socketA.on('connect', () => {
    setTimeout(() => {
        socketA.emit('send-message', {
            message: '¡Hola desde A!',
            toUserId: '686335070335ac3ea891cf71',
            toUsername: 'jao'
        });
    }, 1000); // Da tiempo a que ambos estén conectados
});