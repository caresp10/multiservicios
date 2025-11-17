// Verificar autenticación
AuthService.checkAuth();

// Cargar información del usuario
const user = AuthService.getUser();
document.getElementById('userName').textContent = `${user.nombre} ${user.apellido}`;
document.getElementById('userRole').textContent = user.rol;
document.getElementById('userAvatar').textContent = user.nombre.charAt(0);

// Toggle sidebar en móvil
document.getElementById('sidebarToggle')?.addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
});

// Función de logout
function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        AuthService.logout();
    }
}

// Cargar estadísticas
async function loadStats() {
    try {
        // Cargar pedidos activos
        const pedidosData = await PedidoService.getAll();
        if (pedidosData.success && pedidosData.data) {
            const pedidosActivos = pedidosData.data.filter(p =>
                p.estado !== 'COMPLETADO' && p.estado !== 'CANCELADO'
            );
            document.getElementById('totalPedidos').textContent = pedidosActivos.length;
        }

        // Cargar clientes
        const clientesData = await ClienteService.getAll();
        if (clientesData.success && clientesData.data) {
            document.getElementById('totalClientes').textContent = clientesData.data.length;
        }

        // Simulación de órdenes y facturas (ajustar según tu API)
        document.getElementById('totalOrdenes').textContent = '0';
        document.getElementById('totalFacturas').textContent = '0';

    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Cargar pedidos recientes
async function loadRecentPedidos() {
    const table = document.getElementById('recentPedidosTable');

    try {
        const response = await PedidoService.getAll();

        if (response.success && response.data && response.data.length > 0) {
            // Tomar solo los últimos 5 pedidos
            const recentPedidos = response.data.slice(0, 5);

            table.innerHTML = recentPedidos.map(pedido => `
                <tr>
                    <td><strong>${pedido.numeroPedido}</strong></td>
                    <td>${pedido.cliente ? `${pedido.cliente.nombre} ${pedido.cliente.apellido}` : 'N/A'}</td>
                    <td>${formatDate(pedido.fechaPedido)}</td>
                    <td>
                        <span class="badge-estado badge-${pedido.estado.toLowerCase().replace('_', '-')}">
                            ${formatEstado(pedido.estado)}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="verDetalle(${pedido.idPedido})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            table.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        <i class="fas fa-inbox fa-2x mb-2"></i><br>
                        No hay pedidos registrados
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error cargando pedidos recientes:', error);
        table.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle"></i> Error al cargar pedidos
                </td>
            </tr>
        `;
    }
}

// Cargar alertas
async function loadAlerts() {
    const alertsList = document.getElementById('alertsList');

    try {
        const response = await PedidoService.getAll();

        if (response.success && response.data) {
            const pedidosPendientes = response.data.filter(p =>
                p.estado === 'NUEVO' || p.estado === 'EN_PROCESO'
            );

            if (pedidosPendientes.length > 0) {
                alertsList.innerHTML = pedidosPendientes.slice(0, 5).map(pedido => `
                    <a href="pedidos.html" class="list-group-item list-group-item-action">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">${pedido.numeroPedido}</h6>
                            <small class="text-${pedido.prioridad === 'ALTA' ? 'danger' : 'warning'}">
                                ${pedido.prioridad}
                            </small>
                        </div>
                        <p class="mb-1">${pedido.descripcion.substring(0, 50)}...</p>
                        <small class="text-muted">${formatDate(pedido.fechaPedido)}</small>
                    </a>
                `).join('');
            } else {
                alertsList.innerHTML = `
                    <div class="text-center p-3 text-muted">
                        <i class="fas fa-check-circle fa-2x mb-2"></i><br>
                        No hay alertas pendientes
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error cargando alertas:', error);
        alertsList.innerHTML = `
            <div class="text-center p-3 text-danger">
                <i class="fas fa-exclamation-triangle"></i> Error al cargar alertas
            </div>
        `;
    }
}

// Funciones auxiliares
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PY', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function formatEstado(estado) {
    const estados = {
        'NUEVO': 'Nuevo',
        'EN_PROCESO': 'En Proceso',
        'COMPLETADO': 'Completado',
        'CANCELADO': 'Cancelado'
    };
    return estados[estado] || estado;
}

function verDetalle(idPedido) {
    window.location.href = `pedidos.html?id=${idPedido}`;
}

// Dashboard específico para técnicos
async function loadTecnicoDashboard() {
    try {
        // Obtener datos del técnico asociado al usuario
        const tecnicoResponse = await TecnicoService.getByUsuarioId(user.idUsuario);
        if (!tecnicoResponse.success || !tecnicoResponse.data) {
            alert('Error: No se encontró técnico asociado a este usuario');
            return;
        }

        const miTecnico = tecnicoResponse.data;
        console.log('Técnico cargado:', miTecnico);

        // Obtener todas las órdenes de trabajo
        const ordenesResponse = await OrdenTrabajoService.getAll();
        if (!ordenesResponse.success || !ordenesResponse.data) {
            console.error('Error cargando órdenes de trabajo');
            return;
        }

        // Filtrar órdenes del técnico
        const misOrdenes = ordenesResponse.data.filter(orden =>
            orden.tecnico && orden.tecnico.idTecnico === miTecnico.idTecnico
        );

        // Calcular estadísticas
        const ordenesActivas = misOrdenes.filter(o =>
            o.estado === 'ASIGNADO' || o.estado === 'EN_PROGRESO'
        ).length;

        const ordenesCompletadas = misOrdenes.filter(o =>
            o.estado === 'COMPLETADO'
        ).length;

        // Órdenes del mes actual
        const mesActual = new Date().getMonth();
        const anioActual = new Date().getFullYear();
        const ordenesMes = misOrdenes.filter(o => {
            const fechaOrden = new Date(o.fechaAsignacion);
            return fechaOrden.getMonth() === mesActual && fechaOrden.getFullYear() === anioActual;
        }).length;

        // Actualizar cards de estadísticas
        document.getElementById('totalPedidos').textContent = ordenesActivas;
        document.getElementById('totalClientes').textContent = ordenesCompletadas;
        document.getElementById('totalOrdenes').textContent = ordenesMes;
        document.getElementById('totalFacturas').textContent = misOrdenes.length;

        // Actualizar textos de las cards para técnicos
        const cards = document.querySelectorAll('.stat-card');
        if (cards.length >= 4) {
            cards[0].querySelector('p').textContent = 'Órdenes Activas';
            cards[1].querySelector('p').textContent = 'Órdenes Completadas';
            cards[2].querySelector('p').textContent = 'Órdenes del Mes';
            cards[3].querySelector('p').textContent = 'Total de Órdenes';
        }

        // Cargar tabla de órdenes recientes
        loadRecentOrdenesTecnico(misOrdenes);

        // Cargar alertas de órdenes pendientes
        loadAlertasTecnico(misOrdenes);

    } catch (error) {
        console.error('Error cargando dashboard de técnico:', error);
        alert('Error al cargar el dashboard. Por favor, contacte al administrador.');
    }
}

// Cargar órdenes recientes del técnico
function loadRecentOrdenesTecnico(ordenes) {
    const table = document.getElementById('recentPedidosTable');

    if (ordenes && ordenes.length > 0) {
        // Ordenar por fecha más reciente y tomar las últimas 5
        const ordenesRecientes = ordenes
            .sort((a, b) => new Date(b.fechaAsignacion) - new Date(a.fechaAsignacion))
            .slice(0, 5);

        table.innerHTML = ordenesRecientes.map(orden => `
            <tr>
                <td><strong>${orden.pedido?.numeroPedido || 'N/A'}</strong></td>
                <td>${orden.pedido?.cliente ? `${orden.pedido.cliente.nombre} ${orden.pedido.cliente.apellido}` : 'N/A'}</td>
                <td>${formatDate(orden.fechaAsignacion)}</td>
                <td>
                    <span class="badge-estado badge-${orden.estado.toLowerCase().replace('_', '-')}">
                        ${formatEstadoOrden(orden.estado)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="verOrden(${orden.idOrden})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } else {
        table.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i><br>
                    No tienes órdenes asignadas
                </td>
            </tr>
        `;
    }
}

// Cargar alertas del técnico
function loadAlertasTecnico(ordenes) {
    const alertsList = document.getElementById('alertsList');

    // Filtrar órdenes activas
    const ordenesActivas = ordenes.filter(o =>
        o.estado === 'ASIGNADO' || o.estado === 'EN_PROGRESO'
    );

    if (ordenesActivas.length > 0) {
        alertsList.innerHTML = ordenesActivas.slice(0, 5).map(orden => `
            <a href="mis-ordenes.html" class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">Pedido #${orden.pedido?.numeroPedido || 'N/A'}</h6>
                    <small class="text-${orden.estado === 'ASIGNADO' ? 'warning' : 'info'}">
                        ${formatEstadoOrden(orden.estado)}
                    </small>
                </div>
                <p class="mb-1">${orden.descripcionTrabajo?.substring(0, 50) || 'Sin descripción'}...</p>
                <small class="text-muted">${formatDate(orden.fechaAsignacion)}</small>
            </a>
        `).join('');
    } else {
        alertsList.innerHTML = `
            <div class="text-center p-3 text-muted">
                <i class="fas fa-check-circle fa-2x mb-2"></i><br>
                No hay órdenes pendientes
            </div>
        `;
    }
}

// Formatear estado de orden
function formatEstadoOrden(estado) {
    const estados = {
        'ASIGNADO': 'Asignado',
        'EN_PROGRESO': 'En Progreso',
        'COMPLETADO': 'Completado',
        'CANCELADO': 'Cancelado'
    };
    return estados[estado] || estado;
}

// Ver detalle de orden
function verOrden(idOrden) {
    window.location.href = `mis-ordenes.html?id=${idOrden}`;
}

// Inicializar dashboard según el rol
document.addEventListener('DOMContentLoaded', function() {
    if (user.rol === 'TECNICO') {
        loadTecnicoDashboard();
    } else {
        loadStats();
        loadRecentPedidos();
        loadAlerts();
    }
});
