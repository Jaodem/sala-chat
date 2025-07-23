export function setupThemeToggle(buttonId = 'themeToggle') {
    const toggleBtn = document.getElementById(buttonId);
    if (!toggleBtn) return;

    // Aplicar tema guardado al cargar
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
        toggleBtn.textContent = '☀️';
    } else {
        document.documentElement.classList.remove('dark');
        toggleBtn.textContent = '🌙';
    }

    // Listener para el botón
    toggleBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        toggleBtn.textContent = isDark ? '☀️' : '🌙';
    });
}