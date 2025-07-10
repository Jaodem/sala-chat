import { redirectIfLoggedIn } from "../utils/checkAuth.js";
import { attachPasswordRules } from "../components/passwordRules.js";
import { addPasswordToggle } from "../components/togglePasswordVisibility.js";
import { isPasswordValid } from "../utils/validatePasswordStrength.js";
import { showAlert } from "../utils/showAlert.js";

// Se redirecciona si el usuario ya está logueado
redirectIfLoggedIn();

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

    // Validación de fortaleza de la contraseña
    if (!isPasswordValid(password)) {
        showAlert(alertContainer, 'La contraseña no cumple con los requisitos mínimos de seguridad.', 'error');
        return;
    }

    // Validación simple de coincidencia de contraseñas
    if (password !== confirmPassword) {
        showAlert(alertContainer, 'Las contraseñas no coinciden', 'error');
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
                    alertContainer,
                    'Este correo ya está registrado pero no fue verificado. Te enviamos un nuevo email para confirmar tu cuenta. Redirigiendo a verificación...',
                    'info'
                );

                setTimeout(() => {
                    window.location.href = 'verificar-email.html';
                }, 5000); // Espera 5 segundos antes de redirigir
                return;
            }

            if (data.code === 'EMAIL_VERIFIED') {
                showAlert(
                    alertContainer,
                    'Este correo ya está registrado y confirmado. Redirigiendo al inicio de sesión...',
                    'info'
                );

                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 4000);
                return;
            }

            showAlert(alertContainer, data.message || 'Ocurrió un error durante el registro', 'error');
            return;
        }

        // Registro exitoso
        sessionStorage.setItem('pendingEmail', email);
        showAlert(alertContainer, 'Registro exitoso. Revisa tu correo para verificar tu cuenta. Redirigiendo a verificación...', 'success');

        form.reset();

        setTimeout(() => {
            window.location.href = 'verificar-email.html';
        }, 3000);
    } catch (err) {
        console.error(err);
        showAlert(alertContainer, 'Error de red o del servidor', 'error');
    }
});