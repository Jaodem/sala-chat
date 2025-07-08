export function startCountdown(buttonElement, seconds, defaultText = 'Reenviar') {
    let remaining = seconds;

    buttonElement.disabled = true;
    buttonElement.classList.add('opacity-50', 'cursor-not-allowed');

    const originalText = defaultText;

    buttonElement.textContent = `${originalText} (${remaining})`;

    const interval = setInterval(() => {
        remaining--;
        buttonElement.textContent = `${originalText} (${remaining})`;

        if (remaining <= 0) {
            clearInterval(interval);
            buttonElement.disabled = false;
            buttonElement.textContent = originalText;
            buttonElement.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }, 1000);
}