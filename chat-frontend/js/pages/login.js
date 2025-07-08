import { addPasswordToggle } from "../components/togglePasswordVisibility.js";

const form = document.getElementById('loginForm');
const alertCotaniner = document.getElementById('alertContainer');

addPasswordToggle('#password', '#togglePassword');

function showAlert(message, type = 'info') {
    const color = type === 'seccess' ? 'green' : type === 'error' ? 'red' : 'blue';

    alertCotaniner.innerHTML = `
        <div class="p-3 rounded-xl text-${color}-800 bg-${color}-100 border border-${color}-300 text-sm">
        ${message}
        </div>
    `;

    setTimeout(() => {
        alertCotaniner.innerHTML = '';
    }, 5000);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const identifier = form.identifier.value.trim();
    const password = form.password.value;

    if (!identifier || identifier.length < 3) {
        showAlert('Por favor, ingresá tu email o usuario válido (al menos 3 caracteres)', 'error');
        return;
    }

    if (!password || password.length < 6) {
        showAlert('La contraseña debe tener al menos 6 caracteres', 'error');
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
            showAlert(data.message || 'Credenciales inválidas', 'error');
            return;
        }

        localStorage.setItem('token', data.token);

        showAlert('Inicio de sesión exitoso. Redirigiendo...', 'success');

        setTimeout(() => {
            window.location.href = 'chat.html';
        }, 2000);
    } catch (err) {
        console.error(err);
        showAlert('Error de red o del servidor', 'error');
    }
});