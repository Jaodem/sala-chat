const { io } = require('socket.io-client');

// Aquí se reemplaza por un token generado desde login
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODYzMzUwNzAzMzVhYzNlYTg5MWNmNzEiLCJ1c2VybmFtZSI6ImphbyIsImVtYWlsIjoiamFvQG1haWwuY29tIiwiaWF0IjoxNzUxNDEzNTI1LCJleHAiOjE3NTE0MTcxMjV9.1ONlZXO2KdH4wk5Xq3rJYyAxNjnyZB2fLou8L-3SUsc";

// Conexión al backend con el token
const socket = io('http://localhost:3000', {
    auth: { token }
});

socket.on('connet', () => {
    console.log("✅ Conectado al servidor con ID:", socket.id);
});

socket.on('connect_error', (err) => {
    console.error("❌ Error al conectar:", err.message);
});

socket.on('user-connected', (user) => {
    console.log("🔔 Usuario conectado:", user);
});

socket.on('user-disconnected', (user) => {
    console.log("🔌 Usuario desconectado:", user);
});

socket.on('user-list', (list) => {
    console.log("📋 Lista de usuarios conectados:", list);
});

socket.on('private-message', (msg) => {
    console.log("📨 Mensaje privado recibido:", msg);
});