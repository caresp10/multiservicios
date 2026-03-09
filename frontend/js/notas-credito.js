// Variables globales
let notasCredito = [];
let notasCreditoFiltradas = [];
let facturaActual = null;

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', async function() {
    if (!AuthService.isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }

    inicializarPagina();
    await cargarNotasCredito();
    configurarEventListeners();

    // Verificar si se debe abrir el modal de crear NC automáticamente
    const urlParams = new URLSearchParams(window.location.search);
    const idFactura = urlParams.get('factura');
    const crear = urlParams.get('crear');

    if (idFactura && crear === 'true') {
        await cargarYAbrirModalNC(idFactura);
    }
});

function inicializarPagina() {
    const user = AuthService.getUser();
    if (user) {
        document.getElementById('userName').textContent = user.nombre;
        document.getElementById('userRole').textContent = user.rol || 'Usuario';

        const avatar = document.getElementById('userAvatar');
        avatar.textContent = user.nombre.charAt(0).toUpperCase();
    }
}

function configurarEventListeners() {
    // Búsqueda
    document.getElementById('searchInput').addEventListener('input', filtrarNotasCredito);

    // Filtros
    document.getElementById('filterEstado').addEventListener('change', filtrarNotasCredito);
    document.getElementById('filterTipo').addEventListener('change', filtrarNotasCredito);

    // Limpiar filtros
    document.getElementById('btnLimpiarFiltros').addEventListener('click', limpiarFiltros);

    // Botón guardar NC
    document.getElementById('btnGuardarNC').addEventListener('click', guardarNotaCredito);

    // Botón imprimir
    document.getElementById('btnImprimirNC').addEventListener('click', () => window.print());

    // Cambio de tipo NC
    document.getElementById('ncTipo').addEventListener('change', actualizarItemsSegunTipo);
}

async function cargarNotasCredito() {
    try {
        const response = await NotaCreditoService.getAll();

        if (response.success) {
            notasCredito = response.data || [];
            notasCreditoFiltradas = [...notasCredito];
            renderizarTabla();
        } else {
            mostrarError('Error al cargar notas de crédito: ' + response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar notas de crédito');
    }
}

function renderizarTabla() {
    const tbody = document.getElementById('notasCreditoTableBody');

    if (notasCreditoFiltradas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">
                    <i class="fas fa-inbox fa-3x mb-3"></i>
                    <p>No hay notas de crédito registradas</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = notasCreditoFiltradas.map(nc => {
        const estadoBadge = obtenerBadgeEstado(nc.estado);
        const tipoBadge = nc.tipo === 'TOTAL'
            ? '<span class="badge bg-danger">Total</span>'
            : '<span class="badge bg-warning">Parcial</span>';
        const motivoBadge = obtenerBadgeMotivo(nc.motivo);

        return `
            <tr>
                <td><strong>${nc.numeroNotaCredito}</strong></td>
                <td>${nc.factura?.numeroFactura || 'N/A'}</td>
                <td>${nc.factura?.cliente?.nombre || 'N/A'}</td>
                <td>${tipoBadge}</td>
                <td>${motivoBadge}</td>
                <td>${formatearFecha(nc.fechaEmision)}</td>
                <td><strong>${formatearMoneda(nc.total)}</strong></td>
                <td>${estadoBadge}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="verNotaCredito(${nc.idNotaCredito})"
                            title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${nc.estado === 'PENDIENTE' ? `
                        <button class="btn btn-sm btn-success" onclick="aplicarNC(${nc.idNotaCredito})"
                                title="Aplicar">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="anularNC(${nc.idNotaCredito})"
                                title="Anular">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function obtenerBadgeEstado(estado) {
    const badges = {
        'PENDIENTE': '<span class="badge bg-warning">Pendiente</span>',
        'APLICADA': '<span class="badge bg-success">Aplicada</span>',
        'ANULADA': '<span class="badge bg-danger">Anulada</span>'
    };
    return badges[estado] || '<span class="badge bg-secondary">Desconocido</span>';
}

function obtenerBadgeMotivo(motivo) {
    const badges = {
        'DEVOLUCION': '<span class="badge bg-info">Devolución</span>',
        'ERROR_FACTURACION': '<span class="badge bg-danger">Error Fact.</span>',
        'DESCUENTO': '<span class="badge bg-success">Descuento</span>',
        'OTRO': '<span class="badge bg-secondary">Otro</span>'
    };
    return badges[motivo] || '<span class="badge bg-secondary">N/A</span>';
}

function filtrarNotasCredito() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filterEstado = document.getElementById('filterEstado').value;
    const filterTipo = document.getElementById('filterTipo').value;

    notasCreditoFiltradas = notasCredito.filter(nc => {
        const matchSearch = !searchTerm ||
            nc.numeroNotaCredito.toLowerCase().includes(searchTerm) ||
            (nc.factura?.numeroFactura || '').toLowerCase().includes(searchTerm) ||
            (nc.factura?.cliente?.nombre || '').toLowerCase().includes(searchTerm);

        const matchEstado = !filterEstado || nc.estado === filterEstado;
        const matchTipo = !filterTipo || nc.tipo === filterTipo;

        return matchSearch && matchEstado && matchTipo;
    });

    renderizarTabla();
}

function limpiarFiltros() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterEstado').value = '';
    document.getElementById('filterTipo').value = '';
    filtrarNotasCredito();
}

async function verNotaCredito(idNC) {
    try {
        const response = await NotaCreditoService.getById(idNC);

        if (response.success) {
            const nc = response.data;
            mostrarVistaPrevia(nc);
        } else {
            mostrarError('Error al obtener nota de crédito: ' + response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al obtener nota de crédito');
    }
}

function mostrarVistaPrevia(nc) {
    const content = document.getElementById('vistaNCContent');

    const estadoBadge = obtenerBadgeEstado(nc.estado);
    const tipoBadge = nc.tipo === 'TOTAL'
        ? '<span class="badge bg-danger">Total</span>'
        : '<span class="badge bg-warning">Parcial</span>';

    content.innerHTML = `
        <div class="invoice-preview">
            <div class="text-center mb-4">
                <h2>NOTA DE CRÉDITO</h2>
                <p class="mb-0"><strong>N°: ${nc.numeroNotaCredito}</strong></p>
            </div>

            <div class="row mb-4">
                <div class="col-md-6">
                    <h5>Información de la Nota</h5>
                    <p class="mb-1"><strong>Fecha Emisión:</strong> ${formatearFechaCompleta(nc.fechaEmision)}</p>
                    <p class="mb-1"><strong>Tipo:</strong> ${tipoBadge}</p>
                    <p class="mb-1"><strong>Motivo:</strong> ${obtenerBadgeMotivo(nc.motivo)}</p>
                    <p class="mb-1"><strong>Estado:</strong> ${estadoBadge}</p>
                    ${nc.fechaAplicacion ? `<p class="mb-1"><strong>Fecha Aplicación:</strong> ${formatearFechaCompleta(nc.fechaAplicacion)}</p>` : ''}
                </div>
                <div class="col-md-6">
                    <h5>Factura Relacionada</h5>
                    <p class="mb-1"><strong>N° Factura:</strong> ${nc.factura?.numeroFactura || 'N/A'}</p>
                    <p class="mb-1"><strong>Cliente:</strong> ${nc.factura?.cliente?.nombre || 'N/A'}</p>
                    <p class="mb-1"><strong>RUC/CI:</strong> ${nc.factura?.cliente?.rucCi || 'N/A'}</p>
                </div>
            </div>

            ${nc.descripcionMotivo ? `
                <div class="mb-3">
                    <h6>Descripción del Motivo:</h6>
                    <p>${nc.descripcionMotivo}</p>
                </div>
            ` : ''}

            <h5 class="mb-3">Detalles de Devolución</h5>
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th class="text-center">Cant. Devuelta</th>
                        <th class="text-end">Precio Unit.</th>
                        <th class="text-end">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${(nc.detalles || []).map(detalle => `
                        <tr>
                            <td>${detalle.facturaItem?.descripcion || 'N/A'}</td>
                            <td class="text-center">${detalle.cantidadDevuelta}</td>
                            <td class="text-end">${formatearMoneda(detalle.precioUnitario)}</td>
                            <td class="text-end">${formatearMoneda(detalle.subtotal)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="row">
                <div class="col-md-6 ms-auto">
                    <table class="table">
                        <tr>
                            <td class="text-end"><strong>Subtotal:</strong></td>
                            <td class="text-end">${formatearMoneda(nc.subtotal)}</td>
                        </tr>
                        <tr>
                            <td class="text-end"><strong>IVA (10%):</strong></td>
                            <td class="text-end">${formatearMoneda(nc.iva)}</td>
                        </tr>
                        <tr>
                            <td class="text-end"><strong>TOTAL:</strong></td>
                            <td class="text-end"><h4>${formatearMoneda(nc.total)}</h4></td>
                        </tr>
                    </table>
                </div>
            </div>

            ${nc.observaciones ? `
                <div class="mt-3">
                    <h6>Observaciones:</h6>
                    <p>${nc.observaciones}</p>
                </div>
            ` : ''}
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('modalVistaNC'));
    modal.show();
}

async function aplicarNC(idNC) {
    if (!confirm('¿Está seguro de aplicar esta nota de crédito? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await NotaCreditoService.aplicar(idNC);

        if (response.success) {
            mostrarExito('Nota de crédito aplicada exitosamente');
            await cargarNotasCredito();
        } else {
            mostrarError('Error al aplicar nota de crédito: ' + response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al aplicar nota de crédito');
    }
}

async function anularNC(idNC) {
    const motivo = prompt('Ingrese el motivo de la anulación:');

    if (!motivo || motivo.trim() === '') {
        mostrarError('Debe ingresar un motivo para anular');
        return;
    }

    try {
        const response = await NotaCreditoService.anular(idNC, motivo);

        if (response.success) {
            mostrarExito('Nota de crédito anulada exitosamente');
            await cargarNotasCredito();
        } else {
            mostrarError('Error al anular nota de crédito: ' + response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al anular nota de crédito');
    }
}

// Función para abrir modal de crear NC desde facturas.js
window.abrirModalCrearNC = async function(factura) {
    facturaActual = factura;

    // Llenar información de la factura
    document.getElementById('ncFacturaInfo').textContent =
        `N° ${factura.numeroFactura} - ${formatearFecha(factura.fechaEmision)}`;
    document.getElementById('ncClienteInfo').textContent =
        `${factura.cliente.nombre} - ${factura.cliente.rucCi}`;

    // Llenar items
    const container = document.getElementById('ncItemsContainer');
    container.innerHTML = factura.items.map((item, index) => `
        <div class="card mb-2">
            <div class="card-body py-2">
                <div class="row align-items-center">
                    <div class="col-md-1">
                        <input type="checkbox" class="form-check-input nc-item-check"
                               data-index="${index}" onchange="calcularTotalesNC()">
                    </div>
                    <div class="col-md-5">
                        <strong>${item.descripcion}</strong>
                    </div>
                    <div class="col-md-2">
                        <small>Cant. Fact.: ${item.cantidad}</small>
                    </div>
                    <div class="col-md-2">
                        <input type="number" class="form-control form-control-sm nc-item-cantidad"
                               data-index="${index}" min="0" max="${item.cantidad}"
                               value="0" onchange="calcularTotalesNC()">
                    </div>
                    <div class="col-md-2 text-end">
                        <strong>${formatearMoneda(item.subtotal)}</strong>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Reset form
    document.getElementById('formCrearNC').reset();
    document.getElementById('ncTipo').value = 'PARCIAL';
    calcularTotalesNC();

    const modal = new bootstrap.Modal(document.getElementById('modalCrearNC'));
    modal.show();
};

function actualizarItemsSegunTipo() {
    const tipo = document.getElementById('ncTipo').value;
    const checks = document.querySelectorAll('.nc-item-check');
    const cantidades = document.querySelectorAll('.nc-item-cantidad');

    if (tipo === 'TOTAL') {
        checks.forEach((check, index) => {
            check.checked = true;
            check.disabled = true;
            // Convertir la cantidad a entero (Math.floor) para evitar problemas con decimales
            const maxCant = Math.floor(parseFloat(facturaActual.items[index].cantidad));
            cantidades[index].value = maxCant;
            cantidades[index].disabled = true;
        });
    } else {
        checks.forEach((check, index) => {
            check.disabled = false;
            cantidades[index].disabled = false;
        });
    }

    calcularTotalesNC();
}

function calcularTotalesNC() {
    const checks = document.querySelectorAll('.nc-item-check');
    const cantidades = document.querySelectorAll('.nc-item-cantidad');

    let subtotal = 0;

    checks.forEach((check, index) => {
        if (check.checked) {
            const cantidad = parseFloat(cantidades[index].value) || 0;
            const item = facturaActual.items[index];
            const precioUnitario = parseFloat(item.precioUnitario);
            subtotal += cantidad * precioUnitario;
        }
    });

    const iva = subtotal * 0.10;
    const total = subtotal + iva;

    document.getElementById('ncSubtotalCalculado').textContent = formatearMoneda(subtotal);
    document.getElementById('ncIvaCalculado').textContent = formatearMoneda(iva);
    document.getElementById('ncTotalCalculado').textContent = formatearMoneda(total);
}

async function guardarNotaCredito() {
    try {
        const tipo = document.getElementById('ncTipo').value;
        const motivo = document.getElementById('ncMotivo').value;
        const descripcionMotivo = document.getElementById('ncDescripcionMotivo').value;
        const observaciones = document.getElementById('ncObservaciones').value;

        // Validar que hay items seleccionados
        const checks = document.querySelectorAll('.nc-item-check');
        const cantidades = document.querySelectorAll('.nc-item-cantidad');

        const detalles = [];
        let tieneItems = false;

        checks.forEach((check, index) => {
            if (check.checked) {
                const cantidad = parseInt(cantidades[index].value) || 0;
                if (cantidad > 0) {
                    const item = facturaActual.items[index];

                    // Validar que la cantidad no exceda la cantidad facturada
                    if (cantidad > parseFloat(item.cantidad)) {
                        throw new Error(`La cantidad a devolver (${cantidad}) no puede ser mayor que la cantidad facturada (${item.cantidad}) para el item: ${item.descripcion}`);
                    }

                    detalles.push({
                        facturaItem: { idItem: item.idItem },
                        cantidadDevuelta: cantidad,
                        precioUnitario: parseFloat(item.precioUnitario),
                        subtotal: cantidad * parseFloat(item.precioUnitario)
                    });
                    tieneItems = true;
                }
            }
        });

        if (!tieneItems) {
            mostrarError('Debe seleccionar al menos un item con cantidad mayor a 0');
            return;
        }

        const notaCredito = {
            factura: { idFactura: facturaActual.idFactura },
            tipo: tipo,
            motivo: motivo,
            descripcionMotivo: descripcionMotivo,
            observaciones: observaciones,
            detalles: detalles
        };

        const response = await NotaCreditoService.create(notaCredito);

        if (response.success) {
            mostrarExito('Nota de crédito creada exitosamente');
            bootstrap.Modal.getInstance(document.getElementById('modalCrearNC')).hide();
            await cargarNotasCredito();

            // Ver la NC recién creada
            if (response.data && response.data.idNotaCredito) {
                setTimeout(() => verNotaCredito(response.data.idNotaCredito), 500);
            }
        } else {
            mostrarError('Error al crear nota de crédito: ' + response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al crear nota de crédito');
    }
}

// Utilidades
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: 'PYG',
        minimumFractionDigits: 0
    }).format(valor || 0);
}

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PY');
}

function formatearFechaCompleta(fecha) {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return date.toLocaleString('es-PY');
}

function mostrarExito(mensaje) {
    alert(mensaje);
}

function mostrarError(mensaje) {
    alert(mensaje);
}

// Función para cargar factura y abrir modal automáticamente
async function cargarYAbrirModalNC(idFactura) {
    try {
        const response = await FacturaService.getById(idFactura);

        if (response.success && response.data) {
            const factura = response.data;

            // Verificar que la factura no esté anulada
            if (factura.estado === 'ANULADA') {
                mostrarError('No se puede crear una nota de crédito para una factura anulada');
                // Limpiar URL
                window.history.replaceState({}, document.title, window.location.pathname);
                return;
            }

            // Abrir el modal
            window.abrirModalCrearNC(factura);

            // Limpiar URL después de abrir el modal
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            mostrarError('Error al obtener datos de la factura: ' + response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar datos de la factura');
    }
}
