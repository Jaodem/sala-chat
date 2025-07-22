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
}