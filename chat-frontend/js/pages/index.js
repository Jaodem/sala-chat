import { redirectIfLoggedIn } from "../utils/checkAuth.js";
import { setupThemeToggle } from "../theme/themeToggle.js";

setupThemeToggle();

redirectIfLoggedIn(); // Redirige al chat si ya tiene al sesión iniciada