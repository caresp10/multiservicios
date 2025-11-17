// Verificar autenticación
AuthService.checkAuth();

const user = AuthService.getUser();
document.getElementById('userName').textContent = `${user.nombre} ${user.apellido}`;
document.getElementById('userRole').textContent = user.rol;
document.getElementById('userAvatar').textContent = user.nombre.charAt(0);

if (user.rol !== 'ADMIN') {
    document.getElementById('menuUsuarios').style.display = 'none';
}

let facturas = [];
let ordenesTerminadas = [];
let ordenSeleccionada = null;
let itemsAdicionales = [];
const modal = new bootstrap.Modal(document.getElementById('modalFactura'));

document.getElementById('sidebarToggle')?.addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
});

function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        AuthService.logout();
    }
}

// Cargar facturas existentes
async function cargarFacturas() {
    const table = document.getElementById('facturasTable');

    try {
        const response = await FacturaService.getAll();

        if (response.success && response.data) {
            facturas = response.data;
            renderFacturas(facturas);
        } else {
            throw new Error(response.message || 'Error al cargar facturas');
        }
    } catch (error) {
        console.error('Error:', error);
        table.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle"></i> Error al cargar facturas
                </td>
            </tr>
        `;
    }
}

function renderFacturas(data) {
    const table = document.getElementById('facturasTable');

    if (data.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i><br>
                    No hay facturas registradas
                </td>
            </tr>
        `;
        return;
    }

    table.innerHTML = data.map(factura => `
        <tr>
            <td><strong>${factura.numeroFactura}</strong></td>
            <td>${factura.cliente?.nombre || 'N/A'} ${factura.cliente?.apellido || ''}</td>
            <td>${formatDate(factura.fechaEmision)}</td>
            <td>${formatMoney(factura.subtotal)}</td>
            <td>${formatMoney(factura.iva)}</td>
            <td><strong>${formatMoney(factura.total)}</strong></td>
            <td>
                <span class="badge bg-${getEstadoColor(factura.estado)}">
                    ${formatEstado(factura.estado)}
                </span>
            </td>
            <td>${factura.formaPago || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-outline-info" onclick="verDetallesFactura(${factura.idFactura})"
                        title="Ver Detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-success" onclick="exportarPDF(${factura.idFactura})"
                        title="Exportar PDF">
                    <i class="fas fa-file-pdf"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarFactura(${factura.idFactura})"
                        title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

document.getElementById('searchInput').addEventListener('input', aplicarFiltros);
document.getElementById('filterEstado').addEventListener('change', aplicarFiltros);
document.getElementById('filterCliente').addEventListener('change', aplicarFiltros);

function aplicarFiltros() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const estado = document.getElementById('filterEstado').value;
    const cliente = document.getElementById('filterCliente').value;

    let filtered = facturas.filter(factura => {
        const matchSearch = factura.numeroFactura.toLowerCase().includes(searchTerm) ||
                          (factura.cliente?.nombre || '').toLowerCase().includes(searchTerm);
        const matchEstado = !estado || factura.estado === estado;
        const matchCliente = !cliente || (factura.cliente && factura.cliente.idCliente == cliente);

        return matchSearch && matchEstado && matchCliente;
    });

    renderFacturas(filtered);
}

// ============================================
// NUEVO FLUJO DE FACTURACIÓN
// ============================================

async function openModalFactura() {
    // Reset
    ordenSeleccionada = null;
    itemsAdicionales = [];
    document.getElementById('detalleVacio').style.display = 'block';
    document.getElementById('detalleOT').style.display = 'none';
    document.getElementById('btnGenerarFactura').style.display = 'none';

    // Cargar OTs terminadas
    await cargarOrdenesTerminadas();

    modal.show();
}

async function cargarOrdenesTerminadas() {
    const listaContainer = document.getElementById('listaOTs');

    try {
        const response = await OrdenTrabajoService.getAll();

        if (response.success && response.data) {
            // Filtrar solo OTs TERMINADAS
            ordenesTerminadas = response.data.filter(ot => ot.estado === 'TERMINADA');

            if (ordenesTerminadas.length === 0) {
                listaContainer.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-info-circle"></i> No hay órdenes de trabajo terminadas para facturar
                    </div>
                `;
                return;
            }

            renderListaOTs(ordenesTerminadas);
        }
    } catch (error) {
        console.error('Error:', error);
        listaContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i> Error al cargar órdenes de trabajo
            </div>
        `;
    }
}

function renderListaOTs(ordenes) {
    const listaContainer = document.getElementById('listaOTs');

    listaContainer.innerHTML = ordenes.map(ot => `
        <div class="card mb-2 cursor-pointer ot-card" onclick="seleccionarOT(${ot.idOt})" data-ot-id="${ot.idOt}">
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${ot.numeroOt}</h6>
                        <small class="text-muted">
                            <i class="fas fa-user"></i> ${ot.pedido?.cliente?.nombre || 'N/A'} ${ot.pedido?.cliente?.apellido || ''}
                        </small><br>
                        <small class="text-muted">
                            <i class="fas fa-receipt"></i> Pedido: ${ot.pedido?.numeroPedido || 'N/A'}
                        </small>
                    </div>
                    <span class="badge bg-success">Terminada</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Buscar OTs
document.getElementById('searchOT')?.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const filtered = ordenesTerminadas.filter(ot =>
        ot.numeroOt.toLowerCase().includes(searchTerm) ||
        (ot.pedido?.cliente?.nombre || '').toLowerCase().includes(searchTerm) ||
        (ot.pedido?.numeroPedido || '').toLowerCase().includes(searchTerm)
    );
    renderListaOTs(filtered);
});

async function seleccionarOT(idOt) {
    try {
        // Marcar visualmente la OT seleccionada
        document.querySelectorAll('.ot-card').forEach(card => {
            card.classList.remove('border-primary', 'border-2');
        });
        document.querySelector(`[data-ot-id="${idOt}"]`).classList.add('border-primary', 'border-2');

        const response = await OrdenTrabajoService.getById(idOt);

        if (response.success && response.data) {
            ordenSeleccionada = response.data;
            itemsAdicionales = [];

            // Cargar datos de facturación
            const datosResponse = await FacturaService.getDatosParaFacturar(idOt);

            if (datosResponse.success && datosResponse.data) {
                mostrarDetalleOT(ordenSeleccionada, datosResponse.data);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los datos de la orden de trabajo');
    }
}

function mostrarDetalleOT(ot, datosFacturacion) {
    document.getElementById('detalleVacio').style.display = 'none';
    document.getElementById('detalleOT').style.display = 'block';
    document.getElementById('btnGenerarFactura').style.display = 'inline-block';

    // Hidden fields
    document.getElementById('otSeleccionadaId').value = ot.idOt;
    document.getElementById('idCliente').value = datosFacturacion.cliente.idCliente;
    document.getElementById('idPedido').value = datosFacturacion.pedido.idPedido;

    // Información General
    document.getElementById('detNumeroOT').textContent = ot.numeroOt;
    document.getElementById('detNumeroPedido').textContent = datosFacturacion.pedido.numeroPedido;
    document.getElementById('detCliente').textContent = `${datosFacturacion.cliente.nombre} ${datosFacturacion.cliente.apellido || ''}`;
    document.getElementById('detDocumento').textContent = datosFacturacion.cliente.documento || 'N/A';
    document.getElementById('detDireccion').textContent = datosFacturacion.cliente.direccion || 'N/A';
    document.getElementById('detTelefono').textContent = datosFacturacion.cliente.telefono || 'N/A';
    document.getElementById('detTecnico').textContent = ot.tecnico ?
        `${ot.tecnico.nombre} ${ot.tecnico.apellido}` : 'N/A';
    document.getElementById('detFechaFinalizacion').textContent = formatDate(ot.fechaFinalizacion);

    // Trabajo Realizado
    document.getElementById('detProblemaInicial').textContent = datosFacturacion.pedido.descripcion || 'N/A';
    document.getElementById('detDiagnostico').textContent = ot.diagnosticoTecnico || 'N/A';
    document.getElementById('detInforme').textContent = ot.informeFinal || 'N/A';
    document.getElementById('detHoras').textContent = ot.horasTrabajadas ?
        `${ot.horasTrabajadas} horas` : 'N/A';
    document.getElementById('detCostoManoObra').textContent = ot.costoManoObra ?
        formatMoney(ot.costoManoObra) : 'N/A';

    // Items del Presupuesto
    const tbodyPresupuesto = document.getElementById('detItemsPresupuesto');
    if (datosFacturacion.itemsPresupuesto && datosFacturacion.itemsPresupuesto.length > 0) {
        tbodyPresupuesto.innerHTML = datosFacturacion.itemsPresupuesto.map(item => `
            <tr>
                <td>${item.descripcion}</td>
                <td class="text-end">${formatNumber(item.cantidad)}</td>
                <td class="text-end">${formatMoney(item.precioUnitario)}</td>
                <td class="text-end">${formatMoney(item.subtotal)}</td>
            </tr>
        `).join('');
    } else {
        tbodyPresupuesto.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">No hay items en el presupuesto</td>
            </tr>
        `;
    }

    // Repuestos Informativos (registrados por el técnico)
    if (ot.repuestos && ot.repuestos.length > 0) {
        document.getElementById('cardRepuestosInformativos').style.display = 'block';
        const tbodyRepuestos = document.getElementById('detRepuestosInformativos');
        tbodyRepuestos.innerHTML = ot.repuestos.map(r => `
            <tr>
                <td>${r.repuesto?.nombre || 'N/A'}</td>
                <td class="text-center">${r.cantidad}</td>
            </tr>
        `).join('');
    } else {
        document.getElementById('cardRepuestosInformativos').style.display = 'none';
    }

    // Reset items adicionales
    renderItemsAdicionales();

    // Calcular totales iniciales
    calcularTotales();
}

function agregarItemFactura() {
    const descripcion = document.getElementById('nuevoItemDesc').value.trim();
    const cantidad = parseFloat(document.getElementById('nuevoItemCant').value);
    const precioUnitario = parseFloat(document.getElementById('nuevoItemPrecio').value);

    if (!descripcion) {
        alert('Debe ingresar una descripción');
        return;
    }

    if (!cantidad || cantidad <= 0) {
        alert('Debe ingresar una cantidad válida');
        return;
    }

    if (!precioUnitario || precioUnitario < 0) {
        alert('Debe ingresar un precio unitario válido');
        return;
    }

    const subtotal = cantidad * precioUnitario;

    itemsAdicionales.push({
        descripcion: descripcion,
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        subtotal: subtotal
    });

    // Limpiar campos
    document.getElementById('nuevoItemDesc').value = '';
    document.getElementById('nuevoItemCant').value = '1';
    document.getElementById('nuevoItemPrecio').value = '';

    renderItemsAdicionales();
    calcularTotales();
}

function renderItemsAdicionales() {
    const tbody = document.getElementById('detItemsAdicionales');

    if (itemsAdicionales.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">No hay items adicionales agregados</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = itemsAdicionales.map((item, index) => `
        <tr>
            <td>${item.descripcion}</td>
            <td class="text-end">${formatNumber(item.cantidad)}</td>
            <td class="text-end">${formatMoney(item.precioUnitario)}</td>
            <td class="text-end">${formatMoney(item.subtotal)}</td>
            <td class="text-center">
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarItemAdicional(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function eliminarItemAdicional(index) {
    itemsAdicionales.splice(index, 1);
    renderItemsAdicionales();
    calcularTotales();
}

async function calcularTotales() {
    if (!ordenSeleccionada) return;

    try {
        const idOt = ordenSeleccionada.idOt;
        const datosResponse = await FacturaService.getDatosParaFacturar(idOt);

        if (datosResponse.success && datosResponse.data) {
            const datos = datosResponse.data;

            // Subtotal del presupuesto original
            let subtotal = parseFloat(datos.subtotal) || 0;

            // Sumar items adicionales
            itemsAdicionales.forEach(item => {
                subtotal += parseFloat(item.subtotal);
            });

            // Calcular IVA (10%)
            const iva = subtotal * 0.10;
            const total = subtotal + iva;

            // Mostrar totales
            document.getElementById('totalSubtotal').textContent = formatMoney(subtotal);
            document.getElementById('totalIva').textContent = formatMoney(iva);
            document.getElementById('totalFinal').textContent = formatMoney(total);
        }
    } catch (error) {
        console.error('Error calculando totales:', error);
    }
}

async function guardarFactura() {
    const form = document.getElementById('facturaForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    if (!ordenSeleccionada) {
        alert('Debe seleccionar una orden de trabajo');
        return;
    }

    // Obtener totales
    const subtotalText = document.getElementById('totalSubtotal').textContent;
    const ivaText = document.getElementById('totalIva').textContent;
    const totalText = document.getElementById('totalFinal').textContent;

    // Parsear montos (eliminar símbolo de moneda y formateo)
    const subtotal = parseFloat(subtotalText.replace(/[₲.,]/g, ''));
    const iva = parseFloat(ivaText.replace(/[₲.,]/g, ''));
    const total = parseFloat(totalText.replace(/[₲.,]/g, ''));

    const facturaData = {
        cliente: {
            idCliente: parseInt(document.getElementById('idCliente').value)
        },
        ot: {
            idOt: parseInt(document.getElementById('otSeleccionadaId').value)
        },
        pedido: {
            idPedido: parseInt(document.getElementById('idPedido').value)
        },
        formaPago: document.getElementById('formaPago').value,
        estado: document.getElementById('estado').value,
        subtotal: subtotal,
        descuento: parseFloat(document.getElementById('descuento').value) || 0,
        iva: iva,
        total: total,
        timbrado: document.getElementById('timbrado').value || null,
        fechaVencimiento: document.getElementById('fechaVencimiento').value || null,
        observaciones: document.getElementById('observaciones').value || null,
        itemsAdicionales: itemsAdicionales
    };

    try {
        const response = await FacturaService.create(facturaData);

        if (response.success) {
            modal.hide();
            await cargarFacturas();
            alert('Factura generada exitosamente. La orden de trabajo y el pedido han sido marcados como FACTURADOS.');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al generar la factura: ' + error.message);
    }
}

async function editarFactura(id) {
    alert('La edición de facturas no está disponible en este flujo. Para modificar una factura, debe eliminarla y generarla nuevamente.');
}

async function eliminarFactura(id) {
    if (!confirm('¿Está seguro que desea eliminar esta factura? NOTA: Esto NO revertirá el estado de la OT y Pedido.')) {
        return;
    }

    try {
        const response = await FacturaService.delete(id);

        if (response.success) {
            await cargarFacturas();
            alert('Factura eliminada exitosamente');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la factura: ' + error.message);
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

function formatMoney(amount) {
    return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: 'PYG',
        minimumFractionDigits: 0
    }).format(amount || 0);
}

function formatNumber(num) {
    return new Intl.NumberFormat('es-PY', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(num || 0);
}

function formatEstado(estado) {
    const estados = {
        'PENDIENTE': 'Pendiente',
        'PAGADA': 'Pagada',
        'VENCIDA': 'Vencida',
        'ANULADA': 'Anulada'
    };
    return estados[estado] || estado;
}

function getEstadoColor(estado) {
    const colors = {
        'PENDIENTE': 'warning',
        'PAGADA': 'success',
        'VENCIDA': 'danger',
        'ANULADA': 'secondary'
    };
    return colors[estado] || 'secondary';
}

// Cargar filtro de clientes
async function cargarFiltroClientes() {
    try {
        const response = await ClienteService.getAll();
        if (response.success && response.data) {
            const select = document.getElementById('filterCliente');
            select.innerHTML = '<option value="">Todos los clientes</option>' +
                response.data.map(c => `<option value="${c.idCliente}">${c.nombre} ${c.apellido || ''}</option>`).join('');
        }
    } catch (error) {
        console.error('Error cargando clientes:', error);
    }
}

// Ver detalles de factura
let modalDetallesFactura;

async function verDetallesFactura(id) {
    try {
        const response = await FacturaService.getById(id);

        if (response.success && response.data) {
            const factura = response.data;

            // Cargar datos en el modal
            document.getElementById('verNumeroFactura').textContent = factura.numeroFactura;
            document.getElementById('verFechaEmision').textContent = formatDate(factura.fechaEmision);
            document.getElementById('verCliente').textContent = `${factura.cliente?.nombre || 'N/A'} ${factura.cliente?.apellido || ''}`;
            document.getElementById('verDocumento').textContent = factura.cliente?.documento || 'N/A';
            document.getElementById('verDireccionCliente').textContent = factura.cliente?.direccion || 'N/A';
            document.getElementById('verTelefonoCliente').textContent = factura.cliente?.telefono || 'N/A';
            document.getElementById('verEstado').textContent = formatEstado(factura.estado);
            document.getElementById('verFormaPago').textContent = factura.formaPago || 'N/A';
            document.getElementById('verTimbrado').textContent = factura.timbrado || 'N/A';
            document.getElementById('verFechaVencimiento').textContent = factura.fechaVencimiento ? formatDate(factura.fechaVencimiento) : 'N/A';
            document.getElementById('verObservaciones').textContent = factura.observaciones || '-';

            // Cargar items
            const tbody = document.getElementById('verItemsFactura');
            if (factura.items && factura.items.length > 0) {
                tbody.innerHTML = factura.items.map(item => `
                    <tr>
                        <td>${item.descripcion}</td>
                        <td class="text-end">${formatNumber(item.cantidad)}</td>
                        <td class="text-end">${formatMoney(item.precioUnitario)}</td>
                        <td class="text-end">${formatMoney(item.subtotal)}</td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-muted">No hay items en esta factura</td>
                    </tr>
                `;
            }

            // Totales
            document.getElementById('verSubtotal').textContent = formatMoney(factura.subtotal);
            document.getElementById('verDescuento').textContent = formatMoney(factura.descuento);
            document.getElementById('verIva').textContent = formatMoney(factura.iva);
            document.getElementById('verTotal').textContent = formatMoney(factura.total);

            modalDetallesFactura.show();
        }
    } catch (error) {
        console.error('Error cargando detalles de factura:', error);
        alert('Error al cargar los detalles de la factura');
    }
}

// Exportar factura a PDF
async function exportarPDF(id) {
    try {
        const response = await FacturaService.getById(id);

        if (response.success && response.data) {
            const factura = response.data;

            // Crear ventana de impresión
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Factura ${factura.numeroFactura}</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                        @media print {
                            .no-print { display: none; }
                        }
                        body { padding: 20px; }
                        .factura-header { border-bottom: 2px solid #000; margin-bottom: 20px; padding-bottom: 10px; }
                        .factura-footer { border-top: 2px solid #000; margin-top: 20px; padding-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="factura-header">
                            <div class="row">
                                <div class="col-6">
                                    <h2>FACTURA</h2>
                                    <p><strong>Nº:</strong> ${factura.numeroFactura}</p>
                                    <p><strong>Fecha:</strong> ${formatDate(factura.fechaEmision)}</p>
                                    <p><strong>Timbrado:</strong> ${factura.timbrado || 'N/A'}</p>
                                </div>
                                <div class="col-6 text-end">
                                    <h4>MULTISERVICIOS</h4>
                                    <p>RUC: XXXXXXXXX-X</p>
                                    <p>Dirección comercial</p>
                                    <p>Tel: XXX-XXXX</p>
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h5>Cliente</h5>
                            <p><strong>Nombre:</strong> ${factura.cliente?.nombre || 'N/A'} ${factura.cliente?.apellido || ''}</p>
                            <p><strong>Documento:</strong> ${factura.cliente?.documento || 'N/A'}</p>
                            <p><strong>Dirección:</strong> ${factura.cliente?.direccion || 'N/A'}</p>
                            <p><strong>Teléfono:</strong> ${factura.cliente?.telefono || 'N/A'}</p>
                        </div>

                        <table class="table table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th>Descripción</th>
                                    <th class="text-end">Cantidad</th>
                                    <th class="text-end">Precio Unit.</th>
                                    <th class="text-end">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${factura.items && factura.items.length > 0 ? factura.items.map(item => `
                                    <tr>
                                        <td>${item.descripcion}</td>
                                        <td class="text-end">${formatNumber(item.cantidad)}</td>
                                        <td class="text-end">${formatMoney(item.precioUnitario)}</td>
                                        <td class="text-end">${formatMoney(item.subtotal)}</td>
                                    </tr>
                                `).join('') : '<tr><td colspan="4" class="text-center">No hay items</td></tr>'}
                            </tbody>
                        </table>

                        <div class="factura-footer">
                            <div class="row">
                                <div class="col-6">
                                    <p><strong>Forma de Pago:</strong> ${factura.formaPago || 'N/A'}</p>
                                    <p><strong>Estado:</strong> ${formatEstado(factura.estado)}</p>
                                    ${factura.observaciones ? `<p><strong>Observaciones:</strong> ${factura.observaciones}</p>` : ''}
                                </div>
                                <div class="col-6">
                                    <table class="table table-sm">
                                        <tr>
                                            <td class="text-end"><strong>Subtotal:</strong></td>
                                            <td class="text-end">${formatMoney(factura.subtotal)}</td>
                                        </tr>
                                        ${factura.descuento > 0 ? `
                                        <tr>
                                            <td class="text-end"><strong>Descuento:</strong></td>
                                            <td class="text-end">${formatMoney(factura.descuento)}</td>
                                        </tr>
                                        ` : ''}
                                        <tr>
                                            <td class="text-end"><strong>IVA (10%):</strong></td>
                                            <td class="text-end">${formatMoney(factura.iva)}</td>
                                        </tr>
                                        <tr class="table-primary">
                                            <td class="text-end"><strong>TOTAL:</strong></td>
                                            <td class="text-end"><strong>${formatMoney(factura.total)}</strong></td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div class="text-center mt-4 no-print">
                            <button class="btn btn-primary" onclick="window.print()">
                                <i class="fas fa-print"></i> Imprimir / Guardar como PDF
                            </button>
                            <button class="btn btn-secondary" onclick="window.close()">
                                <i class="fas fa-times"></i> Cerrar
                            </button>
                        </div>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    } catch (error) {
        console.error('Error exportando PDF:', error);
        alert('Error al exportar la factura a PDF');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    cargarFacturas();
    cargarFiltroClientes();

    // Inicializar modal de detalles
    const modalElement = document.getElementById('modalDetallesFactura');
    if (modalElement) {
        modalDetallesFactura = new bootstrap.Modal(modalElement);
    }
});
