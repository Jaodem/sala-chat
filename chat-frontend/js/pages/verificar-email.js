import { startCountdown } from "../utils/countdownButton.js";
import { showAlert } from "../utils/showAlert.js";

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
      showAlert(alertContainer, data.message || 'Error al reenviar el correo', 'error');
      return;
    }

    showAlert(alertContainer, 'Correo reenviado con éxito. Revisá tu bandeja de entrada.', 'success');
  } catch (err) {
    console.error(err);
    showAlert(alertContainer, 'Error de red o del servidor', 'error');
  }
});

// Función auxiliar para desactivar el botón si no hay correo
function disableResendButton() {
  resendBtn.disabled = true;
  resendBtn.classList.add('opacity-50', 'cursor-not-allowed');
}