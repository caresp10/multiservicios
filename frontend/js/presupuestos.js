// Verificar autenticación
AuthService.checkAuth();

const user = AuthService.getUser();
document.getElementById('userName').textContent = `${user.nombre} ${user.apellido}`;
document.getElementById('userRole').textContent = user.rol;
document.getElementById('userAvatar').textContent = user.nombre.charAt(0);

if (user.rol !== 'ADMIN') {
    document.getElementById('menuUsuarios').style.display = 'none';
}

let presupuestos = [];
let pedidos = [];
let presupuestoItems = [];
const modal = new bootstrap.Modal(document.getElementById('modalPresupuesto'));

document.getElementById('sidebarToggle')?.addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
});

function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        AuthService.logout();
    }
}

// Agregar item al array
function agregarItem() {
    const descripcion = document.getElementById('itemDescripcion').value.trim();
    const cantidad = parseFloat(document.getElementById('itemCantidad').value) || 0;
    const precioUnitario = parseFloat(document.getElementById('itemPrecioUnitario').value) || 0;

    console.log('agregarItem llamado', {descripcion, cantidad, precioUnitario}); // DEBUG

    if (!descripcion) {
        alert('Por favor ingrese una descripcion');
        return;
    }

    if (cantidad <= 0) {
        alert('La cantidad debe ser mayor a 0');
        return;
    }

    if (precioUnitario <= 0) {
        alert('El precio unitario debe ser mayor a 0');
        return;
    }

    const item = {
        tipoItem: 'MANUAL',
        descripcion: descripcion,
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        subtotal: cantidad * precioUnitario
    };

    presupuestoItems.push(item);
    console.log('Item agregado, total items:', presupuestoItems.length); // DEBUG

    // Limpiar formulario
    document.getElementById('itemDescripcion').value = '';
    document.getElementById('itemCantidad').value = '1';
    document.getElementById('itemPrecioUnitario').value = '';

    renderItemsTable();
    calcularTotales();
}

// Hacer la función global
window.agregarItem = agregarItem;

// Eliminar item del array
function eliminarItem(index) {
    if (confirm('¿Desea eliminar este item?')) {
        presupuestoItems.splice(index, 1);
        renderItemsTable();
        calcularTotales();
    }
}

// Hacer la función global
window.eliminarItem = eliminarItem;

// Renderizar tabla de items
function renderItemsTable() {
    const tbody = document.getElementById('itemsTableBody');

    if (presupuestoItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    <small>No hay items agregados</small>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = presupuestoItems.map((item, index) => `
        <tr>
            <td>
                ${getTipoItemBadge(item.tipoItem)}
                ${item.descripcion}
            </td>
            <td class="text-end">${item.cantidad.toFixed(2)}</td>
            <td class="text-end">${formatMoney(item.precioUnitario)}</td>
            <td class="text-end"><strong>${formatMoney(item.subtotal)}</strong></td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarItem(${index})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Función para obtener el badge del tipo de item
function getTipoItemBadge(tipoItem) {
    const badges = {
        'SERVICIO': '<span class="badge bg-primary"><i class="fas fa-concierge-bell"></i> Servicio</span>',
        'REPUESTO': '<span class="badge bg-info"><i class="fas fa-cog"></i> Repuesto</span>',
        'MANUAL': '<span class="badge bg-secondary"><i class="fas fa-keyboard"></i> Manual</span>'
    };
    return badges[tipoItem] || '';
}

// Calcular totales automáticamente
function calcularTotales() {
    // Sumar todos los items
    const subtotalItems = presupuestoItems.reduce((sum, item) => sum + item.subtotal, 0);

    const descuento = parseFloat(document.getElementById('descuento').value) || 0;
    const subtotalConDescuento = subtotalItems - descuento;
    const iva = subtotalConDescuento * 0.10; // 10% IVA
    const total = subtotalConDescuento + iva;

    document.getElementById('subtotal').value = subtotalItems.toFixed(2);
    document.getElementById('iva').value = iva.toFixed(2);
    document.getElementById('total').value = total.toFixed(2);
}

async function cargarPresupuestos() {
    const table = document.getElementById('presupuestosTable');

    try {
        const response = await PresupuestoService.getAll();

        if (response.success && response.data) {
            presupuestos = response.data;
            renderPresupuestos(presupuestos);
        } else {
            throw new Error(response.message || 'Error al cargar presupuestos');
        }
    } catch (error) {
        console.error('Error:', error);
        table.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle"></i> Error al cargar presupuestos
                </td>
            </tr>
        `;
    }
}

function renderPresupuestos(data) {
    const table = document.getElementById('presupuestosTable');

    if (data.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i><br>
                    No hay presupuestos registrados
                </td>
            </tr>
        `;
        return;
    }

    table.innerHTML = data.map(presupuesto => `
        <tr>
            <td><strong>${presupuesto.numeroPresupuesto}</strong></td>
            <td>${presupuesto.pedido?.numeroPedido || 'N/A'}</td>
            <td>${presupuesto.pedido?.cliente?.nombre || 'N/A'} ${presupuesto.pedido?.cliente?.apellido || ''}</td>
            <td>${formatDate(presupuesto.fechaGeneracion)}</td>
            <td>${presupuesto.fechaVencimiento ? formatDateOnly(presupuesto.fechaVencimiento) : '<span class="text-muted">-</span>'}</td>
            <td><strong>${formatMoney(presupuesto.total)}</strong></td>
            <td>
                <span class="badge bg-${getEstadoColor(presupuesto.estado)}">
                    ${formatEstado(presupuesto.estado)}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editarPresupuesto(${presupuesto.idPresupuesto})"
                        title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarPresupuesto(${presupuesto.idPresupuesto})"
                        title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

document.getElementById('searchInput').addEventListener('input', aplicarFiltros);
document.getElementById('filterEstado').addEventListener('change', aplicarFiltros);

function aplicarFiltros() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const estado = document.getElementById('filterEstado').value;

    let filtered = presupuestos.filter(presupuesto => {
        const matchSearch = presupuesto.numeroPresupuesto.toLowerCase().includes(searchTerm) ||
                          (presupuesto.pedido?.cliente?.nombre || '').toLowerCase().includes(searchTerm);
        const matchEstado = !estado || presupuesto.estado === estado;

        return matchSearch && matchEstado;
    });

    renderPresupuestos(filtered);
}

async function cargarDatosFormulario() {
    try {
        const pedidosResponse = await PedidoService.getAll();
        if (pedidosResponse.success && pedidosResponse.data) {
            // Filtrar pedidos que NO están en proceso (sin OT, sin factura)
            pedidos = pedidosResponse.data.filter(p =>
                p.estado !== 'COMPLETADO' &&
                p.estado !== 'CANCELADO' &&
                p.estado !== 'OT_GENERADA' &&
                p.estado !== 'OT_EN_PROCESO' &&
                p.estado !== 'OT_TERMINADA' &&
                p.estado !== 'FACTURADO' &&
                !p.tieneOt
            );
            const select = document.getElementById('idPedido');
            select.innerHTML = '<option value="">Seleccione un pedido</option>' +
                pedidos.map(p => `<option value="${p.idPedido}">${p.numeroPedido} - ${p.cliente?.nombre || 'Sin cliente'} (${p.estado})</option>`).join('');
        }
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

async function openModalPresupuesto() {
    document.getElementById('modalPresupuestoTitle').innerHTML =
        '<i class="fas fa-file-invoice-dollar"></i> Nuevo Presupuesto';
    document.getElementById('presupuestoForm').reset();
    document.getElementById('presupuestoId').value = '';

    // Limpiar items
    presupuestoItems = [];
    renderItemsTable();
    calcularTotales();

    await cargarDatosFormulario();
    modal.show();
}

async function editarPresupuesto(id) {
    try {
        const response = await PresupuestoService.getById(id);

        if (response.success && response.data) {
            const presupuesto = response.data;
            document.getElementById('modalPresupuestoTitle').innerHTML =
                '<i class="fas fa-edit"></i> Editar Presupuesto';

            await cargarDatosFormulario();

            document.getElementById('presupuestoId').value = presupuesto.idPresupuesto;
            document.getElementById('idPedido').value = presupuesto.pedido?.idPedido || '';
            document.getElementById('estado').value = presupuesto.estado;
            document.getElementById('descuento').value = presupuesto.descuento || '0';
            document.getElementById('validezDias').value = presupuesto.validezDias || 15;
            document.getElementById('fechaVencimiento').value = presupuesto.fechaVencimiento || '';
            document.getElementById('condicionesPago').value = presupuesto.condicionesPago || '';
            document.getElementById('observaciones').value = presupuesto.observaciones || '';

            // Cargar items si existen
            presupuestoItems = presupuesto.items || [];
            renderItemsTable();
            calcularTotales();

            modal.show();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los datos del presupuesto');
    }
}

let guardando = false; // Bandera para prevenir múltiples envíos

async function guardarPresupuesto() {
    // Prevenir múltiples envíos
    if (guardando) {
        console.log('Ya hay un guardado en proceso...');
        return;
    }

    const form = document.getElementById('presupuestoForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Validar que haya al menos un item
    if (presupuestoItems.length === 0) {
        alert('Debe agregar al menos un item al presupuesto');
        return;
    }

    const presupuestoData = {
        idPedido: parseInt(document.getElementById('idPedido').value),
        estado: document.getElementById('estado').value,
        subtotal: parseFloat(document.getElementById('subtotal').value),
        descuento: parseFloat(document.getElementById('descuento').value) || 0,
        iva: parseFloat(document.getElementById('iva').value),
        total: parseFloat(document.getElementById('total').value),
        validezDias: parseInt(document.getElementById('validezDias').value) || 15,
        fechaVencimiento: document.getElementById('fechaVencimiento').value || null,
        condicionesPago: document.getElementById('condicionesPago').value || '',
        observaciones: document.getElementById('observaciones').value || '',
        items: presupuestoItems.map(item => {
            const itemData = {
                tipoItem: item.tipoItem || 'MANUAL',
                descripcion: item.descripcion,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario
            };

            // Si es un servicio del catálogo, agregar la referencia
            if (item.tipoItem === 'SERVICIO' && item.idServicio) {
                itemData.idServicio = item.idServicio;
            }

            // Si es un repuesto, agregar la referencia
            if (item.tipoItem === 'REPUESTO' && item.idRepuesto) {
                itemData.idRepuesto = item.idRepuesto;
            }

            return itemData;
        })
    };

    console.log('Datos a enviar:', JSON.stringify(presupuestoData, null, 2)); // DEBUG

    guardando = true; // Activar bandera
    const btnGuardar = document.querySelector('#modalPresupuesto .btn-primary:last-child');
    const originalText = btnGuardar.innerHTML;
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        let response;
        const id = document.getElementById('presupuestoId').value;

        if (id) {
            response = await PresupuestoService.update(id, presupuestoData);
        } else {
            response = await PresupuestoService.create(presupuestoData);
        }

        if (response.success) {
            modal.hide();
            await cargarPresupuestos();
            alert(id ? 'Presupuesto actualizado exitosamente' : 'Presupuesto creado exitosamente');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el presupuesto: ' + error.message);
    } finally {
        guardando = false; // Desactivar bandera
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = originalText;
    }
}

async function eliminarPresupuesto(id) {
    if (!confirm('¿Está seguro que desea eliminar este presupuesto?')) {
        return;
    }

    try {
        const response = await PresupuestoService.delete(id);

        if (response.success) {
            await cargarPresupuestos();
            alert('Presupuesto eliminado exitosamente');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el presupuesto: ' + error.message);
    }
}

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

function formatDateOnly(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PY', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function formatMoney(amount) {
    return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: 'PYG',
        minimumFractionDigits: 0
    }).format(amount || 0);
}

function formatEstado(estado) {
    const estados = {
        'PENDIENTE': 'Pendiente',
        'ACEPTADO': 'Aceptado',
        'RECHAZADO': 'Rechazado',
        'VENCIDO': 'Vencido'
    };
    return estados[estado] || estado;
}

function getEstadoColor(estado) {
    const colors = {
        'PENDIENTE': 'warning',
        'ACEPTADO': 'success',
        'RECHAZADO': 'danger',
        'VENCIDO': 'secondary'
    };
    return colors[estado] || 'secondary';
}

// ==============================================
// NUEVAS FUNCIONES PARA SERVICIOS DEL CATÁLOGO
// ==============================================

let serviciosCatalogo = [];
let servicioSeleccionado = null;

// Cargar servicios del catálogo
async function cargarServiciosCatalogo() {
    try {
        const response = await ServicioCatalogoService.getActivos();

        if (response.success && response.data) {
            serviciosCatalogo = response.data;
            const select = document.getElementById('selectServicio');

            select.innerHTML = '<option value="">Seleccione un servicio...</option>' +
                serviciosCatalogo.map(servicio => `
                    <option value="${servicio.idServicio}">
                        ${servicio.codigo} - ${servicio.nombre} - ${formatCurrency(servicio.precioBase)}
                    </option>
                `).join('');
        }
    } catch (error) {
        console.error('Error al cargar servicios:', error);
    }
}

// Hacer la función global
window.cargarServiciosCatalogo = cargarServiciosCatalogo;

// Cuando se selecciona un servicio del catálogo
function seleccionarServicio() {
    const select = document.getElementById('selectServicio');
    const servicioId = parseInt(select.value);

    if (!servicioId) {
        servicioSeleccionado = null;
        document.getElementById('servicioPrecio').value = '';
        document.getElementById('servicioInfo').style.display = 'none';
        return;
    }

    servicioSeleccionado = serviciosCatalogo.find(s => s.idServicio === servicioId);

    if (servicioSeleccionado) {
        document.getElementById('servicioPrecio').value = servicioSeleccionado.precioBase;
        document.getElementById('servicioDescripcion').textContent =
            `${servicioSeleccionado.nombre} - ${servicioSeleccionado.categoria?.nombre || 'Sin categoría'}`;
        document.getElementById('servicioInfo').style.display = 'block';
    }
}

// Hacer la función global
window.seleccionarServicio = seleccionarServicio;

// Agregar servicio del catálogo al presupuesto
function agregarServicio() {
    if (!servicioSeleccionado) {
        alert('Por favor seleccione un servicio');
        return;
    }

    const cantidad = parseFloat(document.getElementById('servicioCantidad').value) || 0;
    const precioUnitario = parseFloat(document.getElementById('servicioPrecio').value) || 0;

    if (cantidad <= 0) {
        alert('La cantidad debe ser mayor a 0');
        return;
    }

    const item = {
        tipoItem: 'SERVICIO',
        idServicio: servicioSeleccionado.idServicio,
        descripcion: `${servicioSeleccionado.codigo} - ${servicioSeleccionado.nombre}`,
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        subtotal: cantidad * precioUnitario,
        unidadMedida: servicioSeleccionado.unidadMedida
    };

    presupuestoItems.push(item);

    // Limpiar formulario
    document.getElementById('selectServicio').value = '';
    document.getElementById('servicioCantidad').value = '1';
    document.getElementById('servicioPrecio').value = '';
    document.getElementById('servicioInfo').style.display = 'none';
    servicioSeleccionado = null;

    renderItemsTable();
    calcularTotales();
}

// Hacer la función global
window.agregarServicio = agregarServicio;

// Formatear moneda
function formatCurrency(amount) {
    if (!amount && amount !== 0) return 'Gs. 0';
    return 'Gs. ' + Number(amount).toLocaleString('es-PY', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

document.addEventListener('DOMContentLoaded', function() {
    cargarPresupuestos();
    cargarDatosFormulario();
    cargarServiciosCatalogo();
});
