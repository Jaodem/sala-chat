import { createElement } from "../../utils/domUtils.js";

// Contenedor de mensajes
let messageContainer;
let scrollBtn;
let sentMessages;
let pendingConfirmations;
let statusMessageEl;

// Inicialización: se recibe referencias para trabajar con el DOM y variables compartidas
export function initMessageUI(container, scrollButton, sentMap, pendingMap, statusEl) {
    messageContainer = container;
    scrollBtn = scrollButton;
    sentMessages = sentMap;
    pendingConfirmations = pendingMap;
    statusMessageEl = statusEl;
}

// Pintar burbujas
export function appendMessageBubble(text, isoDate, isOwn, messageId = null){
    const bubble = document.createElement('div');
    bubble.classList.add(
        'max-w-[70%]', 'px-4', 'py-2', 'rounded-xl', 'shadow',
        'text-sm', 'break-words',
        ...(isOwn
            ? ['bg-blue-600', 'text-white', 'self-end']
            : ['bg-gray-200', 'text-gray-800', 'self-start'])
    );

    const status = isOwn && messageId
        ? `<span class="ml-1 text-xs align-bottom opacity-70" data-mid="${messageId}">✓</span>`
        : '';
    
        bubble.innerHTML = `
        <p>${text}</p>
        <span class="block text-[10px] mt-1 opacity-70 ${isOwn ? 'text-right' : ''}">
            ${formatTime(isoDate)} ${status}
        </span>
    `;

    messageContainer.appendChild(bubble);

    if (isOwn && messageId) {
        sentMessages.set(messageId, bubble);
        if (pendingConfirmations.messages.has(messageId)) {
            const statusEl = bubble.querySelector(`[data-mid="${messageId}"]`);
            if (statusEl) statusEl.textContent = '✓✓';
            pendingConfirmations.messages.delete(messageId);
        }
    }

    if (isOwn || isNearBottom(messageContainer)) {
        scrollToBottom({
            smooth: true
        });
        hideScrollBtn();
    } else {
        scrollBtn.classList.remove('hidden');
    }

    return bubble;
}

// Separador de fecha
export function appendDateSeparator(text) {
    const separator = document.createElement('div');
    separator.className = 'text-xs text-gray-500 text-center my-4 select-none';
    separator.textContent = `───── ${text} ─────`;
    messageContainer.appendChild(separator);
    scrollToBottom();
}

// Formato hora
export function formatTime(dateString) {
    const d = new Date(dateString);
    const today = new Date();
    const isToday = 
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
    
    const time = d.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    if (isToday) return time;

    const date = d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    return `${time} ${date}`;
}

// Separador: hoy, ayer o fecha completa
export function formatDateSeparator(dateString) {
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

// Scroll y helpers
export function isNearBottom(elem, offset = 80) {
    return elem.scrollTop + elem.clientHeight >= elem.scrollHeight - offset;
}

export function scrollToBottom({ smooth = true } = {}) {
    void messageContainer.offsetHeight;
    messageContainer.scrollTo({
        top: messageContainer.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
    });
}

export function hideScrollBtn(delay = 350) {
    setTimeout(() => scrollBtn.classList.add('hidden'), delay);
}

export function appendZumbidoMessage(text) {
    const separator = createElement('div', 'text-xs text-yellow-600 text-center my-4 select-none font-semibold', text);
    messageContainer.appendChild(separator);
    scrollToBottom();
}

export function showStatusMessage(text, type = 'info') {
    if (!statusMessageEl) return;

    statusMessageEl.textContent = text;
    statusMessageEl.className = 'text-sm font-medium px-4 py-2 rounded-xl shadow transition';

    if (type === 'connect') statusMessageEl.classList.add('bg-green-100', 'text-green-700');
    else if (type === 'disconnect') statusMessageEl.classList.add('bg-red-100', 'text-red-700');
    else statusMessageEl.classList.add('bg-gray-100', 'text-gray-700');

    setTimeout(() => {
        statusMessageEl.textContent = '';
        statusMessageEl.className = '';
    }, 5000);
}