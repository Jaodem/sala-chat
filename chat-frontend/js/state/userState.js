let currentUserId = null;
let selectedUserId = null;
let selectedUser = null;
let users = [];
const unread = new Set();

export function getCurrentUserId() {
    return currentUserId;
}

export function setCurrentUserId(id) {
    currentUserId = id;
}

export function getSelectedUserId() {
    return selectedUserId;
}

export function getSelectedUser() {
    return selectedUser;
}

export function setSelectedUser(user) {
    selectedUser = user;
    selectedUserId = user?.userId ?? null;
}

export function getUsers() {
    return users;
}

export function setUsers(newUsers) {
    users.length = 0;
    users.push(...newUsers);
}

export function getUnread() {
    return unread;
}

export function markAsUnread(userId) {
    unread.add(userId);
}

export function clearUnread(userId) {
    unread.delete(userId);
}