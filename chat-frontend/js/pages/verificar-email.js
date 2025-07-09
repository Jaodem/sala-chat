import { startCountdown } from "../utils/countdownButton.js";

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

// Establecer texto inicial
resendBtn.textContent = 'Reenviar correo de verificación'

// Reenviar correo
resendBtn.addEventListener('click', async () => {
  if (!pendingEmail) return;

  // Se desactiva el botón y se inicia el temporizador
  startCountdown(resendBtn, 60, 'Reenviar correo de verificación');

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

// Función auxiliar para desactivar el botón si no hay correo
function disableResendButton() {
  resendBtn.disabled = true;
  resendBtn.classList.add('opacity-50', 'cursor-not-allowed');
}