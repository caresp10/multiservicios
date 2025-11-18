// ============================================================
// FUNCIONES DE FORMATO Y UTILIDADES COMUNES
// ============================================================

/**
 * Formatear números como moneda en guaraníes (Gs.)
 */
function formatCurrency(amount) {
    if (!amount && amount !== 0) return 'Gs. 0';
    return 'Gs. ' + Number(amount).toLocaleString('es-PY', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

/**
 * Formatear fecha (DD/MM/YYYY)
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PY', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * Formatear fecha y hora (DD/MM/YYYY HH:MM)
 */
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-PY', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Obtener clase CSS según el estado
 */
function getEstadoClass(estado) {
    const clases = {
        // Pedidos
        'NUEVO': 'nuevo',
        'EN_PROCESO': 'en-proceso',
        'PRESUPUESTO_ACEPTADO': 'presupuesto-aceptado',
        'COMPLETADO': 'completado',
        'FACTURADO': 'completado',
        'CANCELADO': 'cancelado',

        // Presupuestos
        'PENDIENTE': 'pendiente',
        'ACEPTADO': 'aceptado',
        'RECHAZADO': 'rechazado',
        'VENCIDO': 'vencido',

        // Órdenes de Trabajo
        'ABIERTA': 'abierta',
        'ASIGNADA': 'asignada',
        'EN_PROCESO': 'en-proceso',
        'ESPERANDO_REVISION': 'esperando-revision',
        'DEVUELTA_A_TECNICO': 'devuelta',
        'TERMINADA': 'terminada',

        // Facturas
        'PENDIENTE': 'pendiente',
        'PAGADA': 'pagada',
        'ANULADA': 'anulada'
    };

    return clases[estado] || 'default';
}

/**
 * Formatear texto del estado para mostrar
 */
function formatEstado(estado) {
    const estados = {
        // Pedidos
        'NUEVO': 'Nuevo',
        'EN_PROCESO': 'En Proceso',
        'PRESUPUESTO_ACEPTADO': 'Presupuesto Aceptado',
        'COMPLETADO': 'Completado',
        'FACTURADO': 'Facturado',
        'CANCELADO': 'Cancelado',

        // Presupuestos
        'PENDIENTE': 'Pendiente',
        'ACEPTADO': 'Aceptado',
        'RECHAZADO': 'Rechazado',
        'VENCIDO': 'Vencido',

        // Órdenes de Trabajo
        'ABIERTA': 'Abierta',
        'ASIGNADA': 'Asignada',
        'ESPERANDO_REVISION': 'Esperando Revisión',
        'DEVUELTA_A_TECNICO': 'Devuelta a Técnico',
        'TERMINADA': 'Terminada',

        // Facturas
        'PAGADA': 'Pagada',
        'ANULADA': 'Anulada'
    };

    return estados[estado] || estado;
}

/**
 * Formatear prioridad
 */
function formatPrioridad(prioridad) {
    const prioridades = {
        'BAJA': 'Baja',
        'MEDIA': 'Media',
        'ALTA': 'Alta'
    };
    return prioridades[prioridad] || prioridad;
}

/**
 * Obtener clase de badge según prioridad
 */
function getPrioridadClass(prioridad) {
    const clases = {
        'BAJA': 'secondary',
        'MEDIA': 'warning',
        'ALTA': 'danger'
    };
    return clases[prioridad] || 'secondary';
}

/**
 * Validar formato de email
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validar teléfono paraguayo
 */
function isValidPhone(phone) {
    // Formato: 0xxx-xxx-xxx o 09xx-xxx-xxx
    const re = /^0\d{2,3}-?\d{3}-?\d{3}$/;
    return re.test(phone);
}

/**
 * Validar RUC paraguayo
 */
function isValidRUC(ruc) {
    // Formato: xxxxxxx-x (7 dígitos + guión + 1 dígito)
    const re = /^\d{6,8}-\d$/;
    return re.test(ruc);
}

/**
 * Truncar texto largo
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Capitalizar primera letra
 */
function capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Formatear número de teléfono
 */
function formatPhone(phone) {
    if (!phone) return '';
    // Remover caracteres no numéricos
    const cleaned = phone.replace(/\D/g, '');
    // Formatear como 0xxx-xxx-xxx
    if (cleaned.length === 10) {
        return `${cleaned.substring(0, 4)}-${cleaned.substring(4, 7)}-${cleaned.substring(7)}`;
    }
    return phone;
}

/**
 * Calcular edad desde fecha de nacimiento
 */
function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    return edad;
}

/**
 * Debounce para búsquedas
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Mostrar spinner de carga
 */
function showLoading(element, message = 'Cargando...') {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (element) {
        element.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">${message}</span>
                </div>
                <p class="mt-2 text-muted">${message}</p>
            </div>
        `;
    }
}

/**
 * Mostrar mensaje de error
 */
function showError(element, message = 'Error al cargar datos') {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (element) {
        element.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle"></i> ${message}
            </div>
        `;
    }
}

/**
 * Mostrar mensaje de éxito
 */
function showSuccess(message) {
    // Crear toast o alerta temporal
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3';
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        <i class="fas fa-check-circle"></i> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);

    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

/**
 * Confirmar acción con modal
 */
function confirmarAccion(mensaje, callback) {
    if (confirm(mensaje)) {
        callback();
    }
}
