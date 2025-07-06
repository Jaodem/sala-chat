export function attachPasswordRules(inputElement) {
    // Crear estructura
    const rules = document.createElement('ul');
    rules.className = 'mt-2 text-sm text-gray-600 space-y-1 hidden';
    rules.id = 'passwordRules';

    rules.innerHTML = `
        <li><span data-rule="length" class="mr-2 text-red-500">❌</span>Al menos 6 caracteres</li>
        <li><span data-rule="lower" class="mr-2 text-red-500">❌</span>Una letra minúscula</li>
        <li><span data-rule="upper" class="mr-2 text-red-500">❌</span>Una letra mayúscula</li>
        <li><span data-rule="number" class="mr-2 text-red-500">❌</span>Un número</li>
        <li><span data-rule="symbol" class="mr-2 text-red-500">❌</span>Un símbolo especial (@$!%*#?&_-)</li>
    `;

    // Insertar justo después del input
    inputElement.parentNode.insertBefore(rules, inputElement.nextSibling);

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
        setTimeout(() => rules.classList.add('hidden'), 100);
    });
}