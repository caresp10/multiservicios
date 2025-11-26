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
            o.estado === 'ABIERTA' || o.estado === 'ASIGNADA' || o.estado === 'EN_PROCESO'
        ).length;

        const ordenesCompletadas = misOrdenes.filter(o =>
            o.estado === 'TERMINADA' || o.estado === 'FACTURADA'
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

        // Cambiar el título y enlace del botón "Ver Todos" para técnicos
        const tableHeader = document.querySelector('.table-header h5');
        const verTodosLink = document.querySelector('.table-header a');
        if (tableHeader) {
            tableHeader.innerHTML = '<i class="fas fa-clock"></i> Mis Órdenes Recientes';
        }
        if (verTodosLink) {
            verTodosLink.href = 'mis-ordenes.html';
        }

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
        o.estado === 'ABIERTA' || o.estado === 'ASIGNADA' || o.estado === 'EN_PROCESO'
    );

    if (ordenesActivas.length > 0) {
        alertsList.innerHTML = ordenesActivas.slice(0, 5).map(orden => `
            <a href="mis-ordenes.html" class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">Pedido #${orden.pedido?.numeroPedido || 'N/A'}</h6>
                    <small class="text-${orden.estado === 'ASIGNADA' ? 'warning' : 'info'}">
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
        'ABIERTA': 'Abierta',
        'ASIGNADA': 'Asignada',
        'EN_PROCESO': 'En Proceso',
        'ESPERANDO_REVISION': 'Esperando Revisión',
        'DEVUELTA_A_TECNICO': 'Devuelta a Técnico',
        'TERMINADA': 'Terminada',
        'FACTURADA': 'Facturada',
        'CANCELADA': 'Cancelada'
    };
    return estados[estado] || estado;
}

// Ver detalle de orden
function verOrden(idOrden) {
    window.location.href = `mis-ordenes.html?id=${idOrden}`;
}

// Dashboard específico para RECEPCION
async function loadRecepcionDashboard() {
    try {
        // Cargar pedidos
        const pedidosData = await PedidoService.getAll();
        let pedidosNuevos = 0;
        let pedidosEnProceso = 0;

        if (pedidosData.success && pedidosData.data) {
            pedidosNuevos = pedidosData.data.filter(p => p.estado === 'NUEVO').length;
            pedidosEnProceso = pedidosData.data.filter(p => p.estado === 'EN_PROCESO').length;
        }

        // Cargar clientes
        const clientesData = await ClienteService.getAll();
        const totalClientes = clientesData.success && clientesData.data ? clientesData.data.length : 0;

        // Cargar presupuestos pendientes
        const presupuestosData = await PresupuestoService.getAll();
        const presupuestosPendientes = presupuestosData.success && presupuestosData.data
            ? presupuestosData.data.filter(p => p.estado === 'PENDIENTE').length : 0;

        // Actualizar cards
        document.getElementById('totalPedidos').textContent = pedidosNuevos;
        document.getElementById('totalClientes').textContent = totalClientes;
        document.getElementById('totalOrdenes').textContent = pedidosEnProceso;
        document.getElementById('totalFacturas').textContent = presupuestosPendientes;

        // Actualizar textos de las cards
        const cards = document.querySelectorAll('.stat-card');
        if (cards.length >= 4) {
            cards[0].querySelector('p').textContent = 'Pedidos Nuevos';
            cards[1].querySelector('p').textContent = 'Total Clientes';
            cards[2].querySelector('p').textContent = 'En Proceso';
            cards[3].querySelector('p').textContent = 'Presupuestos Pendientes';
        }

        loadRecentPedidos();
        loadAlerts();

    } catch (error) {
        console.error('Error cargando dashboard de recepción:', error);
    }
}

// Dashboard específico para SUPERVISOR
async function loadSupervisorDashboard() {
    try {
        // Cargar órdenes de trabajo
        const ordenesData = await OrdenTrabajoService.getAll();
        let otAbiertas = 0;
        let otEnProceso = 0;
        let otEsperandoRevision = 0;

        if (ordenesData.success && ordenesData.data) {
            otAbiertas = ordenesData.data.filter(o => o.estado === 'ABIERTA' || o.estado === 'ASIGNADA').length;
            otEnProceso = ordenesData.data.filter(o => o.estado === 'EN_PROCESO').length;
            otEsperandoRevision = ordenesData.data.filter(o => o.estado === 'ESPERANDO_REVISION').length;
        }

        // Cargar técnicos activos
        const tecnicosData = await TecnicoService.getAll();
        const tecnicosActivos = tecnicosData.success && tecnicosData.data
            ? tecnicosData.data.filter(t => t.activo).length : 0;

        // Actualizar cards
        document.getElementById('totalPedidos').textContent = otAbiertas;
        document.getElementById('totalClientes').textContent = otEnProceso;
        document.getElementById('totalOrdenes').textContent = otEsperandoRevision;
        document.getElementById('totalFacturas').textContent = tecnicosActivos;

        // Actualizar textos de las cards
        const cards = document.querySelectorAll('.stat-card');
        if (cards.length >= 4) {
            cards[0].querySelector('p').textContent = 'OT Abiertas';
            cards[1].querySelector('p').textContent = 'OT En Proceso';
            cards[2].querySelector('p').textContent = 'Esperando Revisión';
            cards[3].querySelector('p').textContent = 'Técnicos Activos';
        }

        // Cargar órdenes esperando revisión como alertas
        loadAlertasSupervisor(ordenesData.data || []);
        loadRecentOrdenesSupervisor(ordenesData.data || []);

    } catch (error) {
        console.error('Error cargando dashboard de supervisor:', error);
    }
}

// Cargar alertas del supervisor (OT esperando revisión)
function loadAlertasSupervisor(ordenes) {
    const alertsList = document.getElementById('alertsList');

    const ordenesRevision = ordenes.filter(o =>
        o.estado === 'ESPERANDO_REVISION' || o.estado === 'DEVUELTA_A_TECNICO'
    );

    if (ordenesRevision.length > 0) {
        alertsList.innerHTML = ordenesRevision.slice(0, 5).map(orden => `
            <a href="ordenes.html" class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">OT #${orden.numeroOt || 'N/A'}</h6>
                    <small class="text-${orden.estado === 'ESPERANDO_REVISION' ? 'warning' : 'danger'}">
                        ${formatEstadoOrden(orden.estado)}
                    </small>
                </div>
                <p class="mb-1">Técnico: ${orden.tecnico ? `${orden.tecnico.nombre} ${orden.tecnico.apellido}` : 'Sin asignar'}</p>
                <small class="text-muted">${formatDate(orden.fechaCreacion)}</small>
            </a>
        `).join('');
    } else {
        alertsList.innerHTML = `
            <div class="text-center p-3 text-muted">
                <i class="fas fa-check-circle fa-2x mb-2"></i><br>
                No hay OT pendientes de revisión
            </div>
        `;
    }
}

// Cargar órdenes recientes para supervisor
function loadRecentOrdenesSupervisor(ordenes) {
    const table = document.getElementById('recentPedidosTable');

    if (ordenes && ordenes.length > 0) {
        const ordenesRecientes = ordenes
            .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
            .slice(0, 5);

        table.innerHTML = ordenesRecientes.map(orden => `
            <tr>
                <td><strong>${orden.numeroOt || 'N/A'}</strong></td>
                <td>${orden.tecnico ? `${orden.tecnico.nombre} ${orden.tecnico.apellido}` : 'Sin asignar'}</td>
                <td>${formatDate(orden.fechaCreacion)}</td>
                <td>
                    <span class="badge-estado badge-${orden.estado.toLowerCase().replace('_', '-')}">
                        ${formatEstadoOrden(orden.estado)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="window.location.href='ordenes.html?id=${orden.idOt}'">
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
                    No hay órdenes de trabajo
                </td>
            </tr>
        `;
    }
}

// Dashboard específico para DUENO
async function loadDuenoDashboard() {
    try {
        // Cargar facturas
        const facturasData = await FacturaService.getAll();
        let facturasPendientes = 0;
        let facturasPagadas = 0;
        let totalIngresos = 0;

        if (facturasData.success && facturasData.data) {
            facturasPendientes = facturasData.data.filter(f => f.estado === 'PENDIENTE').length;
            facturasPagadas = facturasData.data.filter(f => f.estado === 'PAGADA').length;
            totalIngresos = facturasData.data
                .filter(f => f.estado === 'PAGADA')
                .reduce((sum, f) => sum + (f.total || 0), 0);
        }

        // Cargar órdenes completadas del mes
        const ordenesData = await OrdenTrabajoService.getAll();
        const mesActual = new Date().getMonth();
        const anioActual = new Date().getFullYear();
        let otCompletadasMes = 0;

        if (ordenesData.success && ordenesData.data) {
            otCompletadasMes = ordenesData.data.filter(o => {
                if (o.estado !== 'TERMINADA' && o.estado !== 'FACTURADA') return false;
                const fecha = new Date(o.fechaFinalizacion);
                return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
            }).length;
        }

        // Actualizar cards
        document.getElementById('totalPedidos').textContent = formatCurrency(totalIngresos);
        document.getElementById('totalClientes').textContent = facturasPagadas;
        document.getElementById('totalOrdenes').textContent = facturasPendientes;
        document.getElementById('totalFacturas').textContent = otCompletadasMes;

        // Actualizar textos de las cards
        const cards = document.querySelectorAll('.stat-card');
        if (cards.length >= 4) {
            cards[0].querySelector('p').textContent = 'Ingresos del Mes';
            cards[1].querySelector('p').textContent = 'Facturas Pagadas';
            cards[2].querySelector('p').textContent = 'Facturas Pendientes';
            cards[3].querySelector('p').textContent = 'OT Completadas (Mes)';
        }

        loadRecentFacturasDueno(facturasData.data || []);
        loadAlertasDueno(facturasData.data || []);

    } catch (error) {
        console.error('Error cargando dashboard de dueño:', error);
    }
}

// Cargar facturas recientes para dueño
function loadRecentFacturasDueno(facturas) {
    const table = document.getElementById('recentPedidosTable');

    if (facturas && facturas.length > 0) {
        const facturasRecientes = facturas
            .sort((a, b) => new Date(b.fechaEmision) - new Date(a.fechaEmision))
            .slice(0, 5);

        table.innerHTML = facturasRecientes.map(factura => `
            <tr>
                <td><strong>${factura.numeroFactura || 'N/A'}</strong></td>
                <td>${factura.cliente ? `${factura.cliente.nombre} ${factura.cliente.apellido}` : 'N/A'}</td>
                <td>${formatDate(factura.fechaEmision)}</td>
                <td>
                    <span class="badge-estado badge-${factura.estado.toLowerCase()}">
                        ${factura.estado}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="window.location.href='facturas.html?id=${factura.idFactura}'">
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
                    No hay facturas registradas
                </td>
            </tr>
        `;
    }
}

// Cargar alertas del dueño (facturas pendientes/vencidas)
function loadAlertasDueno(facturas) {
    const alertsList = document.getElementById('alertsList');

    const facturasPendientes = facturas.filter(f =>
        f.estado === 'PENDIENTE' || f.estado === 'VENCIDA'
    );

    if (facturasPendientes.length > 0) {
        alertsList.innerHTML = facturasPendientes.slice(0, 5).map(factura => `
            <a href="facturas.html" class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${factura.numeroFactura}</h6>
                    <small class="text-${factura.estado === 'VENCIDA' ? 'danger' : 'warning'}">
                        ${factura.estado}
                    </small>
                </div>
                <p class="mb-1">Total: ${formatCurrency(factura.total)}</p>
                <small class="text-muted">${formatDate(factura.fechaEmision)}</small>
            </a>
        `).join('');
    } else {
        alertsList.innerHTML = `
            <div class="text-center p-3 text-muted">
                <i class="fas fa-check-circle fa-2x mb-2"></i><br>
                No hay facturas pendientes
            </div>
        `;
    }
}

// Formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: 'PYG',
        minimumFractionDigits: 0
    }).format(amount || 0);
}

// Inicializar dashboard según el rol
document.addEventListener('DOMContentLoaded', function() {
    switch (user.rol) {
        case 'TECNICO':
            loadTecnicoDashboard();
            break;
        case 'RECEPCION':
            loadRecepcionDashboard();
            break;
        case 'SUPERVISOR':
            loadSupervisorDashboard();
            break;
        case 'DUENO':
            loadDuenoDashboard();
            break;
        default: // ADMIN
            loadStats();
            loadRecentPedidos();
            loadAlerts();
    }
});
