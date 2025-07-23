import { getSelectedUserId, getUnread, getUsers } from "../../state/userState.js";
import { createElement } from "../../utils/domUtils.js";
import { formatTime } from "./messageUI.js";

export function sortAndFilter(list, currentUserId) {
    return list
        .filter(u => u.userId !== currentUserId)
        .sort((a, b) => a.username.localeCompare(b.username, 'es', { sensitivity: 'base' }));
}

export function createUserListItem(user, lastMessagesByUser) {
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

export function renderUserList(userListElement, lastMessagesByUser, getCurrentUserId) {
    const users = getUsers();
    const filtered = sortAndFilter(users, getCurrentUserId());
    const unread = getUnread();

    userListElement.innerHTML = '';

    if (filtered.length === 0) {
        const li = createElement('li', 'p-3 text-sm text-gray-500 italic', 'No hay otros usuarios conectados');
        userListElement.appendChild(li);
        return;
    }

    filtered.forEach(user => {
        const li = createUserListItem(user, lastMessagesByUser);
        userListElement.appendChild(li);
    });
}