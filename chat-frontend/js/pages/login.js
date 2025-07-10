import { redirectIfLoggedIn } from "../utils/checkAuth.js";
import { addPasswordToggle } from "../components/togglePasswordVisibility.js";
import { showAlert } from "../utils/showAlert.js";

// Se redirecciona si el usuario ya está logueado
redirectIfLoggedIn();

const form = document.getElementById('loginForm');
const alertCotaniner = document.getElementById('alertContainer');

addPasswordToggle('#password', '#togglePassword');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const identifier = form.identifier.value.trim();
    const password = form.password.value;

    if (!identifier || identifier.length < 3) {
        showAlert(alertCotaniner, 'Por favor, ingresá tu email o usuario válido (al menos 3 caracteres)', 'error');
        return;
    }

    if (!password || password.length < 6) {
        showAlert(alertCotaniner, 'La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ identifier, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            showAlert(alertCotaniner, data.message || 'Credenciales inválidas', 'error');
            return;
        }

        localStorage.setItem('token', data.token);

        showAlert(alertCotaniner, 'Inicio de sesión exitoso. Redirigiendo...', 'success');

        setTimeout(() => {
            window.location.href = 'chat.html';
        }, 2000);
    } catch (err) {
        console.error(err);
        showAlert(alertCotaniner, 'Error de red o del servidor', 'error');
    }
});