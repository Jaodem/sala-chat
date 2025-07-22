import { showStatusMessage, appendMessageBubble, appendZumbidoMessage, appendDateSeparator, formatDateSeparator, scrollToBottom, hideScrollBtn } from "../components/chat/messageUI.js";

export function registerSocketHandlers(socket, {
    getToken,
    getCurrentUserId,
    setCurrentUserId,
    getSelectedUserId,
    getSelectedUser,
    getUsers,
    setUsers,
    setUnread,
    renderUserList,
    sentMessages,
    pendingConfirmations,
    confirmedMessages,
    lastMessagesByUser,
    messageContainer,
    notificationSound,
    zumbidoSound
}) {
    socket.on('connect', () => {
        console.log('✅ Socket conectado');
        try {
            const payload = JSON.parse(
                atob(getToken().split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
            );
            setCurrentUserId(payload.userId);
        } catch (error) {
            console.error("No se pudo decodificar el token", error);
        }
    });

    socket.on('user-list', list => {
        setUsers(list);
        renderUserList();
    });

    socket.on('user-connected', ({ userId, username }) => {
        setUsers([...getUsers(), { userId, username }]);
        renderUserList();
        showStatusMessage(`${username} se conectó`, 'connect');
    });

    socket.on('user-disconnected', ({ userId }) => {
        const gone = getUsers().find(u => u.userId === userId);
        setUsers(getUsers().filter(u => u.userId === userId));
        renderUserList();
        showStatusMessage(`${gone?.username || 'Usuario'} se desconectó`, 'disconnect');
    });

    socket.on('disconnect', () => {
        console.log('🔌 Socket desconectado');
        showStatusMessage('Desconectado del servidor', 'disconnect');
    });

    // Manejo de mensajes privados
    handlePrivateMessage(socket, {
        getCurrentUserId, // 👈 Pasamos función
        getSelectedUserId,
        getSelectedUser,
        users: getUsers(),
        messageContainer,
        sentMessages,
        confirmedMessages,
        pendingConfirmations,
        lastMessagesByUser,
        appendMessageBubble,
        markUserAsUnread: (userId) => setUnread(userId, true),
        notificationSound,
        renderUserList,
        confirmIfNeeded: (messageId, senderId) => {
            socket.emit('confirm-message', { messageId, senderId });
            confirmedMessages.add(messageId);
            const bubble = sentMessages.get(messageId);
            const statusEl = bubble?.querySelector(`[data-mid="${messageId}"]`);
            if (statusEl) statusEl.textContent = '✓✓';
        }
    })
}

export function handlePrivateMessage(socket, {
    getCurrentUserId,
    getSelectedUserId,
    getSelectedUser,
    users,
    messageContainer,
    sentMessages,
    confirmedMessages,
    pendingConfirmations,
    lastMessagesByUser,
    appendMessageBubble,
    markUserAsUnread,
    notificationSound,
    renderUserList,
    confirmIfNeeded
}) {
    socket.on('private-message', payload => {
        console.log('📩 Recibido mensaje con ID:', payload.messageId);
        const currentUserId = getCurrentUserId();
        const selectedUserId = getSelectedUserId();

        const isOwn = payload.userId === currentUserId;
        const talkingWith = isOwn ? payload.toUserId : payload.userId;
        const isForCurrentConversation = selectedUserId && talkingWith === selectedUserId;

        // Guardar el último mensaje
        lastMessagesByUser.set(talkingWith, {
            text: payload.message,
            createdAt: payload.createdAt
        });

        if (isForCurrentConversation) {
            appendMessageBubble(payload.message, payload.createdAt, isOwn, payload.messageId);
        } else {
            markUserAsUnread(talkingWith);

            if (isOwn) appendMessageBubble(payload.message, payload.createdAt, true, payload.messageId);
        }

        // Sonido de notificatión solo si no está en el chat actual
        if (!isOwn && !isForCurrentConversation) {
            try {
                notificationSound.currentTime = 0;
                notificationSound.play();
            } catch (error) {
                console.warn("No se pudo reproducir el sonido:", error);
            }
        }

        if (!isOwn && isForCurrentConversation) confirmIfNeeded(payload.messageId, payload.userId);

        renderUserList();
    });
}