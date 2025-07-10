// Obtener el token desde localStorage
export function getToken() {
    return localStorage.getItem('token');
}

// ¿Hay un token guardado?
export function isLoggedIn() {
    return !!getToken();
}

// Redirige al login si no hay sesión
export function redirectIfNotLoggedIn() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
    }
}

// Redirigir al chat si el usuario ya está logueado
export function redirectIfLoggedIn() {
    if (isLoggedIn()) {
        window.location.href = 'chat.html';
    }
}

// Para borrar sesión
export function logout() {
    localStorage.removeItem('token');
}