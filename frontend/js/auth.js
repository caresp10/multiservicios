// Servicio de autenticación
class AuthService {
    static login(username, password) {
        return fetch(`${CONFIG.API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem(CONFIG.TOKEN_KEY, data.data.token);
                localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(data.data));
                return data.data;
            } else {
                throw new Error(data.message);
            }
        });
    }

    static logout() {
        // Limpiar completamente el localStorage
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        localStorage.clear(); // Asegurarse de limpiar todo

        // Forzar recarga sin caché y redireccionar
        window.location.replace('../index.html');
    }

    static getToken() {
        return localStorage.getItem(CONFIG.TOKEN_KEY);
    }

    static getUser() {
        const userData = localStorage.getItem(CONFIG.USER_KEY);
        return userData ? JSON.parse(userData) : null;
    }

    static isAuthenticated() {
        return this.getToken() !== null;
    }

    static checkAuth() {
        if (!this.isAuthenticated()) {
            // Detectar si estamos en /pages/ o en raíz
            const path = window.location.pathname;
            window.location.href = path.includes('/pages/') ? '../index.html' : 'index.html';
        }
    }
}
