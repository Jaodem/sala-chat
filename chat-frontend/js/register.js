// Módulo para manejar el registro de usuario
const form = document.getElementById('registerForm');
const alertContainer = document.getElementById('alertContainer');

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

// Se selecciona el input de contraseña
const passwordInput = document.getElementById('password');

// Se seleccionar la lista
const passwordRules = document.getElementById('passwordRules');

// Mostra cuando el input tiene foco
passwordInput.addEventListener('focus', () => {
    passwordRules.style.display = 'block';
});

// Ocultar cuando se pierde el foco
passwordInput.addEventListener('blur', () => {
    setTimeout(() => {
        passwordRules.style.display = 'none';
    }, 100);
});

// Items de reglas
const ruleLength = document.getElementById('rule-length');
const ruleLower = document.getElementById('rule-lower');
const ruleUpper = document.getElementById('rule-upper');
const ruleNumber = document.getElementById('rule-number');
const ruleSymbol = document.getElementById('rule-symbol');

// Función que valida y actualiza reglas
function validatePasswordRules(password) {
    // Reglas individuales como expresiones regulares
    const hasLength = password.length >= 6;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[@$!%*#?&_\-]/.test(password);

    // Actualizamos cada ítem
    updateRule(ruleLength, hasLength);
    updateRule(ruleLower, hasLower);
    updateRule(ruleUpper, hasUpper);
    updateRule(ruleNumber, hasNumber);
    updateRule(ruleSymbol, hasSymbol);
}

// Actualiza un item visualmente
function updateRule(element, isValid) {
    element.textContent = isValid ? '✔️' : '❌';
    element.classList.remove('text-red-500', 'text-green-500');
    element.classList.add(isValid ? 'text-green-500' : 'text-red-500');
}

// Escuchar mientras el usuario escribe
passwordInput.addEventListener('input', (e) => {
    validatePasswordRules(e.target.value);
});