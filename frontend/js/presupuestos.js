// Verificar autenticación
AuthService.checkAuth();

const user = AuthService.getUser();
document.getElementById('userName').textContent = `${user.nombre} ${user.apellido}`;
document.getElementById('userRole').textContent = user.rol;
document.getElementById('userAvatar').textContent = user.nombre.charAt(0);

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
                <button class="btn btn-sm btn-outline-info" onclick="vistaPrevia(${presupuesto.idPresupuesto})"
                        title="Vista Previa">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-success" onclick="generarPDF(${presupuesto.idPresupuesto})"
                        title="Descargar PDF">
                    <i class="fas fa-file-pdf"></i>
                </button>
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
        // Obtener todos los presupuestos para identificar pedidos que ya tienen presupuesto
        const presupuestosResponse = await PresupuestoService.getAll();
        const pedidosConPresupuesto = new Set();

        if (presupuestosResponse.success && presupuestosResponse.data) {
            presupuestosResponse.data.forEach(presupuesto => {
                if (presupuesto.pedido?.idPedido) {
                    pedidosConPresupuesto.add(presupuesto.pedido.idPedido);
                }
            });
        }

        const pedidosResponse = await PedidoService.getAll();
        if (pedidosResponse.success && pedidosResponse.data) {
            // Filtrar pedidos que:
            // 1. NO están en proceso (sin OT, sin factura)
            // 2. NO tienen presupuesto ya generado (a menos que sea edición)
            pedidos = pedidosResponse.data.filter(p =>
                p.estado !== 'COMPLETADO' &&
                p.estado !== 'CANCELADO' &&
                p.estado !== 'OT_GENERADA' &&
                p.estado !== 'OT_EN_PROCESO' &&
                p.estado !== 'OT_TERMINADA' &&
                p.estado !== 'FACTURADO' &&
                !p.tieneOt &&
                !pedidosConPresupuesto.has(p.idPedido) // NO tiene presupuesto
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

    // Habilitar el selector de pedido (modo creación)
    document.getElementById('idPedido').disabled = false;

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

            // Cargar datos del formulario (sin filtrar el pedido actual)
            await cargarDatosFormulario();

            // Agregar el pedido actual al select si no está (porque ya tiene presupuesto)
            const select = document.getElementById('idPedido');
            const pedidoId = presupuesto.pedido?.idPedido;
            if (pedidoId) {
                const pedidoExiste = Array.from(select.options).some(option =>
                    option.value === pedidoId.toString()
                );

                // Si el pedido no está en la lista, agregarlo
                if (!pedidoExiste && presupuesto.pedido) {
                    const option = document.createElement('option');
                    option.value = pedidoId;
                    option.textContent = `${presupuesto.pedido.numeroPedido} - ${presupuesto.pedido.cliente?.nombre || 'Sin cliente'} (${presupuesto.pedido.estado})`;
                    select.appendChild(option);
                }
            }

            document.getElementById('presupuestoId').value = presupuesto.idPresupuesto;
            document.getElementById('idPedido').value = pedidoId || '';
            document.getElementById('estado').value = presupuesto.estado;
            document.getElementById('descuento').value = presupuesto.descuento || '0';
            document.getElementById('validezDias').value = presupuesto.validezDias || 15;
            document.getElementById('fechaVencimiento').value = presupuesto.fechaVencimiento || '';
            document.getElementById('condicionesPago').value = presupuesto.condicionesPago || '';
            document.getElementById('observaciones').value = presupuesto.observaciones || '';

            // BLOQUEAR el selector de pedido en modo edición
            document.getElementById('idPedido').disabled = true;

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
let repuestosCatalogo = [];
let repuestoSeleccionado = null;

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

// ==============================================
// FUNCIONES PARA REPUESTOS CON VALIDACIÓN DE STOCK
// ==============================================

// Cargar repuestos activos
async function cargarRepuestosCatalogo() {
    try {
        const response = await RepuestoService.getActivos();

        if (response.success && response.data) {
            repuestosCatalogo = response.data;
            const select = document.getElementById('selectRepuesto');

            select.innerHTML = '<option value="">Seleccione un repuesto...</option>' +
                repuestosCatalogo.map(repuesto => {
                    const stockBadge = getStockBadge(repuesto);
                    return `
                        <option value="${repuesto.idRepuesto}">
                            ${repuesto.codigo} - ${repuesto.nombre} ${stockBadge} - ${formatCurrency(repuesto.precioVenta)}
                        </option>
                    `;
                }).join('');
        }
    } catch (error) {
        console.error('Error al cargar repuestos:', error);
    }
}

// Hacer la función global
window.cargarRepuestosCatalogo = cargarRepuestosCatalogo;

// Obtener badge de stock
function getStockBadge(repuesto) {
    if (repuesto.stockActual === 0) {
        return '(SIN STOCK)';
    } else if (repuesto.stockActual <= repuesto.stockMinimo) {
        return `(Stock bajo: ${repuesto.stockActual})`;
    }
    return `(Stock: ${repuesto.stockActual})`;
}

// Cuando se selecciona un repuesto del catálogo
function seleccionarRepuesto() {
    const select = document.getElementById('selectRepuesto');
    const repuestoId = parseInt(select.value);

    if (!repuestoId) {
        repuestoSeleccionado = null;
        document.getElementById('repuestoPrecio').value = '';
        document.getElementById('repuestoStock').value = '';
        document.getElementById('repuestoInfo').style.display = 'none';
        document.getElementById('repuestoAlerta').style.display = 'none';
        return;
    }

    repuestoSeleccionado = repuestosCatalogo.find(r => r.idRepuesto === repuestoId);

    if (repuestoSeleccionado) {
        document.getElementById('repuestoPrecio').value = repuestoSeleccionado.precioVenta;
        document.getElementById('repuestoStock').value = repuestoSeleccionado.stockActual;

        // Mostrar información del repuesto
        document.getElementById('repuestoDescripcionText').textContent =
            `${repuestoSeleccionado.nombre} - ${repuestoSeleccionado.categoria?.nombre || 'Sin categoría'}`;
        document.getElementById('repuestoInfo').style.display = 'block';

        // Mostrar alerta si el stock es bajo o no hay stock
        if (repuestoSeleccionado.stockActual === 0) {
            document.getElementById('repuestoAlertaText').textContent =
                'Este repuesto NO tiene stock disponible. No se puede agregar al presupuesto.';
            document.getElementById('repuestoAlerta').style.display = 'block';
        } else if (repuestoSeleccionado.stockActual <= repuestoSeleccionado.stockMinimo) {
            document.getElementById('repuestoAlertaText').textContent =
                `ADVERTENCIA: Stock bajo. Solo quedan ${repuestoSeleccionado.stockActual} unidades disponibles.`;
            document.getElementById('repuestoAlerta').style.display = 'block';
        } else {
            document.getElementById('repuestoAlerta').style.display = 'none';
        }
    }
}

// Hacer la función global
window.seleccionarRepuesto = seleccionarRepuesto;

// Agregar repuesto del catálogo al presupuesto con validación de stock
function agregarRepuesto() {
    if (!repuestoSeleccionado) {
        alert('Por favor seleccione un repuesto');
        return;
    }

    const cantidad = parseInt(document.getElementById('repuestoCantidad').value) || 0;
    const precioUnitario = parseFloat(document.getElementById('repuestoPrecio').value) || 0;

    if (cantidad <= 0) {
        alert('La cantidad debe ser mayor a 0');
        return;
    }

    // VALIDACIÓN DE STOCK
    if (repuestoSeleccionado.stockActual === 0) {
        alert('ERROR: Este repuesto NO tiene stock disponible. No se puede agregar al presupuesto.');
        return;
    }

    if (cantidad > repuestoSeleccionado.stockActual) {
        alert(`ERROR: Stock insuficiente. Solo hay ${repuestoSeleccionado.stockActual} unidades disponibles.`);
        return;
    }

    // Advertencia si se está comprometiendo mucho stock
    if (cantidad > repuestoSeleccionado.stockActual * 0.8) {
        if (!confirm(`ADVERTENCIA: Va a comprometer ${cantidad} de ${repuestoSeleccionado.stockActual} unidades disponibles (${Math.round(cantidad/repuestoSeleccionado.stockActual*100)}%). ¿Desea continuar?`)) {
            return;
        }
    }

    const item = {
        tipoItem: 'REPUESTO',
        idRepuesto: repuestoSeleccionado.idRepuesto,
        descripcion: `${repuestoSeleccionado.codigo} - ${repuestoSeleccionado.nombre}`,
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        subtotal: cantidad * precioUnitario,
        stockDisponible: repuestoSeleccionado.stockActual
    };

    presupuestoItems.push(item);

    // Limpiar formulario
    document.getElementById('selectRepuesto').value = '';
    document.getElementById('repuestoCantidad').value = '1';
    document.getElementById('repuestoPrecio').value = '';
    document.getElementById('repuestoStock').value = '';
    document.getElementById('repuestoInfo').style.display = 'none';
    document.getElementById('repuestoAlerta').style.display = 'none';
    repuestoSeleccionado = null;

    renderItemsTable();
    calcularTotales();
}

// Hacer la función global
window.agregarRepuesto = agregarRepuesto;

// ==============================================
// FUNCIONES PARA VISTA PREVIA Y PDF
// ==============================================

let modalVistaPrevia = null;
let presupuestoActualPDF = null;

// Vista previa del presupuesto
async function vistaPrevia(id) {
    try {
        const response = await PresupuestoService.getById(id);

        if (response.success && response.data) {
            const presupuesto = response.data;
            presupuestoActualPDF = presupuesto;

            const contenido = generarHTMLPresupuesto(presupuesto);
            document.getElementById('vistaPreviaContent').innerHTML = contenido;

            // Configurar botón de descarga en el modal
            document.getElementById('btnDescargarPDF').onclick = () => generarPDF(id);

            if (!modalVistaPrevia) {
                modalVistaPrevia = new bootstrap.Modal(document.getElementById('modalVistaPrevia'));
            }
            modalVistaPrevia.show();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar la vista previa del presupuesto');
    }
}

// Hacer la función global
window.vistaPrevia = vistaPrevia;

// Generar PDF del presupuesto
async function generarPDF(id) {
    try {
        let presupuesto = presupuestoActualPDF;

        // Si no tenemos el presupuesto en memoria, cargarlo
        if (!presupuesto || presupuesto.idPresupuesto !== id) {
            const response = await PresupuestoService.getById(id);
            if (response.success && response.data) {
                presupuesto = response.data;
            } else {
                throw new Error('No se pudo cargar el presupuesto');
            }
        }

        // Crear elemento temporal para el PDF
        const elementoPDF = document.createElement('div');
        elementoPDF.innerHTML = generarHTMLPresupuesto(presupuesto, true);
        elementoPDF.style.padding = '20px';
        document.body.appendChild(elementoPDF);

        const opciones = {
            margin: 10,
            filename: `Presupuesto_${presupuesto.numeroPresupuesto}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await html2pdf().set(opciones).from(elementoPDF).save();

        // Limpiar elemento temporal
        document.body.removeChild(elementoPDF);

    } catch (error) {
        console.error('Error:', error);
        alert('Error al generar el PDF: ' + error.message);
    }
}

// Hacer la función global
window.generarPDF = generarPDF;

// Generar HTML del presupuesto para vista previa y PDF
function generarHTMLPresupuesto(presupuesto, paraPDF = false) {
    const cliente = presupuesto.pedido?.cliente || {};
    const items = presupuesto.items || [];

    const estiloExtra = paraPDF ? 'font-size: 12px;' : '';

    return `
        <div style="font-family: Arial, sans-serif; ${estiloExtra}">
            <!-- Encabezado -->
            <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #007bff; padding-bottom: 15px;">
                <h2 style="margin: 0; color: #007bff;">
                    <i class="fas fa-tools"></i> MULTISERVICIOS
                </h2>
                <p style="margin: 5px 0; color: #666;">Sistema de Gestión de Servicios</p>
            </div>

            <!-- Título del documento -->
            <div style="text-align: center; margin-bottom: 20px;">
                <h3 style="margin: 0; background: #f8f9fa; padding: 10px; border-radius: 5px;">
                    PRESUPUESTO N° ${presupuesto.numeroPresupuesto}
                </h3>
            </div>

            <!-- Información del cliente y presupuesto -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <div style="flex: 1; padding-right: 10px;">
                    <h5 style="color: #007bff; margin-bottom: 10px;">
                        <i class="fas fa-user"></i> Datos del Cliente
                    </h5>
                    <p style="margin: 3px 0;"><strong>Nombre:</strong> ${cliente.nombre || ''} ${cliente.apellido || ''}</p>
                    <p style="margin: 3px 0;"><strong>RUC/CI:</strong> ${cliente.ruc || cliente.cedula || 'N/A'}</p>
                    <p style="margin: 3px 0;"><strong>Teléfono:</strong> ${cliente.telefono || 'N/A'}</p>
                    <p style="margin: 3px 0;"><strong>Email:</strong> ${cliente.email || 'N/A'}</p>
                    <p style="margin: 3px 0;"><strong>Dirección:</strong> ${cliente.direccion || 'N/A'}</p>
                </div>
                <div style="flex: 1; padding-left: 10px; text-align: right;">
                    <h5 style="color: #007bff; margin-bottom: 10px;">
                        <i class="fas fa-file-invoice"></i> Datos del Presupuesto
                    </h5>
                    <p style="margin: 3px 0;"><strong>Pedido:</strong> ${presupuesto.pedido?.numeroPedido || 'N/A'}</p>
                    <p style="margin: 3px 0;"><strong>Fecha:</strong> ${formatDate(presupuesto.fechaGeneracion)}</p>
                    <p style="margin: 3px 0;"><strong>Vencimiento:</strong> ${presupuesto.fechaVencimiento ? formatDateOnly(presupuesto.fechaVencimiento) : 'N/A'}</p>
                    <p style="margin: 3px 0;"><strong>Validez:</strong> ${presupuesto.validezDias || 15} días</p>
                    <p style="margin: 3px 0;">
                        <strong>Estado:</strong>
                        <span style="padding: 2px 8px; border-radius: 3px; background: ${getEstadoColorHex(presupuesto.estado)}; color: white;">
                            ${formatEstado(presupuesto.estado)}
                        </span>
                    </p>
                </div>
            </div>

            <!-- Tabla de Items -->
            <div style="margin-bottom: 20px;">
                <h5 style="color: #007bff; margin-bottom: 10px;">
                    <i class="fas fa-list"></i> Detalle de Items
                </h5>
                <table style="width: 100%; border-collapse: collapse; font-size: ${paraPDF ? '11px' : '13px'};">
                    <thead>
                        <tr style="background: #007bff; color: white;">
                            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Descripción</th>
                            <th style="padding: 8px; text-align: center; border: 1px solid #ddd; width: 80px;">Cant.</th>
                            <th style="padding: 8px; text-align: right; border: 1px solid #ddd; width: 100px;">P. Unit.</th>
                            <th style="padding: 8px; text-align: right; border: 1px solid #ddd; width: 100px;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td style="padding: 6px 8px; border: 1px solid #ddd;">
                                    ${getTipoItemBadgeHTML(item.tipoItem)} ${item.descripcion}
                                </td>
                                <td style="padding: 6px 8px; text-align: center; border: 1px solid #ddd;">${item.cantidad}</td>
                                <td style="padding: 6px 8px; text-align: right; border: 1px solid #ddd;">${formatMoney(item.precioUnitario)}</td>
                                <td style="padding: 6px 8px; text-align: right; border: 1px solid #ddd;"><strong>${formatMoney(item.subtotal || item.cantidad * item.precioUnitario)}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Totales -->
            <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
                <div style="width: 300px; background: #f8f9fa; padding: 15px; border-radius: 5px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Subtotal:</span>
                        <span>${formatMoney(presupuesto.subtotal)}</span>
                    </div>
                    ${presupuesto.descuento > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #dc3545;">
                        <span>Descuento:</span>
                        <span>-${formatMoney(presupuesto.descuento)}</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>IVA (10%):</span>
                        <span>${formatMoney(presupuesto.iva)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 1.2em; font-weight: bold; border-top: 2px solid #007bff; padding-top: 10px; margin-top: 10px;">
                        <span>TOTAL:</span>
                        <span style="color: #007bff;">${formatMoney(presupuesto.total)}</span>
                    </div>
                </div>
            </div>

            <!-- Condiciones de Pago -->
            ${presupuesto.condicionesPago ? `
            <div style="margin-bottom: 15px;">
                <h5 style="color: #007bff; margin-bottom: 10px;">
                    <i class="fas fa-file-contract"></i> Condiciones de Pago
                </h5>
                <p style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 0;">
                    ${presupuesto.condicionesPago}
                </p>
            </div>
            ` : ''}

            <!-- Observaciones -->
            ${presupuesto.observaciones ? `
            <div style="margin-bottom: 15px;">
                <h5 style="color: #007bff; margin-bottom: 10px;">
                    <i class="fas fa-comment"></i> Observaciones
                </h5>
                <p style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 0;">
                    ${presupuesto.observaciones}
                </p>
            </div>
            ` : ''}

            <!-- Pie de página -->
            <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; color: #666; font-size: 11px;">
                <p style="margin: 0;">Este presupuesto tiene una validez de ${presupuesto.validezDias || 15} días desde su fecha de emisión.</p>
                <p style="margin: 5px 0;">Para consultas comunicarse al teléfono: (XXX) XXX-XXXX</p>
            </div>
        </div>
    `;
}

// Obtener color hexadecimal para el estado
function getEstadoColorHex(estado) {
    const colors = {
        'PENDIENTE': '#ffc107',
        'ACEPTADO': '#28a745',
        'RECHAZADO': '#dc3545',
        'VENCIDO': '#6c757d'
    };
    return colors[estado] || '#6c757d';
}

// Badge HTML para tipo de item (sin Font Awesome para PDF)
function getTipoItemBadgeHTML(tipoItem) {
    const badges = {
        'SERVICIO': '<span style="background: #007bff; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">Servicio</span>',
        'REPUESTO': '<span style="background: #17a2b8; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">Repuesto</span>',
        'MANUAL': '<span style="background: #6c757d; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">Manual</span>'
    };
    return badges[tipoItem] || '';
}

document.addEventListener('DOMContentLoaded', function() {
    cargarPresupuestos();
    cargarDatosFormulario();
    cargarServiciosCatalogo();
    cargarRepuestosCatalogo();
});
