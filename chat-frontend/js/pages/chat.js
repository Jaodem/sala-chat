import { getToken, logout, redirectIfNotLoggedIn } from "../utils/checkAuth.js";
import { io } from 'https://cdn.socket.io/4.5.4/socket.io.esm.min.js';
import { initMessageUI, appendMessageBubble, appendDateSeparator, formatTime, formatDateSeparator, isNearBottom, scrollToBottom, hideScrollBtn, appendZumbidoMessage, showStatusMessage } from "../components/chat/messageUI.js";
import { createElement } from "../utils/domUtils.js";
import { registerSocketHandlers, handleTypingEvents } from "../sockets/socketHandlers.js";
import { getCurrentUserId, setCurrentUserId, getSelectedUserId, getSelectedUser, setSelectedUser, getUsers, setUsers, getUnread, markAsUnread, clearUnread } from '../state/userState.js';

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

// Inicializar messageUI
initMessageUI(messageContainer, scrollBtn, sentMessages, pendingConfirmations, statusMessage);

registerSocketHandlers(socket, {
    getToken: getTokenWrapper,
    getCurrentUserId,
    setCurrentUserId,
    getSelectedUserId,
    getSelectedUser,
    getUsers,
    setUsers,
    setUnread: markUserAsUnread, //
    renderUserList,
    sentMessages,
    pendingConfirmations,
    confirmedMessages,
    lastMessagesByUser,
    messageContainer,
    notificationSound,
    zumbidoSound
});

// Envío de mensajes
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');

handleTypingEvents(socket, {
    getSelectedUserId,
    getCurrentUserId,
    getUsers,
    getSelectedUser,
    messageInput,
    typingIndicator
});

// Funciones auxiliares
function getTokenWrapper() {
    return token;
}

function sortAndFilter(list) {
    const currentUserId = getCurrentUserId();
    return list
        .filter(u => u.userId !== currentUserId)
        .sort((a, b) =>
            a.username.localeCompare(b.username, 'es', { sensitivity: 'base' })
        );
}

function createUserListItem(user) {
    const selectedUserId = getSelectedUserId();
    const unread = getUnread();
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

    const users = getUsers();
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
    setSelectedUser(user);
    chatWith.textContent = `Chat con ${user.username}`;

    clearUnread(user.userId);

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
    const users = getUsers();
    const user = users.find(u => u.userId === uid);
    if (!user) return;
    selectUser(user);
});

// Marcar usuario con mensaje no leído
function markUserAsUnread(userId) {
    const selectedUserId = getSelectedUserId();
    const unread = getUnread();

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
            const isOwn = msg.userId === getCurrentUserId();
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

// Logout
logoutBtn.addEventListener('click', () => {
    logout();
    window.location.href = 'index.html';
});

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const text = messageInput.value.trim();
    const user = getSelectedUser();
    if (!text || !user) return;

    socket.emit('send-message', {
        toUserId: user.userId,
        toUsername: user.username,
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
    if (fromUserId === getSelectedUserId()) {
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
    const selectedUser = getSelectedUser();
    if (!selectedUser) return;

    socket.emit('send-zumbido', {
        toUserId: selectedUser.userId
    });

    // Mostrar en el chat emisor
    appendZumbidoMessage(`─────⚡ Le enviaste un zumbido a ${selectedUser.username} ⚡─────`);
});