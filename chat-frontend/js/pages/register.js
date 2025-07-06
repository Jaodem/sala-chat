import { attachPasswordRules } from "../components/passwordRules.js";

// Módulo para manejar el registro de usuario
const form = document.getElementById('registerForm');
const alertContainer = document.getElementById('alertContainer');
const passwordInput = document.getElementById('password');

// Activar validación visual de contraseña
attachPasswordRules(passwordInput);

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtener datos del formulario
    const username = form.username.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    // Validación simple de coincidencia de contraseñas
    if (password !== confirmPassword) {
        showAlert('Las contraseñas no coinciden', 'error');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            showAlert(data.message || 'Ocurrió un error durante el registro', 'error');
            return;
        }

        // Registro exitoso
        showAlert('Registro exitoso. Revisa tu correo para verificar tu cuenta.', 'success');

        form.reset();
    } catch (err) {
        console.error(err);
        showAlert('Error de red o del servidor', 'error');
    }
});

// Función auxiliar para mostrar alertas
function showAlert(message, type = 'info') {
    const color = type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue';

    alertContainer.innerHTML = `
        <div class="p-3 rounded-xl text-${color}-800 bg-${color}-100 border border-${color}-300 text-sm">
        ${message}
        </div>
    `;

    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}