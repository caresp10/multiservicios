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
                <span class="badge bg-${getEstadoClass(pedido.estado)}">${formatEstado(pedido.estado)}</span>
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

// NOTA: El estado del pedido cambia AUTOMÁTICAMENTE según el flujo del sistema:
// - NUEVO -> cuando se crea el pedido
// - EN_PROCESO -> cuando se crea un presupuesto o una OT asociada al pedido
// - COMPLETADO -> cuando se factura la OT (ver FacturaService.java líneas 178-183)
// - CANCELADO -> cuando se rechaza un presupuesto asociado al pedido
//
// NO se permite cambiar el estado manualmente para mantener la integridad del flujo

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

// ============================================
// FUNCIONES PARA CREAR CLIENTE RÁPIDO
// ============================================

let modalNuevoCliente = null;
let modalNuevaCategoria = null;

// Abrir modal de nuevo cliente
function abrirModalNuevoCliente() {
    if (!modalNuevoCliente) {
        modalNuevoCliente = new bootstrap.Modal(document.getElementById('modalNuevoCliente'));
    }

    // Limpiar formulario
    document.getElementById('nuevoClienteForm').reset();

    modalNuevoCliente.show();
}

// Hacer la función global
window.abrirModalNuevoCliente = abrirModalNuevoCliente;

// Función para alternar campos según el tipo de cliente
function toggleCamposCliente() {
    const tipoCliente = document.getElementById('clienteTipoCliente').value;
    const divNombre = document.getElementById('divNombre');
    const divApellido = document.getElementById('divApellido');
    const divRazonSocial = document.getElementById('divRazonSocial');
    const labelNombre = document.getElementById('labelNombre');
    const labelRucCi = document.getElementById('labelRucCi');
    const inputNombre = document.getElementById('clienteNombre');
    const inputApellido = document.getElementById('clienteApellido');
    const inputRazonSocial = document.getElementById('clienteRazonSocial');

    if (tipoCliente === 'EMPRESA') {
        // Mostrar campos para empresa
        divNombre.style.display = 'none';
        divApellido.style.display = 'none';
        divRazonSocial.style.display = 'block';
        labelRucCi.textContent = 'RUC *';
        inputNombre.required = false;
        inputApellido.required = false;
        inputRazonSocial.required = true;
    } else {
        // Mostrar campos para persona física
        divNombre.style.display = 'block';
        divApellido.style.display = 'block';
        divRazonSocial.style.display = 'none';
        labelNombre.textContent = 'Nombre *';
        labelRucCi.textContent = 'CI/Cédula';
        inputNombre.required = true;
        inputApellido.required = false;
        inputRazonSocial.required = false;
    }
}

// Hacer la función global
window.toggleCamposCliente = toggleCamposCliente;

// Guardar nuevo cliente
async function guardarNuevoCliente() {
    const form = document.getElementById('nuevoClienteForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const tipoCliente = document.getElementById('clienteTipoCliente').value;
    const clienteData = {
        tipoCliente: tipoCliente,
        nombre: document.getElementById('clienteNombre').value || null,
        apellido: document.getElementById('clienteApellido').value || null,
        razonSocial: document.getElementById('clienteRazonSocial').value || null,
        rucCi: document.getElementById('clienteRucCi').value || null,
        telefono: document.getElementById('clienteTelefono').value,
        celular: document.getElementById('clienteCelular').value || null,
        email: document.getElementById('clienteEmail').value || null,
        ciudad: document.getElementById('clienteCiudad').value || null,
        direccion: document.getElementById('clienteDireccion').value || null
    };

    try {
        const response = await ClienteService.create(clienteData);

        if (response.success && response.data) {
            // Cerrar modal
            modalNuevoCliente.hide();

            // Recargar la lista de clientes
            await cargarDatosFormulario();

            // Seleccionar automáticamente el nuevo cliente
            document.getElementById('idCliente').value = response.data.idCliente;

            alert('Cliente creado exitosamente');
        } else {
            throw new Error(response.message || 'Error al crear cliente');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al crear el cliente: ' + error.message);
    }
}

// Hacer la función global
window.guardarNuevoCliente = guardarNuevoCliente;

// ============================================
// FUNCIONES PARA CREAR CATEGORÍA RÁPIDA
// ============================================

// Abrir modal de nueva categoría
function abrirModalNuevaCategoria() {
    if (!modalNuevaCategoria) {
        modalNuevaCategoria = new bootstrap.Modal(document.getElementById('modalNuevaCategoria'));
    }

    // Limpiar formulario
    document.getElementById('nuevaCategoriaForm').reset();

    modalNuevaCategoria.show();
}

// Hacer la función global
window.abrirModalNuevaCategoria = abrirModalNuevaCategoria;

// Guardar nueva categoría
async function guardarNuevaCategoria() {
    const form = document.getElementById('nuevaCategoriaForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const categoriaData = {
        nombre: document.getElementById('categoriaNombre').value,
        descripcion: document.getElementById('categoriaDescripcion').value || null
    };

    try {
        const response = await CategoriaService.create(categoriaData);

        if (response.success && response.data) {
            // Cerrar modal
            modalNuevaCategoria.hide();

            // Recargar la lista de categorías
            await cargarDatosFormulario();

            // Seleccionar automáticamente la nueva categoría
            document.getElementById('idCategoria').value = response.data.idCategoria;

            alert('Categoría creada exitosamente');
        } else {
            throw new Error(response.message || 'Error al crear categoría');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al crear la categoría: ' + error.message);
    }
}

// Hacer la función global
window.guardarNuevaCategoria = guardarNuevaCategoria;

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    cargarPedidos();
});
