// Verificar autenticación
AuthService.checkAuth();

const user = AuthService.getUser();
document.getElementById('userName').textContent = `${user.nombre} ${user.apellido}`;
document.getElementById('userRole').textContent = user.rol;
document.getElementById('userAvatar').textContent = user.nombre.charAt(0);

if (user.rol !== 'ADMIN') {
    document.getElementById('menuUsuarios').style.display = 'none';
}

document.getElementById('sidebarToggle')?.addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
});

function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        AuthService.logout();
    }
}

// Establecer fechas por defecto (último mes)
const hoy = new Date();
const hace30Dias = new Date();
hace30Dias.setDate(hoy.getDate() - 30);

document.getElementById('fechaInicio').value = hace30Dias.toISOString().split('T')[0];
document.getElementById('fechaFin').value = hoy.toISOString().split('T')[0];

async function cargarReportes() {
    try {
        // Cargar datos en paralelo
        const [pedidosRes, ordenesRes, facturasRes, clientesRes] = await Promise.all([
            PedidoService.getAll(),
            OrdenTrabajoService.getAll(),
            FacturaService.getAll(),
            ClienteService.getAll()
        ]);

        const pedidos = pedidosRes.success ? pedidosRes.data : [];
        const ordenes = ordenesRes.success ? ordenesRes.data : [];
        const facturas = facturasRes.success ? facturasRes.data : [];
        const clientes = clientesRes.success ? clientesRes.data : [];

        // Actualizar estadísticas generales
        actualizarEstadisticasGenerales(pedidos, ordenes, facturas);

        // Actualizar reportes por estado
        renderPedidosPorEstado(pedidos);
        renderOrdenesPorEstado(ordenes);
        renderFacturasPorEstado(facturas);

        // Top clientes
        renderTopClientes(pedidos, clientes);

    } catch (error) {
        console.error('Error cargando reportes:', error);
        alert('Error al cargar los reportes');
    }
}

function actualizarEstadisticasGenerales(pedidos, ordenes, facturas) {
    // Total de pedidos
    document.getElementById('totalPedidos').textContent = pedidos.length;

    // Pedidos completados
    const completados = pedidos.filter(p => p.estado === 'COMPLETADO').length;
    document.getElementById('pedidosCompletados').textContent = completados;

    // Órdenes activas
    const activas = ordenes.filter(o =>
        o.estado === 'ABIERTA' || o.estado === 'ASIGNADA' || o.estado === 'EN_PROCESO'
    ).length;
    document.getElementById('ordenesActivas').textContent = activas;

    // Total facturado
    const totalFacturado = facturas
        .filter(f => f.estado === 'PAGADA')
        .reduce((sum, f) => sum + (f.total || 0), 0);
    document.getElementById('totalFacturado').textContent = formatMoney(totalFacturado);
}

function renderPedidosPorEstado(pedidos) {
    const estados = {};
    pedidos.forEach(p => {
        estados[p.estado] = (estados[p.estado] || 0) + 1;
    });

    const total = pedidos.length;
    const table = document.getElementById('pedidosPorEstadoTable');

    if (total === 0) {
        table.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Sin datos</td></tr>';
        return;
    }

    table.innerHTML = Object.entries(estados).map(([estado, cantidad]) => `
        <tr>
            <td><span class="badge badge-estado badge-${getEstadoPedidoClass(estado)}">${formatEstadoPedido(estado)}</span></td>
            <td class="text-end"><strong>${cantidad}</strong></td>
            <td class="text-end">${((cantidad / total) * 100).toFixed(1)}%</td>
        </tr>
    `).join('');
}

function renderOrdenesPorEstado(ordenes) {
    const estados = {};
    ordenes.forEach(o => {
        estados[o.estado] = (estados[o.estado] || 0) + 1;
    });

    const total = ordenes.length;
    const table = document.getElementById('ordenesPorEstadoTable');

    if (total === 0) {
        table.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Sin datos</td></tr>';
        return;
    }

    table.innerHTML = Object.entries(estados).map(([estado, cantidad]) => `
        <tr>
            <td><span class="badge badge-estado badge-${getEstadoOrdenClass(estado)}">${formatEstadoOrden(estado)}</span></td>
            <td class="text-end"><strong>${cantidad}</strong></td>
            <td class="text-end">${((cantidad / total) * 100).toFixed(1)}%</td>
        </tr>
    `).join('');
}

function renderFacturasPorEstado(facturas) {
    const estados = {};
    facturas.forEach(f => {
        if (!estados[f.estado]) {
            estados[f.estado] = { cantidad: 0, total: 0 };
        }
        estados[f.estado].cantidad++;
        estados[f.estado].total += f.total || 0;
    });

    const table = document.getElementById('facturasPorEstadoTable');

    if (facturas.length === 0) {
        table.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Sin datos</td></tr>';
        return;
    }

    table.innerHTML = Object.entries(estados).map(([estado, data]) => `
        <tr>
            <td><span class="badge bg-${getEstadoFacturaColor(estado)}">${formatEstadoFactura(estado)}</span></td>
            <td class="text-end"><strong>${data.cantidad}</strong></td>
            <td class="text-end"><strong>${formatMoney(data.total)}</strong></td>
        </tr>
    `).join('');
}

function renderTopClientes(pedidos, clientes) {
    const clientesPedidos = {};

    pedidos.forEach(p => {
        if (p.cliente && p.cliente.idCliente) {
            const id = p.cliente.idCliente;
            if (!clientesPedidos[id]) {
                clientesPedidos[id] = {
                    nombre: `${p.cliente.nombre} ${p.cliente.apellido || ''}`,
                    count: 0
                };
            }
            clientesPedidos[id].count++;
        }
    });

    const top10 = Object.values(clientesPedidos)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const table = document.getElementById('topClientesTable');

    if (top10.length === 0) {
        table.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Sin datos</td></tr>';
        return;
    }

    table.innerHTML = top10.map((cliente, index) => `
        <tr>
            <td><strong>${index + 1}</strong></td>
            <td>${cliente.nombre}</td>
            <td class="text-end"><span class="badge bg-primary">${cliente.count}</span></td>
        </tr>
    `).join('');
}

// Funciones auxiliares de formato
function formatMoney(amount) {
    return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: 'PYG',
        minimumFractionDigits: 0
    }).format(amount || 0);
}

function formatEstadoPedido(estado) {
    const estados = {
        'NUEVO': 'Nuevo',
        'EN_PROCESO': 'En Proceso',
        'COMPLETADO': 'Completado',
        'CANCELADO': 'Cancelado'
    };
    return estados[estado] || estado;
}

function getEstadoPedidoClass(estado) {
    const classes = {
        'NUEVO': 'nuevo',
        'EN_PROCESO': 'en-proceso',
        'COMPLETADO': 'completado',
        'CANCELADO': 'cancelado'
    };
    return classes[estado] || 'nuevo';
}

function formatEstadoOrden(estado) {
    const estados = {
        'ABIERTA': 'Abierta',
        'ASIGNADA': 'Asignada',
        'EN_PROCESO': 'En Proceso',
        'TERMINADA': 'Terminada',
        'CANCELADA': 'Cancelada'
    };
    return estados[estado] || estado;
}

function getEstadoOrdenClass(estado) {
    const classes = {
        'ABIERTA': 'nuevo',
        'ASIGNADA': 'en-proceso',
        'EN_PROCESO': 'en-proceso',
        'TERMINADA': 'completado',
        'CANCELADA': 'cancelado'
    };
    return classes[estado] || 'nuevo';
}

function formatEstadoFactura(estado) {
    const estados = {
        'PENDIENTE': 'Pendiente',
        'PAGADA': 'Pagada',
        'VENCIDA': 'Vencida',
        'ANULADA': 'Anulada'
    };
    return estados[estado] || estado;
}

function getEstadoFacturaColor(estado) {
    const colors = {
        'PENDIENTE': 'warning',
        'PAGADA': 'success',
        'VENCIDA': 'danger',
        'ANULADA': 'secondary'
    };
    return colors[estado] || 'secondary';
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    cargarReportes();
});
