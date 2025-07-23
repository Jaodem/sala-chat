import { setupThemeToggle } from "../theme/themeToggle.js";
import { showAlert } from "../utils/showAlert.js";
import { isPasswordValid } from "../utils/validatePasswordStrength.js";
import { attachPasswordRules } from "../components/passwordRules.js";
import { addPasswordToggle } from "../components/togglePasswordVisibility.js";
import { redirectIfNotLoggedIn, getToken } from "../utils/checkAuth.js";

// Habilitar el tema oscuro
setupThemeToggle();

// Redireccionar en caso de no estar logueado
redirectIfNotLoggedIn();

// Elementos del DOM
const form = document.getElementById('changePasswordForm');
const alertContainer = document.getElementById('alertContainer');

const currentPasswordInput = document.getElementById('currentPassword');
const newPasswordInput = document.getElementById('newPassword');
const confirmNewPasswordInput = document.getElementById('confirmNewPassword');

// Mostrar reglas de validación visualmente
attachPasswordRules(newPasswordInput);

// Mostrar/ocultar contraseñas
addPasswordToggle('#currentPassword', '#toggleCurrentPassword');
addPasswordToggle('#newPassword', '#toggleNewPassword');
addPasswordToggle('#confirmNewPassword', '#toggleconfirmNewPassword');

// Enviar formulario
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = currentPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmNewPassword = confirmNewPasswordInput.value.trim();

    // Validar nueva contraseña
    if (!isPasswordValid(newPassword)) {
        showAlert(alertContainer, 'La nueva contraseña no cumple con los requisitos de seguridad.', 'error');
        return;
    }

    // Confirmación
    if (newPassword !== confirmNewPassword) {
        showAlert(alertContainer, 'Las contraseñas no coinciden.', 'error');
        return;
    }

    try {
        const token = getToken();
        const res = await fetch('http://localhost:3000/api/auth/change-password', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await res.json();

        if (!res.ok) {
            showAlert(alertContainer, data.message || 'Error al cambiar la contraseña', 'error');
            return;
        }

        showAlert(alertContainer, '¡Contraseña cambiada correctamente!', 'success');
        form.reset();
    } catch (error) {
        console.error(error);
        showAlert(alertContainer, 'Error de red o del servidor', 'error');
    }
});