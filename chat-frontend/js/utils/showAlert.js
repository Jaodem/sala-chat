export function showAlert(container, message, type = 'info', duration = 5000) {
    const color = type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue';

    container.innerHTML = `
        <div class="p-3 rounded-xl text-${color}-800 bg-${color}-100 border border-${color}-300 text-sm">
            ${message}
        </div>
    `;

    setTimeout(() => {
        container.innerHTML = '';
    }, duration);
}