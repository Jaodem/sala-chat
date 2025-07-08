const resendBtn = document.getElementById('resendBtn');
const alertContainer = document.getElementById('alertContainer');
const emailInfo = document.getElementById('emailInfo');

// Mostrar el email pendiente (si existe)
const pendingEmail = sessionStorage.getItem('pendingEmail');

if (pendingEmail) {
  emailInfo.textContent = `Correo: ${pendingEmail}`;
} else {
  emailInfo.textContent = `No se encontró un correo pendiente.`;
  disableResendButton();
}

// Reenviar correo
resendBtn.addEventListener('click', async () => {
  if (!pendingEmail) return;

  // Se desactiva el botón y se inicia el temporizador
  startCountdown(60); // En segundos

  try {
    const response = await fetch('http://localhost:3000/api/auth/resend-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: pendingEmail }),
    });

    const data = await response.json();

    if (!response.ok) {
      showAlert(data.message || 'Error al reenviar el correo', 'error');
      return;
    }

    showAlert('Correo reenviado con éxito. Revisá tu bandeja de entrada.', 'success');
  } catch (err) {
    console.error(err);
    showAlert('Error de red o del servidor', 'error');
  }
});

// Función para mostrar alertas
function showAlert(message, type = 'info') {
  const color = type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue';

  alertContainer.innerHTML = `
    <div class="mt-4 p-3 rounded-xl text-${color}-800 bg-${color}-100 border border-${color}-300 text-sm">
      ${message}
    </div>
  `;

  setTimeout(() => {
    alertContainer.innerHTML = '';
  }, 5000);
}
 // Cuenta regresiva con botón deshabilitado
 function startCountdown(seconds) {
    let remaining = seconds;
    resendBtn.disabled = true;
    resendBtn.classList.add('opacity-50', 'cursor-not-allowed');

    const interval = setInterval(() => {
        resendBtn.textContent = `Reenviar en ${remaining}`;
        remaining--;

        if (remaining < 0) {
            clearInterval(interval);
            resendBtn.disabled = false;
            resendBtn.textContent = 'Reenviar correo de verificación';
            resendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }, 1000);
 }

 // Función auxiliar para desactivar el botón si no hay correo
 function disableResendButton() {
    resendBtn.disabled = true;
    resendBtn.classList.add('opacity-50', 'cursor-not-allowed');
 }