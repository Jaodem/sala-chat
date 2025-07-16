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
const scrollBtn = document.getElementById('scrollToBottomBtn');

let currentUserId = null; // nuestro userId
let selectedUserId = null; // Usuario con quien se chatea
let selectedUser = null;   // Se guarda el objeto completo
let users = []; // Lista de usuarios conectados
let lastMessagesByUser = new Map(); // userId => { text, createdAt }

// Set con usuarios que tienen mensajes pendientes
const unread = new Set();

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
        .filter(u => u.userId !== currentUserId)
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
        li.className = 'p-3 text-sm text-gray-500 italic';
        userList.appendChild(li);
        return;
    }

    filtered.forEach(user => {
        const li = document.createElement('li');
        li.dataset.uid = user.userId;
        li.className = 'flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-200';

        // Contenedor horizontal con nombre y puntito
        const topRow = document.createElement('div');
        topRow.className = 'flex items-center justify-between';

        // Nombre de usuario
        const usernameSpan = document.createElement('span');
        usernameSpan.textContent = user.username;
        if (user.userId === selectedUserId) {
            usernameSpan.classList.add('font-semibold', 'text-blue-800');
            li.classList.add('bg-blue-100');
        }
        topRow.appendChild(usernameSpan);

        // Puntito rojo si esta en unread
        if (unread.has(user.userId)) {
            const dot = document.createElement('span');
            dot.className = 'dot inline-block w-2 h-2 bg-red-500 rounded-full mr-2';
            li.appendChild(dot);
            li.classList.add('bg-yellow-200');
        }

        li.appendChild(topRow);

        // Último mensaje si es que hay
        const lastMsg = lastMessagesByUser.get(user.userId);
        if (lastMsg) {
            const preview = document.createElement('span');
            preview.className = 'text-sm text-gray-600 truncate';
            const time = formatTime(lastMsg.createdAt);
            preview.textContent = `${lastMsg.text.slice(0, 30)}${lastMsg.text.length > 30 ? '…' : ''} • ${time}`;
            li.appendChild(preview);
        }

        li.addEventListener('click', () => {
            // Actualizar el chat seleccionado
            selectedUser = user;
            selectedUserId = user.userId;
            chatWith.textContent = `Chat con ${user.username}`;

            // Al abrir el chat se quita la notificación
            unread.delete(user.userId);

            // Refrescar la lista
            renderUserList();

            // Se trae el historial con ese chat
            loadChatMessages(user.userId);
        });

        userList.appendChild(li);
    });
}

// Marcar usuario con mensaje no leído
function markUserAsUnread(userId) {
    if (userId !== selectedUserId) { // Sólo si no es el chat activo
        unread.add(userId);
        renderUserList(); // Se redibuja con el puntito
    }
}

// Cargar mensajes desde el backend
async function loadChatMessages(userId) {
    messageContainer.innerHTML = '';
    
    try {
        const res = await fetch(`http://localhost:3000/api/chat/history/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) {
            messageContainer.innerHTML =
                '<p class="text-red-500">No se pudo cargar el historial.</p>';
            return;
        }

        const { data: message } = await res.json();

        let lastDate = null;
        let lastBubble = null; // Una referencia al último nodo

        message.forEach(msg => {
            const isOwn = msg.userId === currentUserId;

            const msgDate = new Date(msg.createdAt).toDateString();
            if (msgDate !== lastDate) {
                appendDateSeparator(formatDateSeparator(msg.createdAt));
                lastDate = msgDate;
            }
            
            // Se guarda lo que devuelve appendMessageBubble
            lastBubble = appendMessageBubble(msg.message, msg.createdAt, isOwn);
        });

        requestAnimationFrame(() => {
            messageContainer.scrollTop = messageContainer.scrollHeight;
        });
    } catch (error) {
        console.error('Error al cargar historial:', error);
        messageContainer.innerHTML =
            '<p class="text-red-500">Error de red al cargar historial.</p>';
    }
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

    console.log('emit →', {text, selectedUserId, toUsername:
        users.find(u => u.userId === selectedUserId)?.username });

    socket.emit('send-message', {
        toUserId: selectedUser.userId,
        toUsername: selectedUser.username,
        message: text
    });

    messageInput.value = '';
    messageInput.focus();

    // Ir al final al enviar mensaje
    requestAnimationFrame(() => {
        messageContainer.scrollTo({
            top: messageContainer.scrollHeight,
            behavior: 'smooth'
        });
        scrollBtn.classList.add('hidden');
    });
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
    const isForCurrentConversation = selectedUserId && talkingWith === selectedUserId;

    // Guardar el último mensaje
    lastMessagesByUser.set(talkingWith, {
        text: payload.message,
        createdAt: payload.createdAt
    });

    if (isForCurrentConversation) appendMessageBubble(payload.message, payload.createdAt, isOwn);
    else markUserAsUnread(talkingWith);

    renderUserList(); // Para resfrescar texto
});

// Pintar burbujas
function appendMessageBubble(text, isoDate, isOwn) {
    // Burbuja
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
    if (isOwn || isNearBottom(messageContainer)) {
        scrollToBotom({
            smooth: true
        });
        hideScrollBtn(); // Se oculta cuando termina
    } else {
        scrollBtn.classList.remove('hidden');
    }

    return bubble; 
}

// Helper, devuelve hh:mm si es hoy, de lo contrario
function formatTime(dateString) {
    const d = new Date(dateString);

    // Verificar si el mensaje es de hoy
    const today = new Date();
    const isToday =
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();

    // Para aplicar el formato 24 h con 2 dígitos
    const time = d.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    if (isToday) return time;

    // Fecha + hora para días anteriores
    const date = d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    return `${time} ${date}`;
}

// Se formatea las fechas como separador en el chat
function formatDateSeparator(dateString) {
    const today = new Date();
    const msgDate = new Date(dateString);

    const isToday = msgDate.toDateString() === today.toDateString();

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isYesterday = msgDate.toDateString() === yesterday.toDateString();

    if (isToday) return 'Hoy';
    if (isYesterday) return 'Ayer';

    return msgDate.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function appendDateSeparator(text) {
    const separator = document.createElement('div');
    separator.className = 'text-xs text-gray-500 text-center my-4 select-none';
    separator.textContent = `───── ${text} ─────`;
    messageContainer.appendChild(separator);
}

function isNearBottom(elem, offset = 80) {
    return elem.scrollTop + elem.clientHeight >= elem.scrollHeight - offset;
}

function scrollToBotom({ smooth = true } = {}) {
    // Forzar re-flow para tener el scrollHeight definitivo
    void messageContainer.offsetHeight; // Trigger reflow
    messageContainer.scrollTo({
        top: messageContainer.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
    });
}

function hideScrollBtn(delay = 350) {
    setTimeout(() =>
        scrollBtn.classList.add('hidden'),
    delay);
}

messageContainer.addEventListener('scroll', () => {    
    if (isNearBottom(messageContainer)) {
        scrollBtn.classList.add('hidden'); // si llega abajo, ocultamos el botón
    }
});

scrollBtn.addEventListener('click', () => {
    scrollToBotom({
        smooth: true
    });
    hideScrollBtn(0); // Se lo oculta inmediatamente
});

let typingTimeout;
messageInput.addEventListener('input', () => {
    if (!selectedUser) return;

    socket.emit('typing', {
        toUserId: selectedUser.userId,
        fromUserId: currentUserId,
        fromUsername: users.find(u => u.userId === currentUserId)?.username
    });

    // Prevenir spam de eventos
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('stop-typing', {
            toUserId: selectedUser.userId
        });
    }, 2000);
});

const typingIndicator = document.getElementById('typingIndicator');

socket.on('user-typing', ({ fromUserId, fromUsername }) => {
    // Solo si es el chat activo
    if (selectedUserId !== fromUserId) return;

    typingIndicator.textContent = `${fromUsername} está escribiendo...`;

    clearTimeout(typingIndicator.timeout);
    typingIndicator.timeout = setTimeout(() => {
        typingIndicator.textContent = '';
    }, 3000);
});

socket.on('user-stop-typing', ({ fromUserId }) => {
    if (selectedUserId === fromUserId) typingIndicator.textContent = '';
});