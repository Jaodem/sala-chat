import { setupThemeToggle } from "../theme/themeToggle.js";
import { showAlert } from "../utils/showAlert.js";
import { attachPasswordRules } from "../components/passwordRules.js";
import { addPasswordToggle } from "../components/togglePasswordVisibility.js";
import { isPasswordValid } from "../utils/validatePasswordStrength.js";

// Habilitar el tema oscuro
setupThemeToggle();

// Elementos del DOM
const tokenError = document.getElementById('tokenError');
const usernameInfo = document.getElementById('usernameInfo');
const resetForm = document.getElementById('resetForm');
const alertContainer = document.getElementById('alertContainer');

const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');

// Obtener token desde la URL
const params = new URLSearchParams(window.location.search);
const token = params.get('token');

// Verificar token con el backend
(async function verifyToken() {
    if (!token) {
        tokenError.textContent = 'Token no proporcionado';
        tokenError.classList.remove('hidden');
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/api/auth/verify-reset-token?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
            tokenError.textContent = data.message || 'Token inválido o expirado';
            tokenError.classList.remove('hidden');
            return;
        }

        // Mostrar username y formulario
        usernameInfo.textContent = `Hola, ${data.username}. Ingresá tu nueva contraseña.`;
        resetForm.classList.remove('hidden');
    } catch (error) {
        tokenError.textContent = 'Error al verificar el token';
        tokenError.classList.remove('hidden');
    }
})();

// Mostrar reglas de validación visual
attachPasswordRules(passwordInput);

// Mostrar/ocultar contraseña y confirmación
addPasswordToggle('#password', '#togglePassword');
addPasswordToggle('#confirmPassword', '#toggleConfirmPassword');

// Enviar nueva contraseña
resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!isPasswordValid(password)) {
        showAlert(
            alertContainer,
            'La contraseña debe tener al menos 6 caracteres e incluir minúscula, mayúscula, número y símbolo especial',
            'error'
        );
        return;
    }

    if (password !== confirmPassword) {
        showAlert(alertContainer, 'Las contraseñas no coinciden', 'error');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showAlert(alertContainer, data.message || 'Error al restablecer la contraseña', 'error');
            return;
        }

        showAlert(alertContainer, '¡Contraseña restablecida con éxito! Redirigiendo al login...', 'success');
        resetForm.reset();

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
    } catch (error) {
        console.error(error);
        showAlert(alertContainer, 'Error de red o del servidor', 'error');
    }
});