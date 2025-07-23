import { setupThemeToggle } from "../theme/themeToggle.js";
import { showAlert } from "../utils/showAlert.js";
import { redirectIfNotLoggedIn, getToken, logout } from "../utils/checkAuth.js";

// Aplicar el cambio de tema
setupThemeToggle();

// Redireccionar en caso de no estar logueado
redirectIfNotLoggedIn();

const userInfoDiv = document.getElementById('userInfo');
const logoutBtn = document.getElementById('logoutBtn');
const deleteBtn = document.getElementById('deleteAccountBtn');
const token = getToken();

(async function getUserInfo() {
  try {
    const res = await fetch('http://localhost:3000/api/users/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const { data, message } = await res.json();

    if (!res.ok) {
      throw new Error(message || 'No se pudo obtener la información del perfil');
    }

    const { username, email } = data;
    userInfoDiv.innerHTML = `
      <p><strong>Usuario:</strong> ${username}</p>
      <p><strong>Email:</strong> ${email}</p>
    `;
  } catch (error) {
    console.error(error);
    userInfoDiv.innerHTML = `<p class="text-red-600">Error al cargar el perfil.</p>`;
  }
})();

// Cerrar sesión
logoutBtn.addEventListener('click', () => {
  logout();
  window.location.href = 'index.html';
});

// Eliminar cuenta
deleteBtn.addEventListener('click', async () => {
  const confirmDelete = confirm(
    '¿Estás seguro de que querés eliminar tu cuenta? Esta acción no se puede deshacer.'
  );
  if (!confirmDelete) return;

  const password = prompt('Por seguridad, ingresá tu contraseña para confirmar:');
  if (!password) {
    showAlert(userInfoDiv, 'Debés ingresar tu contraseña para continuar.', 'error');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/users/me', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ password })
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert(userInfoDiv, data.message || 'Error al eliminar la cuenta.', 'error');
      return;
    }

    logout();
    alert('Cuenta eliminada correctamente. ¡Te esperamos nuevamente!');
    window.location.href = 'index.html';
  } catch (err) {
    console.error(err);
    showAlert(userInfoDiv, 'Error de red o del servidor.', 'error');
  }
});
