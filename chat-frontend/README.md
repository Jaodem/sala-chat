# Sala Chat - Frontend

Este es el frontend del proyecto **Sala Chat**, una aplicación de mensajería en tiempo real desarrollada con JavaScript puro (sin frameworks) y TailwindCSS.

## 🌐 Características

- SPA ligera con navegación entre chat y perfil.
- Interfaz responsive usando TailwindCSS.
- Alternancia de tema claro/oscuro.
- Vista de usuarios en línea y mensajes en tiempo real.
- Previsualización de mensajes recientes.
- Notificaciones visuales para mensajes no leídos.
- Gestión de cuenta:
  - Cambio de contraseña.
  - Eliminación de cuenta.
- Alerta visual en caso de errores o acciones exitosas.

## 🚀 Tecnologías utilizadas

- HTML5 + CSS3 (con TailwindCSS CDN)
- JavaScript (ES Modules)
- WebSockets (con Socket.io)
- Fetch API
- LocalStorage / JWT para autenticación
- Diseño basado en componentes reutilizables

## 📦 Estructura del proyecto

```
chat-frontend/
├── js/
│   ├── components/
│   │   ├── chat/
│   │   │   ├── chatHistory.js
│   │   │   ├── messageUI.js
│   │   │   └── userListUI.js
│   │   ├── passwordRules.js
│   │   └── togglePasswordVisibility.js
│   ├── pages/
│   │   ├── cambiar-contraseña.js
│   │   ├── chat.js
│   │   ├── confirmar-cuenta.js
│   │   ├── index.js
│   │   ├── login.js
│   │   ├── perfil.js
│   │   ├── recuperar-cuenta.js
│   │   ├── register.js
│   │   ├── restablecer-contraseña.js
│   │   └── verificar-email.js
│   ├── sockets/
│   │   └── socketHandlers.js
│   ├── state/
│   │   └── userState.js
│   ├── theme/
│   │   └── themeToggle.js
│   └── utils/
│   │   ├── checkAuth.js
│   │   ├── countdownButton.js
│   │   ├── domUtils.js
│   │   ├── showAlert.js
│   │   └── validatePasswordStrength.js
├── public/
│   ├── notification-zumbido.mp3
│   └── notification.mp3
├── cambiar-contraseña.html
├── chat.html
├── confirmar-cuenta.html
├── index.html
├── login.html
├── perfil.html
├── README.md
├── recuperar-cuenta.html
├── register.html
├── restablecer-contraseña.html
└── verificar-email.html
```

## 🔧 Requisitos

- Backend en funcionamiento (ver [\`chat-backend\`](../chat-backend/README.md))
- Navegador moderno con soporte para ES Modules

## 🛠️ Instalación y ejecución

1. Clonar el repositorio y moverse al frontend:

```bash
git clone https://github.com/tuusuario/sala-chat.git
cd sala-chat/chat-frontend
```

2. Abrí \`index.html\` directamente en tu navegador, o usá una extensión como **Live Server** si estás en VSCode.

> **Nota:** asegurate de que el backend esté corriendo en \`http://localhost:3000\`, o ajustá las URLs en los archivos JS si estás usando otro puerto o dominio.

## 🧪 Consejos para testing

- Probá el cambio de tema.
- Simulá varios usuarios en ventanas incógnitas u otros navegadores para ver los mensajes en tiempo real.
- Revisá el sistema de alertas y errores en formularios.

---

## Autor

José Augusto Orellana

---

## Licencia

MIT