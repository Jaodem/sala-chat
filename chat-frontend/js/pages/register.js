import { attachPasswordRules } from "../components/passwordRules.js";
import { addPasswordToggle } from "../components/togglePasswordVisibility.js";

// Módulo para manejar el registro de usuario
const form = document.getElementById('registerForm');
const alertContainer = document.getElementById('alertContainer');
const passwordInput = document.getElementById('password');

// Activar validación visual de contraseña
attachPasswordRules(passwordInput);

// Mostrar/ocultar contraseñas (sin esperar DOMContentLoaded)
addPasswordToggle("#password", "#togglePassword");
addPasswordToggle("#confirmPassword", "#toggleConfirmPassword");


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
            if (data.code === 'EMAIL_NOT_VERIFIED') {
                sessionStorage.setItem('pendingEmail', email);
                showAlert(
                    'Este correo ya está registrado pero no fue verificado. Te enviamos un nuevo email para confirmar tu cuenta.',
                    'info'
                );

                setTimeout(() => {
                    window.location.href = 'verificar-email.html';
                }, 5000); // Espera 2.5 segundos antes de redirigir
                return;
            }

            showAlert(data.message || 'Ocurrió un error durante el registro', 'error');
            return;
        }

        // Registro exitoso
        showAlert('Registro exitoso. Revisa tu correo para verificar tu cuenta.', 'success');

        form.reset();

        setTimeout(() => {
            window.location.href = 'verificar-email.html';
        }, 3000);
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