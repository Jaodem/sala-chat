const messageEl = document.getElementById('message');

// Opcional mostrar el token para debuggear algo
const params = new URLSearchParams(window.location.search);
const token = params.get('token');

// Aplicar tema oscuro si estaba guardado
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') document.documentElement.classList.add('dark');

// Se muestra directamente el mensaje de éxito ya que la verificación se hizo en el back
messageEl.textContent = '¡Cuenta verificada con éxito! Redirigiendo al inicio de sesión...';

setTimeout(() => {
  window.location.href = 'login.html';
}, 3000);