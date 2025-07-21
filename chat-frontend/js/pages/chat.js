import { getToken, logout, redirectIfNotLoggedIn } from "../utils/checkAuth.js";
import { io } from 'https://cdn.socket.io/4.5.4/socket.io.esm.min.js';
import { initMessageUI, appendMessageBubble, appendDateSeparator, formatTime, formatDateSeparator, isNearBottom, scrollToBottom, hideScrollBtn } from "../components/chat/messageUI.js";
import { createElement } from "../utils/domUtils.js";

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

const sentMessages = new Map(); // messageId => DOMNode
const pendingConfirmations = {
    messages: new Map(), // messageId => true
    zumbidos: new Map() // userId => [ { type, username, createdAt }, ... ]
}
const confirmedMessages = new Set(); // messageId ya confirmados

// Para el uso de emoji
const emojiToggle = document.getElementById('emojiToggle');
const emojiPicker = document.getElementById('emojiPicker');

// Sonido para notificaciones
const notificationSound = document.getElementById('notificationSound');
const zumbidoSound = document.getElementById('zumbidoSound');

// Para los zumbidos
const zumbidoBtn = document.getElementById('zumbidoBtn');

// Set con usuarios que tienen mensajes pendientes
const unread = new Set();

// Inicializar messageUI
initMessageUI(messageContainer, scrollBtn, sentMessages, pendingConfirmations);

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

function createUserListItem(user) {
    const li = createElement('li', 'flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-200');
    li.dataset.uid = user.userId;

    const topRow = createElement('div', 'flex items-center justify-between');

    const usernameSpan = createElement('span', '', user.username);

    if (user.userId === selectedUserId) {
        usernameSpan.classList.add('font-semibold', 'text-blue-800');
        li.classList.add('bg-blue-100');
    }

    topRow.appendChild(usernameSpan);

    if (unread.has(user.userId)) {
        const dot = createElement('span', 'dot inline-block w-2 h-2 bg-red-500 rounded-full mr-2');
        li.appendChild(dot);
        li.classList.add('bg-yellow-200');
    }

    li.appendChild(topRow);

    const lastMsg = lastMessagesByUser.get(user.userId);
    if (lastMsg) {
        const time = formatTime(lastMsg.createdAt);
        const previewText = `${lastMsg.text.slice(0, 30)}${lastMsg.text.length > 30 ? '…' : ''} • ${time}`;
        const preview = createElement('span', 'text-sm text-gray-600 truncate', previewText);
        li.appendChild(preview);
    }

    return li;
}

// Renderizar lista de usuarios
function renderUserList() {
    userList.innerHTML = '';

    const filtered = sortAndFilter(users);

    if (filtered.length === 0) {
        const li = createElement('li', 'p-3 text-sm text-gray-500 italic', 'No hay otros usuarios conectados');
        userList.appendChild(li);
        return;
    }

    filtered.forEach(user => {
        const li = createUserListItem(user);
        userList.appendChild(li);
    });
}

function selectUser(user) {
    selectedUser = user;
    selectedUserId = user.userId;
    chatWith.textContent = `Chat con ${user.username}`;

    unread.delete(user.userId);

    renderUserList();

    loadChatMessages(user.userId);
}

// Listener del contenedor
userList.addEventListener('click', event => {
    // Se busca el li más cercano al target del click
    const li = event.target.closest('li');
    if (!li || !userList.contains(li)) return;

    const uid = li.dataset.uid;
    if (!uid) return;

    // Se busca el usuario en la lista
    const user = users.find(u => u.userId === uid);
    if (!user) return;
    selectUser(user);
});

// Marcar usuario con mensaje no leído
function markUserAsUnread(userId) {
    if (userId !== selectedUserId) { // Sólo si no es el chat activo
        unread.add(userId);
        renderUserList(); // Se redibuja con el puntito
    }
}

// Función para comfirmar
function confirmIfNeeded(messageId, toUserId) {
    if (!confirmedMessages.has(messageId)) {
        socket.emit('message-received', { messageId, toUserId });
        confirmedMessages.add(messageId);
        console.log('📤 Confirmación emitida:', messageId);
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

        message.forEach(msg => {
            const isOwn = msg.userId === currentUserId;
            const msgDate = new Date(msg.createdAt).toDateString();

            if (msgDate !== lastDate) {
                appendDateSeparator(formatDateSeparator(msg.createdAt));
                lastDate = msgDate;
            }

            appendMessageBubble(msg.message, msg.createdAt, isOwn, msg._id);

            // Se emite confirmación de lectura si el mensaje es ajeno
            if (!isOwn) confirmIfNeeded(msg._id, msg.userId);
        });

        // Mostrar zumbidos pendientes si los hay
        if (pendingConfirmations.zumbidos.has(userId)) {
            const pendingZumbidos = pendingConfirmations.zumbidos.get(userId);
            pendingZumbidos.forEach(z => {
                if (z.type === 'zumbido') appendZumbidoMessage(`─────⚡ ${z.username} te envió un zumbido ⚡─────`);
            });
            pendingConfirmations.zumbidos.delete(userId);
        }

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

    // Ocultar el selector de emojis al enviar
    emojiPicker.classList.add('hidden');

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
    /*initMessageUI
        payload = {
            userId,          // emisor
            username,
            toUserId,
            toUsername,
            message,
            createdAt
        }
    */
    console.log('📩 Recibido mensaje con ID:', payload.messageId);
   
    const isOwn = payload.userId === currentUserId;

    console.log('👤 currentUserId:', currentUserId, '| payload.userId:', payload.userId);
    console.log('🤔 Es mío?', isOwn);

    // Verificar si el mensaje pertenece al chat que está abierto
    const talkingWith = isOwn ? payload.toUserId : payload.userId;
    const isForCurrentConversation = selectedUserId && talkingWith === selectedUserId;

    // Guardar el último mensaje
    lastMessagesByUser.set(talkingWith, {
        text: payload.message,
        createdAt: payload.createdAt
    });

    if (isForCurrentConversation) appendMessageBubble(payload.message, payload.createdAt, isOwn, payload.messageId);
    else {
        markUserAsUnread(talkingWith);

        // Se guarda también si es de uno, aunque no este visible
        if (isOwn) appendMessageBubble(payload.message, payload.createdAt, true, payload.messageId);
    }

    if (!isOwn && !isForCurrentConversation) {
        try {
            notificationSound.currentTime = 0; // Se reinicia si ya estaba sonando
            notificationSound.play();
        } catch (error) {
            console.warn("No se pudo reproducir el sonido:", error);
        }
    }

    if (!isOwn && isForCurrentConversation) confirmIfNeeded(payload.messageId, payload.userId);

    renderUserList(); // Para resfrescar texto
});

// Función para mostrar el mensaje de zumbido en el chat
function appendZumbidoMessage(text) {
    const separator = createElement('div', 'text-xs text-yellow-600 text-center my-4 select-none font-semibold', text);
    messageContainer.appendChild(separator);
    scrollToBottom();
}

messageContainer.addEventListener('scroll', () => {    
    if (isNearBottom(messageContainer)) {
        scrollBtn.classList.add('hidden'); // si llega abajo, ocultamos el botón
    }
});

scrollBtn.addEventListener('click', () => {
    scrollToBottom({
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

socket.on('message-received', ({ messageId }) => {
    console.log('✅ Confirmación recibida para:', messageId);

    const bubble = sentMessages.get(messageId);

    if (!bubble) {
        console.warn('❗ No se encontró burbuja para:', messageId);
        pendingConfirmations.messages.set(messageId, true); // Se guarda la confirmación pendiente
        return;
    }

    const statusEl = bubble.querySelector(`[data-mid="${messageId}"]`);
    if (!statusEl) {
        console.warn('❗ No se encontró el span con data-mid para:', messageId);
        return;
    }

    statusEl.textContent = '✓✓';
});

// Recibir zumbido
socket.on('receive-zumbido', ({ fromUserId, fromUsername }) => {
    // Mostrar en la barra de estado
    showStatusMessage(`${fromUsername} te envió un zumbido`, 'zumbido');

    // Hacer temblar el chat
    const chatSection = document.querySelector('section.flex-1');
    chatSection.animate(
        [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(0)' }
        ], {
            duration: 500,
            easing: 'ease-in-out'
        }
    );

    // Sonido
    try {
        zumbidoSound.currentTime = 0;
        zumbidoSound.play();
    } catch (error) {
        console.warn('No se pudo reproducir sonido de zumbido:', error);
    }

    // Guardar el zumbido como último mensaje
    lastMessagesByUser.set(fromUserId, {
        text: `${fromUsername} te envió un zumbido`,
        createdAt: new Date().toISOString()
    });

    // Si no esta en el chat del emisor, marcar notificación
    if (fromUserId === selectedUserId) {
        // Si esta en la ventana del emisor, mostrar mensaje en la ventana de chat
        appendZumbidoMessage(`─────⚡ ${fromUsername} te envió un zumbido ⚡─────`);
    } else {
        // Se guarda el zumbido pendiente como si fuera un mensaje normal
        if (!pendingConfirmations.zumbidos.has(fromUserId)) pendingConfirmations.zumbidos.set(fromUserId, []);

        pendingConfirmations.zumbidos.get(fromUserId).push({
            type: 'zumbido',
            username: fromUsername,
            createdAt: new Date().toISOString()
        })

        // Si se esta en otro chat, se marca como no leído
        markUserAsUnread(fromUserId);
    }

    renderUserList();
});

// Alternar visibilidad del selector de emojis
emojiToggle.addEventListener('click', () => {
    emojiPicker.classList.toggle('hidden');
});

// Insertar emoji en el input cuando se selecciona
emojiPicker.addEventListener('emoji-click', event => {
    const emoji = event.detail.unicode;
    messageInput.value += emoji;
    messageInput.focus();
});

// Para cerrar picker con la tecla escape
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !emojiPicker.classList.contains('hidden')) emojiPicker.classList.add('hidden');
});

// Para cerrar picker haciendo click fuera de él
document.addEventListener('click', event => {
    const isClickInsidePicker = emojiPicker.contains(event.target);
    const isClickOnToggle = emojiToggle.contains(event.target);

    if (!isClickInsidePicker && !isClickOnToggle) emojiPicker.classList.add('hidden');
});

// Para enviar el zumbido
zumbidoBtn.addEventListener('click', () => {
    if (!selectedUser) return;

    socket.emit('send-zumbido', {
        toUserId: selectedUser.userId
    });

    // Mostrar en el chat emisor
    appendZumbidoMessage(`─────⚡ Le enviaste un zumbido a ${selectedUser.username} ⚡─────`);
});