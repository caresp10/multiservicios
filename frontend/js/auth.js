// Servicio de autenticación
class AuthService {
    // Configuración de inactividad (en milisegundos)
    static INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos
    static WARNING_BEFORE_LOGOUT = 60 * 1000; // 1 minuto de advertencia
    static inactivityTimer = null;
    static warningTimer = null;
    static warningShown = false;

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
                // Iniciar monitoreo de inactividad
                AuthService.startInactivityMonitor();
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
        } else {
            // Si está autenticado, iniciar monitoreo de inactividad
            AuthService.startInactivityMonitor();
        }
    }

    // ========================================
    // SISTEMA DE CIERRE POR INACTIVIDAD
    // ========================================

    static startInactivityMonitor() {
        // Limpiar timers existentes
        AuthService.clearTimers();

        // Eventos que resetean el timer de inactividad
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        activityEvents.forEach(event => {
            document.addEventListener(event, AuthService.resetInactivityTimer, true);
        });

        // Iniciar el timer
        AuthService.resetInactivityTimer();
    }

    static resetInactivityTimer() {
        // Limpiar timers existentes
        AuthService.clearTimers();

        // Ocultar advertencia si estaba mostrada
        if (AuthService.warningShown) {
            AuthService.hideInactivityWarning();
        }

        // Timer para mostrar advertencia (TIMEOUT - WARNING tiempo antes)
        AuthService.warningTimer = setTimeout(() => {
            AuthService.showInactivityWarning();
        }, AuthService.INACTIVITY_TIMEOUT - AuthService.WARNING_BEFORE_LOGOUT);

        // Timer para cerrar sesión
        AuthService.inactivityTimer = setTimeout(() => {
            AuthService.logoutDueToInactivity();
        }, AuthService.INACTIVITY_TIMEOUT);
    }

    static clearTimers() {
        if (AuthService.inactivityTimer) {
            clearTimeout(AuthService.inactivityTimer);
            AuthService.inactivityTimer = null;
        }
        if (AuthService.warningTimer) {
            clearTimeout(AuthService.warningTimer);
            AuthService.warningTimer = null;
        }
    }

    static showInactivityWarning() {
        AuthService.warningShown = true;

        // Crear modal de advertencia si no existe
        let modal = document.getElementById('inactivityWarningModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'inactivityWarningModal';
            modal.className = 'modal fade';
            modal.setAttribute('tabindex', '-1');
            modal.setAttribute('data-bs-backdrop', 'static');
            modal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-warning">
                            <h5 class="modal-title">
                                <i class="fas fa-exclamation-triangle"></i> Sesión por expirar
                            </h5>
                        </div>
                        <div class="modal-body text-center">
                            <i class="fas fa-clock fa-3x text-warning mb-3"></i>
                            <p class="mb-0">Su sesión se cerrará automáticamente en <strong id="inactivityCountdown">60</strong> segundos debido a inactividad.</p>
                            <p class="text-muted mt-2">Haga clic en "Continuar" para mantener su sesión activa.</p>
                        </div>
                        <div class="modal-footer justify-content-center">
                            <button type="button" class="btn btn-primary" onclick="AuthService.continueSession()">
                                <i class="fas fa-check"></i> Continuar trabajando
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="AuthService.logout()">
                                <i class="fas fa-sign-out-alt"></i> Cerrar sesión
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Mostrar modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        // Iniciar countdown
        let countdown = 60;
        const countdownElement = document.getElementById('inactivityCountdown');
        AuthService.countdownInterval = setInterval(() => {
            countdown--;
            if (countdownElement) {
                countdownElement.textContent = countdown;
            }
            if (countdown <= 0) {
                clearInterval(AuthService.countdownInterval);
            }
        }, 1000);
    }

    static hideInactivityWarning() {
        AuthService.warningShown = false;

        // Limpiar countdown
        if (AuthService.countdownInterval) {
            clearInterval(AuthService.countdownInterval);
        }

        // Ocultar modal
        const modal = document.getElementById('inactivityWarningModal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
    }

    static continueSession() {
        // Ocultar advertencia y resetear timer
        AuthService.hideInactivityWarning();
        AuthService.resetInactivityTimer();
    }

    static logoutDueToInactivity() {
        // Limpiar todo
        AuthService.clearTimers();
        AuthService.hideInactivityWarning();

        // Guardar mensaje para mostrar en login
        sessionStorage.setItem('logoutReason', 'inactivity');

        // Cerrar sesión
        AuthService.logout();
    }

    static stopInactivityMonitor() {
        AuthService.clearTimers();

        // Remover event listeners
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        activityEvents.forEach(event => {
            document.removeEventListener(event, AuthService.resetInactivityTimer, true);
        });
    }
}
