export function addPasswordToggle(inputSelector, toggleBtnSelector) {
    const input = document.querySelector(inputSelector);
    const toggleBtn = document.querySelector(toggleBtnSelector);
    if (!input || !toggleBtn) return;

    // Íconos SVG
    const eyeIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
        </svg>
    `;

    const eyeOffIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.877-4.307M9.88 9.88a3 3 0 104.24 4.24M3 3l18 18" />
        </svg>
    `;

    let visible = false;
    toggleBtn.innerHTML = eyeIcon;

    // Evento toggle
    toggleBtn.addEventListener('click', () => {
        visible = !visible;
        input.type = visible ? 'text' : 'password';
        toggleBtn.innerHTML = visible ? eyeOffIcon : eyeIcon;
        input.focus();
    });
}