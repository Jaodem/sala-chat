import { getCurrentUserId } from "../../state/userState.js";
import { appendDateSeparator, appendMessageBubble, appendZumbidoMessage, formatDateSeparator } from "./messageUI.js";

export async function loadChatMessages(userId, token, messageContainer, pendingConfirmations, lastMessagesByUser, confirmIfNeeded) {
    messageContainer.innerHTML = '';

    try {
        const res = await fetch(`http://localhost:3000/api/chat/history/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) {
            messageContainer.innerHTML = '<p class="text-red-500">No se pudo cargar el historial.</p>';
            return;
        }

        const { data: message} = await res.json();
        let lastDate = null;

        message.forEach(msg => {
            const isOwn = msg.userId === getCurrentUserId();
            const msgDate = new Date(msg.createdAt).toDateString();

            if (msgDate !== lastDate) {
                appendDateSeparator(formatDateSeparator(msg.createdAt));
                lastDate = msgDate;
            }
            
            appendMessageBubble(msg.message, msg.createdAt, isOwn, msg._id);
            if (!isOwn) confirmIfNeeded(msg._id, msg.userId);
        });

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
    } catch(error) {
        console.error('Error al cargar historial:', error);
        messageContainer.innerHTML = '<p class="text-red-500">Error de red al cargar historial.</p>';
    }
}