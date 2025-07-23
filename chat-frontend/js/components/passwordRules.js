import { isPasswordStrong } from "../utils/validatePasswordStrength.js";

export function attachPasswordRules(inputElement) {
    const wrapper = document.getElementById('password-rules-container');

    // Crear estructura
    const rules = document.createElement('ul');
    rules.className = 'hidden mt-2 w-full text-sm text-gray-700 dark:text-gray-100 space-y-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl p-2 shadow';
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
        const rulesStatus = isPasswordStrong(password);
        for (const rule in rulesStatus) {
            updateRule(rule, rulesStatus[rule]);
        }
    }

    // Listeners
    inputElement.addEventListener('input', (e) => validate(e.target.value));

    inputElement.addEventListener('focus', () => {
        rules.classList.remove('hidden');
    });

    document.addEventListener('focusin', (e) => {
        const target = e.target;
        const isPasswordField = target === inputElement;
        const isToggleBtn = target === document.querySelector('#togglePassword');

        if (!isPasswordField && !isToggleBtn) {
            rules.classList.add('hidden');
        }
    });
}