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
let itemsPresupuesto = []; // Items del presupuesto original
let itemsAdicionales = []; // Items adicionales agregados manualmente
let serviciosCatalogo = [];
let servicioSeleccionadoFactura = null;
let repuestosCatalogo = [];
let repuestoSeleccionadoFactura = null;
const modal = new bootstrap.Modal(document.getElementById('modalFactura'));

document.getElementById('sidebarToggle')?.addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
});

function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        AuthService.logout();
    }
}

// Función para sanitizar strings y evitar problemas con JSON
function sanitizeString(str) {
    if (!str) return '';
    // Convertir a string y eliminar caracteres problemáticos
    return String(str)
        .replace(/[\n\r\t]/g, ' ')  // Reemplazar saltos de línea y tabs con espacios
        .replace(/"/g, "'")          // Reemplazar comillas dobles con simples
        .trim();
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
                        title="Exportar PDF A4">
                    <i class="fas fa-file-pdf"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary" onclick="exportarTicket80mm(${factura.idFactura})"
                        title="Imprimir Ticket 80mm">
                    <i class="fas fa-receipt"></i>
                </button>
                ${factura.estado !== 'ANULADA' ? `
                    <button class="btn btn-sm btn-outline-danger" onclick="abrirModalAnular(${factura.idFactura}, '${factura.numeroFactura}')"
                            title="Anular Factura">
                        <i class="fas fa-ban"></i>
                    </button>
                ` : `
                    <span class="badge bg-secondary">ANULADA</span>
                `}
            </td>
        </tr>
    `).join('');
}

// Vista de factura por id
window.verFacturaPorId = async function(id) {
    try {
        const response = await FacturaService.getById(id);
        if (response.success && response.data) {
            const factura = response.data;
            document.getElementById('vistaFacturaBody').innerHTML = renderFacturaHTML(factura);
            const modalVista = new bootstrap.Modal(document.getElementById('modalVistaFactura'));
            modalVista.show();
        } else {
            alert('No se pudo cargar la factura');
        }
    } catch (error) {
        alert('Error al cargar la factura');
    }
}

function renderFacturaHTML(factura) {
    return `
        <div class="mb-3">
            <h4>Factura Nº ${factura.numeroFactura}</h4>
            <p><strong>Cliente:</strong> ${factura.cliente?.nombre || ''} ${factura.cliente?.apellido || ''}</p>
            <p><strong>Fecha de emisión:</strong> ${formatDate(factura.fechaEmision)}</p>
            <p><strong>Estado:</strong> ${formatEstado(factura.estado)}</p>
            <p><strong>Forma de pago:</strong> ${factura.formaPago || 'N/A'}</p>
        </div>
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${(factura.items || []).map(item => `
                    <tr>
                        <td>${item.descripcion}</td>
                        <td>${item.cantidad}</td>
                        <td>${formatMoney(item.precioUnitario)}</td>
                        <td>${formatMoney(item.subtotal)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="text-end">
            <strong>Subtotal:</strong> ${formatMoney(factura.subtotal)}<br>
            <strong>IVA:</strong> ${formatMoney(factura.iva)}<br>
            <strong>Total:</strong> ${formatMoney(factura.total)}
        </div>
        <div class="mt-3 text-end">
            <button class="btn btn-warning" onclick="window.editarFactura(${factura.idFactura})">
                <i class="fas fa-edit"></i> Editar factura
            </button>
        </div>
    `;
}

// Modal de edición de factura
window.editarFactura = async function(id) {
    try {
        const response = await FacturaService.getById(id);
        if (response.success && response.data) {
            const factura = response.data;
            // Renderiza un modal simple para editar estado y forma de pago
            const modalDiv = document.createElement('div');
            modalDiv.className = 'modal fade';
            modalDiv.id = 'modalEditarFactura';
            modalDiv.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Editar Factura</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="formEditarFactura">
                                <div class="mb-3">
                                    <label class="form-label">Estado</label>
                                    <select class="form-select" id="editEstado">
                                        <option value="PENDIENTE" ${factura.estado === 'PENDIENTE' ? 'selected' : ''}>Pendiente</option>
                                        <option value="PAGADA" ${factura.estado === 'PAGADA' ? 'selected' : ''}>Pagada</option>
                                        <option value="VENCIDA" ${factura.estado === 'VENCIDA' ? 'selected' : ''}>Vencida</option>
                                        <option value="ANULADA" ${factura.estado === 'ANULADA' ? 'selected' : ''}>Anulada</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Forma de pago</label>
                                    <select class="form-select" id="editFormaPago">
                                        <option value="EFECTIVO" ${factura.formaPago === 'EFECTIVO' ? 'selected' : ''}>Efectivo</option>
                                        <option value="TARJETA" ${factura.formaPago === 'TARJETA' ? 'selected' : ''}>Tarjeta</option>
                                        <option value="TRANSFERENCIA" ${factura.formaPago === 'TRANSFERENCIA' ? 'selected' : ''}>Transferencia</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="btnGuardarEdicion">Guardar cambios</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modalDiv);
            const modalEditar = new bootstrap.Modal(modalDiv);
            modalEditar.show();
            document.getElementById('btnGuardarEdicion').onclick = async function() {
                const nuevoEstado = document.getElementById('editEstado').value;
                const nuevaFormaPago = document.getElementById('editFormaPago').value;
                // Actualiza la factura
                const update = {
                    ...factura,
                    estado: nuevoEstado,
                    formaPago: nuevaFormaPago
                };
                const res = await FacturaService.update(id, update);
                if (res.success) {
                    alert('Factura actualizada');
                    modalEditar.hide();
                    document.body.removeChild(modalDiv);
                    await cargarFacturas();
                } else {
                    alert('Error al actualizar factura');
                }
            };
            modalDiv.addEventListener('hidden.bs.modal', function () {
                document.body.removeChild(modalDiv);
            });
        }
    } catch (error) {
        alert('Error al cargar factura para editar');
    }
}

// Exportar factura a PDF
window.exportarFacturaPDF = async function(id) {
    try {
        const response = await FacturaService.getById(id);
        if (response.success && response.data) {
            const factura = response.data;
            // Render HTML en un div oculto y con estilos para PDF
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'fixed';
            tempDiv.style.left = '-9999px';
            tempDiv.style.top = '0';
            tempDiv.style.width = '800px';
            tempDiv.style.background = '#fff';
            tempDiv.innerHTML = renderFacturaHTML(factura);
            document.body.appendChild(tempDiv);
            if (window.jsPDF) {
                const doc = new window.jsPDF({ unit: 'px', format: 'a4' });
                await doc.html(tempDiv, {
                    callback: function (doc) {
                        doc.save('factura.pdf');
                        document.body.removeChild(tempDiv);
                    },
                    x: 10,
                    y: 10,
                    html2canvas: { scale: 1.2 }
                });
            } else {
                // Solo imprime el div de la factura
                const printWindow = window.open('', '', 'width=800,height=600');
                printWindow.document.write('<html><head><title>Factura</title>');
                printWindow.document.write('<link rel="stylesheet" href="/css/bootstrap.min.css">');
                printWindow.document.write('</head><body >');
                printWindow.document.write(tempDiv.innerHTML);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
                document.body.removeChild(tempDiv);
            }
        } else {
            alert('No se pudo cargar la factura para exportar');
        }
    } catch (error) {
        alert('Error al exportar la factura');
    }
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

    // Cargar OTs terminadas y timbrados
    await Promise.all([
        cargarOrdenesTerminadas(),
        cargarTimbrados()
    ]);

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

// Cargar timbrado activo vigente para el selector
async function cargarTimbrados() {
    const selectTimbrado = document.getElementById('timbrado');
    const selectEditTimbrado = document.getElementById('editTimbrado');

    try {
        // Obtener solo timbrados activos (debería haber solo uno)
        const response = await TimbradoService.getActivos();

        if (response.success && response.data) {
            const timbrados = response.data;

            // Filtrar solo los que están vigentes (por si acaso)
            const timbradosVigentes = timbrados.filter(t => {
                const hoy = new Date();
                const inicio = new Date(t.fechaInicio);
                const fin = new Date(t.fechaVencimiento);
                return inicio <= hoy && fin >= hoy;
            });

            if (timbradosVigentes.length > 0) {
                const t = timbradosVigentes[0]; // Solo debería haber uno
                const fechaVenc = new Date(t.fechaVencimiento);
                const diasRestantes = Math.ceil((fechaVenc - new Date()) / (1000 * 60 * 60 * 24));
                let info = `Vence: ${fechaVenc.toLocaleDateString()}`;
                if (diasRestantes <= 30) {
                    info += ` (${diasRestantes} días)`;
                }

                const optionHTML = `<option value="${t.idTimbrado}" data-numero="${t.numero}" data-vencimiento="${t.fechaVencimiento}" selected>${t.numero} - ${info}</option>`;

                if (selectTimbrado) {
                    selectTimbrado.innerHTML = optionHTML;
                    // Mostrar info del timbrado automáticamente
                    document.getElementById('infoTimbrado').textContent =
                        `Timbrado: ${t.numero} | Vence: ${fechaVenc.toLocaleDateString()}`;
                }

                if (selectEditTimbrado) {
                    selectEditTimbrado.innerHTML = optionHTML;
                    document.getElementById('editInfoTimbrado').textContent =
                        `Timbrado: ${t.numero} | Vence: ${fechaVenc.toLocaleDateString()}`;
                }
            } else {
                // No hay timbrados vigentes
                const noTimbradoHTML = '<option value="">No hay timbrado activo</option>';
                if (selectTimbrado) selectTimbrado.innerHTML = noTimbradoHTML;
                if (selectEditTimbrado) selectEditTimbrado.innerHTML = noTimbradoHTML;

                Swal.fire({
                    icon: 'warning',
                    title: 'Sin timbrado activo',
                    text: 'No hay un timbrado activo vigente. Debe activar uno antes de generar facturas.',
                    confirmButtonText: 'Entendido'
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar timbrados:', error);
        Swal.fire('Error', 'No se pudo cargar el timbrado activo', 'error');
    }
}

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
    document.getElementById('detDocumento').textContent = datosFacturacion.cliente.rucCi || 'N/A';
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

    // Items del Presupuesto - GUARDAR EN VARIABLE GLOBAL
    itemsPresupuesto = datosFacturacion.itemsPresupuesto || [];

    const tbodyPresupuesto = document.getElementById('detItemsPresupuesto');
    if (itemsPresupuesto.length > 0) {
        tbodyPresupuesto.innerHTML = itemsPresupuesto.map(item => `
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
        tipoItem: 'OTRO', // Item manual
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
                <td colspan="6" class="text-center text-muted">No hay items adicionales agregados</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = itemsAdicionales.map((item, index) => `
        <tr>
            <td>${getTipoItemBadge(item.tipoItem)}</td>
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

    // CALCULAR TOTALES DIRECTAMENTE DESDE LOS ITEMS (no leer del DOM)
    let subtotal = 0;

    // Sumar items del presupuesto
    itemsPresupuesto.forEach(item => {
        subtotal += parseFloat(item.subtotal) || 0;
    });

    // Sumar items adicionales
    itemsAdicionales.forEach(item => {
        subtotal += parseFloat(item.subtotal) || 0;
    });

    // Calcular IVA (10%) y total
    const iva = subtotal * 0.10;
    const total = subtotal + iva;

    // Combinar TODOS los items: presupuesto + adicionales
    // Convertir items del presupuesto al formato de FacturaItem
    const todosLosItems = [];

    // Agregar items del presupuesto
    itemsPresupuesto.forEach(item => {
        const facturaItem = {
            tipoItem: item.tipoItem || 'SERVICIO',
            descripcion: sanitizeString(item.descripcion),
            cantidad: parseFloat(item.cantidad) || 1,
            precioUnitario: parseFloat(item.precioUnitario) || 0,
            subtotal: parseFloat(item.subtotal) || 0
        };

        // Agregar referencias según el tipo
        if (item.tipoItem === 'SERVICIO' && item.idServicio) {
            facturaItem.servicio = { idServicio: item.idServicio };
        } else if (item.tipoItem === 'REPUESTO' && item.idRepuesto) {
            facturaItem.repuesto = { idRepuesto: item.idRepuesto };
        }

        todosLosItems.push(facturaItem);
    });

    // Agregar items adicionales
    itemsAdicionales.forEach(item => {
        const facturaItem = {
            tipoItem: item.tipoItem || 'OTRO',
            descripcion: sanitizeString(item.descripcion),
            cantidad: parseFloat(item.cantidad) || 1,
            precioUnitario: parseFloat(item.precioUnitario) || 0,
            subtotal: parseFloat(item.subtotal) || 0
        };

        // Agregar referencias según el tipo
        if (item.tipoItem === 'SERVICIO' && item.idServicio) {
            facturaItem.servicio = { idServicio: item.idServicio };
        } else if (item.tipoItem === 'REPUESTO' && item.idRepuesto) {
            facturaItem.repuesto = { idRepuesto: item.idRepuesto };
        }

        todosLosItems.push(facturaItem);
    });

    const timbradoSelect = document.getElementById('timbrado');
    const timbradoId = timbradoSelect.value ? parseInt(timbradoSelect.value) : null;
    const timbradoNumero = timbradoSelect.selectedOptions[0]?.dataset.numero || null;

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
        timbrado: timbradoNumero,
        timbradoObj: timbradoId ? { idTimbrado: timbradoId } : null,
        fechaVencimiento: document.getElementById('fechaVencimiento').value || null,
        observaciones: sanitizeString(document.getElementById('observaciones').value) || null,
        items: todosLosItems  // ← CAMBIADO: Ahora se envían TODOS los items
    };

    // Validar que el JSON se puede serializar antes de enviar
    try {
        JSON.stringify(facturaData);
    } catch (jsonError) {
        console.error('Error al serializar facturaData:', jsonError);
        console.error('Datos problemáticos:', facturaData);
        alert('Error: Los datos de la factura contienen caracteres inválidos. Por favor revise los campos de texto.');
        return;
    }

    // LOG: Ver qué se está enviando al backend
    console.log('=== DATOS DE FACTURA A ENVIAR ===');
    console.log('Items del presupuesto:', itemsPresupuesto.length);
    console.log('Items adicionales:', itemsAdicionales.length);
    console.log('Total items a enviar:', todosLosItems.length);
    console.log('Items:', todosLosItems);
    console.log('Subtotal:', facturaData.subtotal);
    console.log('IVA:', facturaData.iva);
    console.log('Total:', facturaData.total);
    console.log('FacturaData completo:', facturaData);

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

// Eliminar función antigua que bloquea la edición. La edición ahora se realiza con window.editarFactura (modal).

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
            facturaActual = factura;  // Guardar para uso en edición

            // Cargar datos en el modal
            document.getElementById('verNumeroFactura').textContent = factura.numeroFactura;
            document.getElementById('verFechaEmision').textContent = formatDate(factura.fechaEmision);
            document.getElementById('verCliente').textContent = `${factura.cliente?.nombre || 'N/A'} ${factura.cliente?.apellido || ''}`;
            document.getElementById('verDocumento').textContent = factura.cliente?.rucCi || 'N/A';
            document.getElementById('verDireccionCliente').textContent = factura.cliente?.direccion || 'N/A';
            document.getElementById('verTelefonoCliente').textContent = factura.cliente?.telefono || 'N/A';
            document.getElementById('verEstado').textContent = formatEstado(factura.estado);
            document.getElementById('verFormaPago').textContent = factura.formaPago || 'N/A';

            // Mostrar información del timbrado
            if (factura.timbradoObj) {
                const timbradoInfo = `${factura.timbradoObj.numero} (${factura.timbradoObj.establecimiento}-${factura.timbradoObj.puntoExpedicion})`;
                document.getElementById('verTimbrado').textContent = timbradoInfo;
                document.getElementById('verFechaVencimiento').textContent = formatDate(factura.timbradoObj.fechaVencimiento);
            } else {
                // Fallback al campo string antiguo
                document.getElementById('verTimbrado').textContent = factura.timbrado || 'N/A';
                document.getElementById('verFechaVencimiento').textContent = factura.fechaVencimiento ? formatDate(factura.fechaVencimiento) : 'N/A';
            }

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
                                    <p><strong>Timbrado:</strong> ${factura.timbradoObj ? `${factura.timbradoObj.numero} (${factura.timbradoObj.establecimiento}-${factura.timbradoObj.puntoExpedicion})` : (factura.timbrado || 'N/A')}</p>
                                    <p><strong>Válido hasta:</strong> ${factura.timbradoObj ? formatDate(factura.timbradoObj.fechaVencimiento) : (factura.fechaVencimiento ? formatDate(factura.fechaVencimiento) : 'N/A')}</p>
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

// Exportar factura en formato ticket 80mm
async function exportarTicket80mm(id) {
    try {
        const response = await FacturaService.getById(id);

        if (response.success && response.data) {
            const factura = response.data;

            // Crear ventana de impresión para ticket de 80mm
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Ticket ${factura.numeroFactura}</title>
                    <style>
                        /* Configuración para papel de 80mm (aprox 302px a 96dpi) */
                        @page {
                            size: 80mm auto;
                            margin: 0;
                        }

                        @media print {
                            .no-print { display: none; }
                            body { margin: 0; }
                        }

                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }

                        body {
                            font-family: 'Courier New', monospace;
                            font-size: 10px;
                            line-height: 1.3;
                            width: 80mm;
                            padding: 5mm;
                            background: white;
                        }

                        .ticket-header {
                            text-align: center;
                            border-bottom: 1px dashed #000;
                            padding-bottom: 5px;
                            margin-bottom: 8px;
                        }

                        .ticket-header h2 {
                            font-size: 14px;
                            font-weight: bold;
                            margin-bottom: 3px;
                        }

                        .ticket-header p {
                            font-size: 9px;
                            margin: 1px 0;
                        }

                        .factura-info {
                            margin-bottom: 8px;
                            padding-bottom: 5px;
                            border-bottom: 1px dashed #000;
                        }

                        .factura-info p {
                            margin: 2px 0;
                            font-size: 9px;
                        }

                        .cliente-info {
                            margin-bottom: 8px;
                            padding-bottom: 5px;
                            border-bottom: 1px dashed #000;
                        }

                        .cliente-info p {
                            margin: 2px 0;
                            font-size: 9px;
                        }

                        .items {
                            margin-bottom: 8px;
                        }

                        .item {
                            margin-bottom: 5px;
                            font-size: 9px;
                        }

                        .item-desc {
                            font-weight: bold;
                        }

                        .item-details {
                            display: flex;
                            justify-content: space-between;
                            margin-top: 2px;
                        }

                        .totales {
                            border-top: 1px dashed #000;
                            padding-top: 5px;
                            margin-top: 8px;
                        }

                        .total-line {
                            display: flex;
                            justify-content: space-between;
                            margin: 3px 0;
                            font-size: 9px;
                        }

                        .total-line.final {
                            font-size: 11px;
                            font-weight: bold;
                            margin-top: 5px;
                            padding-top: 5px;
                            border-top: 1px solid #000;
                        }

                        .footer {
                            text-align: center;
                            margin-top: 10px;
                            padding-top: 5px;
                            border-top: 1px dashed #000;
                            font-size: 8px;
                        }

                        .footer p {
                            margin: 2px 0;
                        }

                        .no-print {
                            text-align: center;
                            margin-top: 15px;
                        }

                        .no-print button {
                            padding: 8px 15px;
                            margin: 0 5px;
                            cursor: pointer;
                            font-size: 11px;
                        }

                        .text-right {
                            text-align: right;
                        }

                        .bold {
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    <div class="ticket-header">
                        <h2>MULTISERVICIOS</h2>
                        <p>RUC: XXXXXXXXX-X</p>
                        <p>Dirección comercial</p>
                        <p>Tel: XXX-XXXX</p>
                    </div>

                    <div class="factura-info">
                        <p class="bold">FACTURA N°: ${factura.numeroFactura}</p>
                        <p>Fecha: ${formatDate(factura.fechaEmision)}</p>
                        <p>Timbrado: ${factura.timbradoObj ? `${factura.timbradoObj.numero}` : (factura.timbrado || 'N/A')}</p>
                        <p>Válido hasta: ${factura.timbradoObj ? formatDate(factura.timbradoObj.fechaVencimiento) : (factura.fechaVencimiento ? formatDate(factura.fechaVencimiento) : 'N/A')}</p>
                        ${factura.timbradoObj ? `<p>Punto: ${factura.timbradoObj.establecimiento}-${factura.timbradoObj.puntoExpedicion}</p>` : ''}
                    </div>

                    <div class="cliente-info">
                        <p class="bold">CLIENTE</p>
                        <p>${factura.cliente?.nombre || 'N/A'} ${factura.cliente?.apellido || ''}</p>
                        <p>Doc: ${factura.cliente?.rucCi || factura.cliente?.documento || 'N/A'}</p>
                        ${factura.cliente?.telefono ? `<p>Tel: ${factura.cliente.telefono}</p>` : ''}
                    </div>

                    <div class="items">
                        <p class="bold" style="border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 5px;">ITEMS</p>
                        ${factura.items && factura.items.length > 0 ? factura.items.map(item => `
                            <div class="item">
                                <div class="item-desc">${item.descripcion}</div>
                                <div class="item-details">
                                    <span>${formatNumber(item.cantidad)} x ${formatMoney(item.precioUnitario)}</span>
                                    <span class="bold">${formatMoney(item.subtotal)}</span>
                                </div>
                            </div>
                        `).join('') : '<p style="text-align: center;">No hay items</p>'}
                    </div>

                    <div class="totales">
                        <div class="total-line">
                            <span>Subtotal:</span>
                            <span>${formatMoney(factura.subtotal)}</span>
                        </div>
                        ${factura.descuento && factura.descuento > 0 ? `
                        <div class="total-line">
                            <span>Descuento:</span>
                            <span>-${formatMoney(factura.descuento)}</span>
                        </div>
                        ` : ''}
                        <div class="total-line">
                            <span>IVA (10%):</span>
                            <span>${formatMoney(factura.iva)}</span>
                        </div>
                        <div class="total-line final">
                            <span>TOTAL:</span>
                            <span>${formatMoney(factura.total)}</span>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Forma de Pago: ${factura.formaPago || 'N/A'}</p>
                        <p>Estado: ${formatEstado(factura.estado)}</p>
                        ${factura.observaciones ? `<p>Obs: ${factura.observaciones}</p>` : ''}
                        <p style="margin-top: 8px;">¡Gracias por su preferencia!</p>
                    </div>

                    <div class="no-print">
                        <button onclick="window.print()">🖨️ Imprimir</button>
                        <button onclick="window.close()">✖ Cerrar</button>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    } catch (error) {
        console.error('Error exportando ticket:', error);
        alert('Error al exportar el ticket');
    }
}

// =====================================================
// FUNCIONES PARA SELECTOR DE SERVICIOS Y REPUESTOS
// =====================================================

// Cargar servicios del catálogo
async function cargarServiciosFactura() {
    try {
        const response = await ServicioCatalogoService.getActivos();
        if (response.success && response.data) {
            serviciosCatalogo = response.data;
            console.log('Servicios cargados:', serviciosCatalogo.length);
            console.log('Detalles de servicios:', serviciosCatalogo.map(s => `${s.codigo} - ${s.nombre}: ${s.precioBase}`));

            const select = document.getElementById('selectServicioFactura');
            select.innerHTML = '<option value="">Seleccione un servicio...</option>' +
                serviciosCatalogo.map(servicio => `
                    <option value="${servicio.idServicio}">
                        ${servicio.nombre} - ${formatCurrency(servicio.precioBase)}
                    </option>
                `).join('');
        }
    } catch (error) {
        console.error('Error al cargar servicios:', error);
    }
}

// Cargar repuestos del catálogo
async function cargarRepuestosFactura() {
    try {
        const response = await RepuestoService.getActivos();
        if (response.success && response.data) {
            repuestosCatalogo = response.data;
            console.log('Repuestos cargados en facturas:', repuestosCatalogo.length);
            console.log('Detalles de repuestos:', repuestosCatalogo.map(r => `${r.codigo} - ${r.nombre}: Stock=${r.stockActual}, Precio=${r.precioVenta}`));

            const select = document.getElementById('selectRepuestoFactura');
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

// Obtener badge de stock
function getStockBadge(repuesto) {
    if (repuesto.stockActual === 0) {
        return '(SIN STOCK)';
    } else if (repuesto.stockActual <= repuesto.stockMinimo) {
        return `(Stock bajo: ${repuesto.stockActual})`;
    }
    return `(Stock: ${repuesto.stockActual})`;
}

// Seleccionar servicio
function seleccionarServicioFactura() {
    const select = document.getElementById('selectServicioFactura');
    const servicioId = parseInt(select.value);

    if (!servicioId) {
        servicioSeleccionadoFactura = null;
        document.getElementById('servicioPrecioFactura').value = '';
        document.getElementById('servicioInfoFactura').style.display = 'none';
        return;
    }

    servicioSeleccionadoFactura = serviciosCatalogo.find(s => s.idServicio === servicioId);

    if (servicioSeleccionadoFactura) {
        document.getElementById('servicioPrecioFactura').value = servicioSeleccionadoFactura.precioBase;
        document.getElementById('servicioDescripcionTextFactura').textContent =
            `${servicioSeleccionadoFactura.nombre} - ${servicioSeleccionadoFactura.categoria?.nombre || 'Sin categoría'}`;
        document.getElementById('servicioInfoFactura').style.display = 'block';
    }
}

// Agregar servicio
function agregarServicioFactura() {
    if (!servicioSeleccionadoFactura) {
        alert('Por favor seleccione un servicio');
        return;
    }

    const cantidad = parseFloat(document.getElementById('servicioCantidadFactura').value) || 0;
    const precioUnitario = parseFloat(document.getElementById('servicioPrecioFactura').value) || 0;

    if (cantidad <= 0) {
        alert('La cantidad debe ser mayor a 0');
        return;
    }

    const item = {
        tipoItem: 'SERVICIO',
        idServicio: servicioSeleccionadoFactura.idServicio,
        descripcion: servicioSeleccionadoFactura.nombre,
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        subtotal: cantidad * precioUnitario
    };

    itemsAdicionales.push(item);

    // Limpiar formulario
    document.getElementById('selectServicioFactura').value = '';
    document.getElementById('servicioCantidadFactura').value = '1';
    document.getElementById('servicioPrecioFactura').value = '';
    document.getElementById('servicioInfoFactura').style.display = 'none';
    servicioSeleccionadoFactura = null;

    renderItemsAdicionales();
    calcularTotales();
}

// Seleccionar repuesto
function seleccionarRepuestoFactura() {
    const select = document.getElementById('selectRepuestoFactura');
    const repuestoId = parseInt(select.value);

    if (!repuestoId) {
        repuestoSeleccionadoFactura = null;
        document.getElementById('repuestoPrecioFactura').value = '';
        document.getElementById('repuestoStockFactura').value = '';
        document.getElementById('repuestoInfoFactura').style.display = 'none';
        document.getElementById('repuestoAlertaFactura').style.display = 'none';
        return;
    }

    repuestoSeleccionadoFactura = repuestosCatalogo.find(r => r.idRepuesto === repuestoId);

    if (repuestoSeleccionadoFactura) {
        document.getElementById('repuestoPrecioFactura').value = repuestoSeleccionadoFactura.precioVenta;
        document.getElementById('repuestoStockFactura').value = repuestoSeleccionadoFactura.stockActual;

        document.getElementById('repuestoDescripcionTextFactura').textContent =
            `${repuestoSeleccionadoFactura.nombre} - ${repuestoSeleccionadoFactura.categoria?.nombre || 'Sin categoría'}`;
        document.getElementById('repuestoInfoFactura').style.display = 'block';

        // Alertas de stock
        if (repuestoSeleccionadoFactura.stockActual === 0) {
            document.getElementById('repuestoAlertaTextFactura').textContent =
                'Este repuesto NO tiene stock disponible. No se puede agregar a la factura.';
            document.getElementById('repuestoAlertaFactura').style.display = 'block';
        } else if (repuestoSeleccionadoFactura.stockActual <= repuestoSeleccionadoFactura.stockMinimo) {
            document.getElementById('repuestoAlertaTextFactura').textContent =
                `ADVERTENCIA: Stock bajo. Solo quedan ${repuestoSeleccionadoFactura.stockActual} unidades disponibles.`;
            document.getElementById('repuestoAlertaFactura').style.display = 'block';
        } else {
            document.getElementById('repuestoAlertaFactura').style.display = 'none';
        }
    }
}

// Agregar repuesto
function agregarRepuestoFactura() {
    if (!repuestoSeleccionadoFactura) {
        alert('Por favor seleccione un repuesto');
        return;
    }

    const cantidad = parseInt(document.getElementById('repuestoCantidadFactura').value) || 0;
    const precioUnitario = parseFloat(document.getElementById('repuestoPrecioFactura').value) || 0;

    if (cantidad <= 0) {
        alert('La cantidad debe ser mayor a 0');
        return;
    }

    // VALIDACIÓN DE STOCK EN TIEMPO REAL
    if (repuestoSeleccionadoFactura.stockActual === 0) {
        alert('ERROR: Este repuesto NO tiene stock disponible. No se puede agregar a la factura.');
        return;
    }

    if (cantidad > repuestoSeleccionadoFactura.stockActual) {
        alert(`ERROR: Stock insuficiente. Solo hay ${repuestoSeleccionadoFactura.stockActual} unidades disponibles.`);
        return;
    }

    // Advertencia si se está comprometiendo mucho stock
    if (cantidad > repuestoSeleccionadoFactura.stockActual * 0.8) {
        if (!confirm(`ADVERTENCIA: Va a comprometer ${cantidad} de ${repuestoSeleccionadoFactura.stockActual} unidades disponibles (${Math.round(cantidad/repuestoSeleccionadoFactura.stockActual*100)}%). ¿Desea continuar?`)) {
            return;
        }
    }

    const item = {
        tipoItem: 'REPUESTO',
        idRepuesto: repuestoSeleccionadoFactura.idRepuesto,
        descripcion: `${repuestoSeleccionadoFactura.codigo} - ${repuestoSeleccionadoFactura.nombre}`,
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        subtotal: cantidad * precioUnitario,
        stockDisponible: repuestoSeleccionadoFactura.stockActual
    };

    itemsAdicionales.push(item);

    // Limpiar formulario
    document.getElementById('selectRepuestoFactura').value = '';
    document.getElementById('repuestoCantidadFactura').value = '1';
    document.getElementById('repuestoPrecioFactura').value = '';
    document.getElementById('repuestoStockFactura').value = '';
    document.getElementById('repuestoInfoFactura').style.display = 'none';
    document.getElementById('repuestoAlertaFactura').style.display = 'none';
    repuestoSeleccionadoFactura = null;

    renderItemsAdicionales();
    calcularTotales();
}

// Formatear moneda
function formatCurrency(amount) {
    if (!amount && amount !== 0) return 'Gs. 0';
    return 'Gs. ' + Number(amount).toLocaleString('es-PY', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Obtener badge de tipo de item
function getTipoItemBadge(tipoItem) {
    const badges = {
        'SERVICIO': '<span class="badge bg-primary"><i class="fas fa-concierge-bell"></i> Servicio</span>',
        'REPUESTO': '<span class="badge bg-info"><i class="fas fa-cog"></i> Repuesto</span>',
        'DIAGNOSTICO': '<span class="badge bg-warning"><i class="fas fa-stethoscope"></i> Diagnóstico</span>',
        'OTRO': '<span class="badge bg-secondary"><i class="fas fa-keyboard"></i> Manual</span>'
    };
    return badges[tipoItem] || '<span class="badge bg-secondary">Manual</span>';
}

// ========================================
// EDICIÓN Y ANULACIÓN DE FACTURAS
// ========================================

let modalEditarFactura;
let modalAnularFactura;
let facturaActual = null;

// Abrir modal de edición desde el modal de detalles
async function abrirModalEditar() {
    if (!facturaActual) return;

    // Cargar timbrados primero
    await cargarTimbrados();

    document.getElementById('editIdFactura').value = facturaActual.idFactura;
    document.getElementById('editNumeroFactura').value = facturaActual.numeroFactura;
    document.getElementById('editFormaPago').value = facturaActual.formaPago || '';
    document.getElementById('editEstado').value = facturaActual.estado || '';

    // Setear el timbrado por ID si existe la relación
    if (facturaActual.timbradoObj && facturaActual.timbradoObj.idTimbrado) {
        document.getElementById('editTimbrado').value = facturaActual.timbradoObj.idTimbrado;
        // Trigger del evento change para mostrar info
        document.getElementById('editTimbrado').dispatchEvent(new Event('change'));
    }

    document.getElementById('editFechaVencimiento').value = facturaActual.fechaVencimiento || '';
    document.getElementById('editObservaciones').value = facturaActual.observaciones || '';

    modalDetallesFactura.hide();
    modalEditarFactura.show();
}

// Guardar edición de factura
async function guardarEdicionFactura() {
    const id = document.getElementById('editIdFactura').value;
    const formaPago = document.getElementById('editFormaPago').value;
    const estado = document.getElementById('editEstado').value;
    const timbradoSelect = document.getElementById('editTimbrado');
    const timbradoId = timbradoSelect.value ? parseInt(timbradoSelect.value) : null;
    const timbradoNumero = timbradoSelect.selectedOptions[0]?.dataset.numero || null;
    const fechaVencimiento = document.getElementById('editFechaVencimiento').value;
    const observaciones = document.getElementById('editObservaciones').value;

    if (!formaPago || !estado) {
        alert('Por favor complete los campos requeridos');
        return;
    }

    try {
        const facturaData = {
            formaPago: formaPago,
            estado: estado,
            timbrado: timbradoNumero,
            timbradoObj: timbradoId ? { idTimbrado: timbradoId } : null,
            fechaVencimiento: fechaVencimiento || null,
            observaciones: observaciones || null
        };

        const response = await FacturaService.update(id, facturaData);

        if (response.success) {
            modalEditarFactura.hide();
            await cargarFacturas();
            alert('Factura actualizada exitosamente');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar la factura: ' + error.message);
    }
}

// Abrir modal de anulación
function abrirModalAnular(id, numeroFactura) {
    document.getElementById('anularIdFactura').value = id;
    document.getElementById('anularNumeroFactura').value = numeroFactura;
    document.getElementById('anularMotivo').value = '';
    document.getElementById('anularDetalleTexto').value = '';
    document.getElementById('anularDetalleMotivo').style.display = 'none';

    modalAnularFactura.show();
}

// Confirmar anulación de factura
async function confirmarAnularFactura() {
    const id = document.getElementById('anularIdFactura').value;
    const motivo = document.getElementById('anularMotivo').value;
    const detalleTexto = document.getElementById('anularDetalleTexto').value;

    if (!motivo) {
        alert('Por favor seleccione un motivo de anulación');
        return;
    }

    if (motivo === 'OTRO' && !detalleTexto.trim()) {
        alert('Por favor describa el motivo de anulación');
        return;
    }

    const motivoCompleto = motivo === 'OTRO' ? detalleTexto : formatMotivoAnulacion(motivo);

    if (!confirm(`¿Está seguro que desea ANULAR esta factura?\n\nMotivo: ${motivoCompleto}\n\nEsta acción anulará la factura y devolverá el stock de los repuestos facturados.\n\nEsta acción NO se puede deshacer.`)) {
        return;
    }

    try {
        // Usar el nuevo endpoint de anulación que devuelve stock
        const response = await FacturaService.anular(id);

        if (response.success) {
            modalAnularFactura.hide();
            await cargarFacturas();
            alert('Factura anulada exitosamente. Se ha devuelto el stock de los repuestos.');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al anular la factura: ' + error.message);
    }
}

// Formatear motivo de anulación
function formatMotivoAnulacion(motivo) {
    const motivos = {
        'ERROR_FACTURACION': 'Error en la facturación',
        'CANCELACION_CLIENTE': 'Cancelación por parte del cliente',
        'DUPLICADO': 'Factura duplicada',
        'DEVOLUCION': 'Devolución de productos/servicios'
    };
    return motivos[motivo] || motivo;
}

document.addEventListener('DOMContentLoaded', function() {
    cargarFacturas();
    cargarFiltroClientes();
    cargarServiciosFactura();
    cargarRepuestosFactura();

    // Inicializar modales
    const modalDetallesElement = document.getElementById('modalDetallesFactura');
    if (modalDetallesElement) {
        modalDetallesFactura = new bootstrap.Modal(modalDetallesElement);
    }

    const modalEditarElement = document.getElementById('modalEditarFactura');
    if (modalEditarElement) {
        modalEditarFactura = new bootstrap.Modal(modalEditarElement);
    }

    const modalAnularElement = document.getElementById('modalAnularFactura');
    if (modalAnularElement) {
        modalAnularFactura = new bootstrap.Modal(modalAnularElement);
    }

    // Event listener para botón editar en modal de detalles
    const btnEditarFactura = document.getElementById('btnEditarFactura');
    if (btnEditarFactura) {
        btnEditarFactura.addEventListener('click', abrirModalEditar);
    }

    // Event listener para mostrar/ocultar detalle de motivo
    const selectMotivo = document.getElementById('anularMotivo');
    if (selectMotivo) {
        selectMotivo.addEventListener('change', function() {
            const detalleDiv = document.getElementById('anularDetalleMotivo');
            if (this.value === 'OTRO') {
                detalleDiv.style.display = 'block';
            } else {
                detalleDiv.style.display = 'none';
            }
        });
    }
});
