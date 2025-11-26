// Verificar autenticación
AuthService.checkAuth();

// Cargar información del usuario
const user = AuthService.getUser();
document.getElementById('userName').textContent = `${user.nombre} ${user.apellido}`;
document.getElementById('userRole').textContent = user.rol;
document.getElementById('userAvatar').textContent = user.nombre.charAt(0);

// Variables globales
let pedidos = [];
let clientes = [];
let categorias = [];
const modal = new bootstrap.Modal(document.getElementById('modalPedido'));

// Función de logout
function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        AuthService.logout();
    }
}

// Cargar pedidos
async function cargarPedidos() {
    const table = document.getElementById('pedidosTable');

    try {
        const response = await PedidoService.getAll();

        if (response.success && response.data) {
            pedidos = response.data;
            renderPedidos(pedidos);
        } else {
            throw new Error(response.message || 'Error al cargar pedidos');
        }
    } catch (error) {
        console.error('Error:', error);
        table.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle"></i> Error al cargar pedidos
                </td>
            </tr>
        `;
    }
}

// Renderizar tabla de pedidos
function renderPedidos(data) {
    const table = document.getElementById('pedidosTable');

    if (data.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i><br>
                    No hay pedidos registrados
                </td>
            </tr>
        `;
        return;
    }

    table.innerHTML = data.map(pedido => `
        <tr>
            <td><strong>${pedido.numeroPedido}</strong></td>
            <td>${pedido.cliente?.nombre || 'N/A'} ${pedido.cliente?.apellido || ''}</td>
            <td>${pedido.categoria?.nombre || 'N/A'}</td>
            <td>${pedido.descripcion.substring(0, 50)}${pedido.descripcion.length > 50 ? '...' : ''}</td>
            <td>
                <span class="badge bg-${getCanalClass(pedido.canal)}">${pedido.canal}</span>
            </td>
            <td>
                <span class="badge bg-${
                    pedido.prioridad === 'ALTA' ? 'danger' :
                    pedido.prioridad === 'MEDIA' ? 'warning' : 'secondary'
                }">${pedido.prioridad}</span>
            </td>
            <td>
                ${pedido.estado === 'COMPLETADO' || pedido.estado === 'CANCELADO' ? `
                    <span class="badge bg-${getEstadoClass(pedido.estado)}">${formatEstado(pedido.estado)}</span>
                ` : `
                <div class="dropdown">
                    <button class="btn btn-sm btn-${getEstadoClass(pedido.estado)} dropdown-toggle"
                            type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        ${formatEstado(pedido.estado)}
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item ${pedido.estado === 'NUEVO' ? 'active' : ''}"
                               href="#" onclick="cambiarEstadoPedido(${pedido.idPedido}, 'NUEVO'); return false;">
                               <i class="fas fa-circle text-primary me-2"></i>Nuevo</a></li>
                        <li><a class="dropdown-item ${pedido.estado === 'EN_PROCESO' ? 'active' : ''}"
                               href="#" onclick="cambiarEstadoPedido(${pedido.idPedido}, 'EN_PROCESO'); return false;">
                               <i class="fas fa-circle text-warning me-2"></i>En Proceso</a></li>
                        <li><a class="dropdown-item ${pedido.estado === 'COMPLETADO' ? 'active' : ''}"
                               href="#" onclick="cambiarEstadoPedido(${pedido.idPedido}, 'COMPLETADO'); return false;">
                               <i class="fas fa-circle text-success me-2"></i>Completado</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item ${pedido.estado === 'CANCELADO' ? 'active' : ''}"
                               href="#" onclick="cambiarEstadoPedido(${pedido.idPedido}, 'CANCELADO'); return false;">
                               <i class="fas fa-circle text-danger me-2"></i>Cancelado</a></li>
                    </ul>
                </div>
                `}
            </td>
            <td>${formatDate(pedido.fechaPedido)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editarPedido(${pedido.idPedido})"
                        title="Editar" ${pedido.estado === 'COMPLETADO' || pedido.estado === 'CANCELADO' ? 'disabled' : ''}>
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarPedido(${pedido.idPedido})"
                        title="Eliminar" ${pedido.estado === 'COMPLETADO' || pedido.estado === 'CANCELADO' ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Filtros
document.getElementById('searchInput').addEventListener('input', aplicarFiltros);
document.getElementById('filterEstado').addEventListener('change', aplicarFiltros);
document.getElementById('filterPrioridad').addEventListener('change', aplicarFiltros);
document.getElementById('filterFechaDesde').addEventListener('change', aplicarFiltros);
document.getElementById('filterFechaHasta').addEventListener('change', aplicarFiltros);

function aplicarFiltros() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const estado = document.getElementById('filterEstado').value;
    const prioridad = document.getElementById('filterPrioridad').value;
    const fechaDesde = document.getElementById('filterFechaDesde').value;
    const fechaHasta = document.getElementById('filterFechaHasta').value;

    let filtered = pedidos.filter(pedido => {
        const matchSearch = pedido.numeroPedido.toLowerCase().includes(searchTerm) ||
                          (pedido.cliente?.nombre || '').toLowerCase().includes(searchTerm);
        const matchEstado = !estado || pedido.estado === estado;
        const matchPrioridad = !prioridad || pedido.prioridad === prioridad;

        // Filtro por fecha
        let matchFecha = true;
        if (pedido.fechaPedido) {
            const fechaPedido = new Date(pedido.fechaPedido).toISOString().split('T')[0];
            if (fechaDesde && fechaPedido < fechaDesde) {
                matchFecha = false;
            }
            if (fechaHasta && fechaPedido > fechaHasta) {
                matchFecha = false;
            }
        }

        return matchSearch && matchEstado && matchPrioridad && matchFecha;
    });

    renderPedidos(filtered);
}

// Cargar clientes y categorías para el formulario
async function cargarDatosFormulario() {
    try {
        // Cargar solo clientes activos
        const clientesResponse = await ClienteService.getActivos();
        if (clientesResponse.success && clientesResponse.data) {
            clientes = clientesResponse.data;
            const select = document.getElementById('idCliente');
            select.innerHTML = '<option value="">Seleccione un cliente</option>' +
                clientes.map(c => `<option value="${c.idCliente}">${c.nombre} ${c.apellido || ''}</option>`).join('');
        }

        // Cargar categorías
        const categoriasResponse = await CategoriaService.getAll();
        if (categoriasResponse.success && categoriasResponse.data) {
            // Filtrar duplicados por idCategoria
            const categoriasUnicas = categoriasResponse.data.filter((cat, index, self) =>
                index === self.findIndex((c) => c.idCategoria === cat.idCategoria)
            );
            categorias = categoriasUnicas;
            const select = document.getElementById('idCategoria');
            select.innerHTML = '<option value="">Seleccione una categoría</option>' +
                categorias.filter(c => c.activo).map(c => `<option value="${c.idCategoria}">${c.nombre}</option>`).join('');
        }
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// Abrir modal para nuevo pedido
async function openModalPedido() {
    document.getElementById('modalPedidoTitle').innerHTML =
        '<i class="fas fa-clipboard-list"></i> Nuevo Pedido';
    document.getElementById('pedidoForm').reset();
    document.getElementById('pedidoId').value = '';

    await cargarDatosFormulario();
    modal.show();
}

// Editar pedido
async function editarPedido(id) {
    try {
        const response = await PedidoService.getById(id);

        if (response.success && response.data) {
            const pedido = response.data;
            document.getElementById('modalPedidoTitle').innerHTML =
                '<i class="fas fa-edit"></i> Editar Pedido';

            await cargarDatosFormulario();

            // Llenar formulario
            document.getElementById('pedidoId').value = pedido.idPedido;

            // Validar que los elementos existan antes de asignar valores
            const idClienteElem = document.getElementById('idCliente');
            const idCategoriaElem = document.getElementById('idCategoria');

            if (idClienteElem) idClienteElem.value = pedido.cliente?.idCliente || '';
            if (idCategoriaElem) idCategoriaElem.value = pedido.categoria?.idCategoria || '';

            document.getElementById('canal').value = pedido.canal;
            document.getElementById('prioridad').value = pedido.prioridad;
            document.getElementById('descripcion').value = pedido.descripcion;
            document.getElementById('observaciones').value = pedido.observaciones || '';

            modal.show();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los datos del pedido');
    }
}

// Guardar pedido
async function guardarPedido() {
    const form = document.getElementById('pedidoForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const pedidoData = {
        idCliente: parseInt(document.getElementById('idCliente').value),
        idCategoria: parseInt(document.getElementById('idCategoria').value) || null,
        idUsuarioRecepcion: user.idUsuario,
        canal: document.getElementById('canal').value,
        prioridad: document.getElementById('prioridad').value,
        descripcion: document.getElementById('descripcion').value,
        observaciones: document.getElementById('observaciones').value
    };

    try {
        let response;
        const id = document.getElementById('pedidoId').value;

        if (id) {
            response = await PedidoService.update(id, pedidoData);
        } else {
            response = await PedidoService.create(pedidoData);
        }

        if (response.success) {
            modal.hide();
            await cargarPedidos();
            alert(id ? 'Pedido actualizado exitosamente' : 'Pedido creado exitosamente');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el pedido: ' + error.message);
    }
}

// Eliminar pedido
async function eliminarPedido(id) {
    if (!confirm('¿Está seguro que desea eliminar este pedido?')) {
        return;
    }

    try {
        const response = await PedidoService.delete(id);

        if (response.success) {
            await cargarPedidos();
            alert('Pedido eliminado exitosamente');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el pedido: ' + error.message);
    }
}

// Cambiar estado del pedido
async function cambiarEstadoPedido(id, nuevoEstado) {
    const pedido = pedidos.find(p => p.idPedido === id);
    if (!pedido) return;

    if (pedido.estado === nuevoEstado) return;

    const estadoTexto = formatEstado(nuevoEstado);
    if (!confirm(`¿Cambiar el estado del pedido ${pedido.numeroPedido} a "${estadoTexto}"?`)) {
        return;
    }

    try {
        const response = await PedidoService.cambiarEstado(id, nuevoEstado);

        if (response.success) {
            await cargarPedidos();
            alert(`Estado cambiado a "${estadoTexto}" exitosamente`);
        } else {
            throw new Error(response.message || 'Error al cambiar estado');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cambiar el estado: ' + error.message);
    }
}

// Funciones auxiliares
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PY', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
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

function getEstadoClass(estado) {
    const classes = {
        'NUEVO': 'primary',         // Azul para nuevos pedidos
        'EN_PROCESO': 'warning',    // Amarillo para en proceso
        'COMPLETADO': 'success',    // Verde para completados
        'CANCELADO': 'danger'       // Rojo para cancelados
    };
    return classes[estado] || 'primary';
}

function getCanalClass(canal) {
    const classes = {
        'TELEFONO': 'info',         // Azul claro para teléfono
        'WHATSAPP': 'success',      // Verde para WhatsApp
        'EMAIL': 'warning',         // Amarillo para email
        'PRESENCIAL': 'primary',    // Azul para presencial
        'WEB': 'secondary'          // Gris para web
    };
    return classes[canal] || 'info';
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    cargarPedidos();
});
