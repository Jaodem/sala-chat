export function attachPasswordRules(inputElement) {
    const wrapper = document.getElementById('password-rules-container');

    // Crear estructura
    const rules = document.createElement('ul');
    rules.className = 'hidden mt-2 w-full text-sm text-gray-600 space-y-1 bg-white border rounded-xl p-2 shadow';
    rules.id = 'passwordRules';

    rules.innerHTML = `
        <li><span data-rule="length" class="mr-2 text-red-500">❌</span>Al menos 6 caracteres</li>
        <li><span data-rule="lower" class="mr-2 text-red-500">❌</span>Una letra minúscula</li>
        <li><span data-rule="upper" class="mr-2 text-red-500">❌</span>Una letra mayúscula</li>
        <li><span data-rule="number" class="mr-2 text-red-500">❌</span>Un número</li>
        <li><span data-rule="symbol" class="mr-2 text-red-500">❌</span>Un símbolo especial (@$!%*#?&_-)</li>
    `;

    // Insertar dentro del wrapper
    wrapper.appendChild(rules);

    // Actualizar los ítems
    function updateRule(name, valid) {
        const el = rules.querySelector(`[data-rule="${name}"]`);
        if (el) {
            el.textContent = valid ? '✔️' : '❌';
            el.classList.remove('text-red-500', 'text-green-500');
            el.classList.add(valid ? 'text-green-600' : 'text-red-500');
        }
    }

    // Lógica de validación
    function validate(password) {
        updateRule('length', password.length >= 6);
        updateRule('lower', /[a-z]/.test(password));
        updateRule('upper', /[A-Z]/.test(password));
        updateRule('number', /\d/.test(password));
        updateRule('symbol', /[@$!%*#?&_\-]/.test(password));
    }

    // Listeners
    inputElement.addEventListener('input', (e) => validate(e.target.value));

    inputElement.addEventListener('focus', () => {
        rules.classList.remove('hidden');
    });

    inputElement.addEventListener('blur', () => {
        // Esperamos un momento y luego verificamos si el foco sigue en el input o en el botón
        setTimeout(() => {
            const active = document.activeElement;
            const wrapper = inputElement.closest('#password-wrapper');

            if (!wrapper.contains(active)) {
                rules.classList.add('hidden');
            }
        }, 100);
    });
}