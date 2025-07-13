import { getToken, logout, redirectIfNotLoggedIn } from "../utils/checkAuth.js";
import { io } from 'https://cdn.socket.io/4.5.4/socket.io.esm.min.js';

// Validar sesión, si no está logueado redirige a login
redirectIfNotLoggedIn();

const token = getToken();

// Conectar al servidor socket.io enviando token para autenticar
const socket = io('http://localhost:3000', {
    auth: { token }
});

// Elementos del DOM
const userList = document.getElementById('userList');
const messageContainer = document.getElementById('messageContainer');
const chatWith = document.getElementById('chatWith');
const logoutBtn = document.getElementById('logoutBtn');
const statusMessage = document.getElementById('statusMessage');

let currentUserId = null; // nuestro userId
let selectedUserId = null; // Usuario con quien se chatea
let selectedUser = null;   // Se guarda el objeto completo
let users = []; // Lista de usuarios conectados

// Estados de conexión
function showStatusMessage(text, type = 'info') {
    statusMessage.textContent = text;
    statusMessage.className = 'text-sm font-medium px-4 py-2 rounded-xl shadow transition';

    if (type === 'connect') statusMessage.classList.add('bg-green-100', 'text-green-700');
    else if (type === 'disconnect') statusMessage.classList.add('bg-red-100', 'text-red-700');
    else statusMessage.classList.add('bg-gray-100', 'text-gray-700');

    setTimeout(() => {
        statusMessage.textContent = '';
        statusMessage.className = '';
    }, 5000);
}

function sortAndFilter(list) {
    return list
        .filter((u) => u.userId !== currentUserId)
        .sort((a, b) =>
            a.username.localeCompare(b.username, 'es', { sensitivity: 'base' })
        );
}

// Renderizar lista de usuarios
function renderUserList() {
    userList.innerHTML = '';

    const filtered = sortAndFilter(users);

    if (filtered.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No hay otros usuarios conectados';
        li.classList.add('p-3', 'text-sm', 'text-gray-500', 'italic');
        userList.appendChild(li);
        return;
    }

    filtered.forEach((user) => {
        const li = document.createElement('li');
        li.textContent = user.username;
        li.dataset.uid = user.userId;
        li.classList.add('p-3', 'cursor-pointer', 'hover:bg-gray-200');

        // Si es el usuario seleccionado, cambiar estilo
        if (user.userId === selectedUserId) {
            li.classList.add('bg-blue-100', 'font-semibold');
        }

        li.addEventListener('click', () => {
            selectedUser = user;
            selectedUserId = user.userId;
            chatWith.textContent = `Chat con ${user.username}`;
            renderUserList();
            loadChatMessages(user.userId);
        });

        userList.appendChild(li);
    });
}

// Cargar mensajes (placeholder)
function loadChatMessages(userId) {
    messageContainer.innerHTML = `<p class="text-gray-500">Cargando mensajes con ${userId}...</p>`;
    // Aquí luego implementaremos la carga real de mensajes (fetch al backend)
}

// Eventos del socket
// Conexión al chat
socket.on('connect', () => {
    console.log('✅ Socket conectado');
    /*  Decodificamos el JWT para obtener nuestro userId
        (payload = token.split('.')[1] en base64url)
    */
    try {
        const payload = JSON.parse(
            atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
        );
        currentUserId = payload.userId;

    } catch (e) {
        console.error("No se pudo decodificar el token", e);
    }
});

// Lista inicial y actualizaciones
socket.on('user-list', (list) => {
    users = list;
    renderUserList();
});

// Usuario se conecta
socket.on('user-connected', ({ userId, username }) => {
    users.push({ userId, username });
    renderUserList();

    showStatusMessage(`${username} se conectó`, 'connect');
});

// Usuario se desconecta
socket.on('user-disconnected', ({ userId }) => {
    const gone = users.find(u => u.userId === userId);
    users = users.filter(u => u.userId !== userId);
    renderUserList();
    showStatusMessage(`${gone?.username || 'Usuario'} se desconectó`, 'disconnect');
});

// Desconexión local
socket.on('disconnect', () => {
    console.log('🔌 Socket desconectado');
    showStatusMessage('Desconectado del servidor', 'disconnect');
});

// Logout
logoutBtn.addEventListener('click', () => {
    logout();
    window.location.href = 'index.html';
});

// Envío de mensajes
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const text = messageInput.value.trim();
    if (!text || !selectedUser) return;

    console.log('emit →', { text, selectedUserId, toUsername:
        users.find(u => u.userId === selectedUserId)?.username });

    socket.emit('send-message', {
        toUserId: selectedUser.userId,
        toUsername: selectedUser.username,
        message: text
    });

    messageInput.value = '';
    messageInput.focus();
});

// Recibir mensaje
socket.on('private-message', (payload) => {
    /*
        payload = {
            userId,          // emisor
            username,
            toUserId,
            toUsername,
            message,
            createdAt
        }
    */
    const isOwn = payload.userId === currentUserId;
    // Verificar si el mensaje pertenece al chat que está abierto
    const talkingWith = isOwn ? payload.toUserId : payload.userId;
    const isForCurrentConversation = talkingWith === selectedUserId;

    if (isForCurrentConversation) appendMessageBubble(payload.message, payload.createdAt, isOwn);
    else markUserAsUnread(talkingWith);
});

// No leído
function markUserAsUnread(userId) {
    const li = [...userList.children].find(el => el.dataset.uid === userId);
    if (li && !li.querySelector('.dot')) {
        const dot = document.createElement('span');
        dot.className = 'dot inline-block w-2 h-2 bg-red-500 rounded-full ml-2';
        li.appendChild(dot);
        li.classList.add('bg-yellow-200');
    }
}

// Pintar burbujas
function appendMessageBubble(text, isoDate, isOwn) {
    const bubble = document.createElement('div');
    bubble.classList.add(
        'max-w-[70%]', 'px-4', 'py-2', 'rounded-xl', 'shadow',
        'text-sm', 'break-words',
        ...(isOwn
            ? ['bg-blue-600', 'text-white', 'self-end']
            : ['bg-gray-200', 'text-gray-800', 'self-start'])
    );
    bubble.innerHTML = `
        <p>${text}</p>
        <span class="block text-[10px] mt-1 opacity-70 ${isOwn ? 'text-right' : ''}">
        ${formatTime(isoDate)}
        </span>
    `;

    messageContainer.appendChild(bubble);

    // Auto-scroll
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

// Helper hh:mm
function formatTime(dateString) {
    const d = new Date(dateString);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}