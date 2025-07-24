# Sala Chat - Backend

Este es el backend del proyecto **Sala Chat**, una aplicación de mensajería en tiempo real desarrollada con Node.js, Express, Socket.io y MongoDB.

## Características

- Registro de usuarios con verificación por correo electrónico.
- Inicio de sesión con JWT.
- Recuperación de contraseña con envío de email.
- Reenvío de correos de verificación y recuperación.
- Cambio de contraseña desde la cuenta autenticada.
- Eliminación de cuenta.
- Envío y recepción de mensajes en tiempo real.
- Historial de conversaciones (global y por usuario).
- API RESTful protegida con middleware de autenticación.

## Tecnologías utilizadas

- Node.js
- Express
- MongoDB (con Mongoose)
- Socket.io
- JWT (jsonwebtoken)
- Nodemailer (Ethereal para pruebas)
- dotenv
- bcrypt

## Requisitos

- Node.js v18+
- MongoDB Atlas (o local)
- Cuenta Ethereal (para pruebas de envío de correos)

## Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/tuusuario/sala-chat.git
cd sala-chat/chat-backend
```

2. Instalar dependencias:

```bash
npm install
```

3. Crear un archivo `.env` con el siguiente contenido:

```
PORT=3000
MONGO_URI=TU_CONEXIÓN_MONGODB
JWT_SECRET=TU_SECRETO_JWT
```

4. Ejecutar el servidor:

```bash
npm run dev
```

## Scripts disponibles

- `npm run dev` - Ejecuta el servidor en modo desarrollo con nodemon.
- `npm start` - Ejecuta el servidor en producción.

## Estructura del proyecto

```
chat-backend/
├── controllers/
├── middleware/
├── models/
├── routes/
├── utils/
├── .env
├── server.js
├── package.json
└── README.md
```

---

## Autor

José Augusto Orellana

---

## Licencia

MIT