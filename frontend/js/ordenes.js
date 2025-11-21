// Verificar autenticación
AuthService.checkAuth();

// Cargar información del usuario
const user = AuthService.getUser();
document.getElementById('userName').textContent = `${user.nombre} ${user.apellido}`;
document.getElementById('userRole').textContent = user.rol;
document.getElementById('userAvatar').textContent = user.nombre.charAt(0);

// Variables globales
let ordenes = [];
let pedidos = [];
let tecnicos = [];
let ordenEnRevision = null;
let repuestosCatalogo = [];
let repuestoOTSeleccionado = null;
let repuestosOT = [];
const modal = new bootstrap.Modal(document.getElementById('modalOrden'));
const modalRevision = new bootstrap.Modal(document.getElementById('modalRevisionOT'));

// Toggle sidebar
document.getElementById('sidebarToggle')?.addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
});

// Función de logout
function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        AuthService.logout();
    }
}

// Cargar órdenes de trabajo
async function cargarOrdenes() {
    const table = document.getElementById('ordenesTable');

    try {
        const response = await OrdenTrabajoService.getAll();

        if (response.success && response.data) {
            ordenes = response.data;
            renderOrdenes(ordenes);
        } else {
            throw new Error(response.message || 'Error al cargar órdenes de trabajo');
        }
    } catch (error) {
        console.error('Error:', error);
        table.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle"></i> Error al cargar órdenes de trabajo
                </td>
            </tr>
        `;
    }
}

// Renderizar tabla de órdenes
function renderOrdenes(data) {
    const table = document.getElementById('ordenesTable');

    if (data.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i><br>
                    No hay órdenes de trabajo registradas
                </td>
            </tr>
        `;
        return;
    }

    table.innerHTML = data.map(orden => `
        <tr>
            <td><strong>${orden.numeroOt}</strong></td>
            <td>${orden.pedido?.numeroPedido || 'N/A'}</td>
            <td>${orden.pedido?.cliente?.nombre || 'N/A'} ${orden.pedido?.cliente?.apellido || ''}</td>
            <td>${orden.tecnico ? `${orden.tecnico.nombre} ${orden.tecnico.apellido}${orden.tecnico.especialidad ? ' (' + orden.tecnico.especialidad + ')' : ''}` : '<span class="text-muted">Sin asignar</span>'}</td>
            <td>
                <span class="badge-estado badge-${getEstadoClass(orden.estado)}">
                    ${formatEstado(orden.estado)}
                </span>
            </td>
            <td>
                <span class="badge bg-${
                    orden.prioridad === 'ALTA' ? 'danger' :
                    orden.prioridad === 'MEDIA' ? 'warning' : 'secondary'
                }">${orden.prioridad}</span>
            </td>
            <td>${formatDate(orden.fechaCreacion)}</td>
            <td>${orden.fechaInicio ? formatDate(orden.fechaInicio) : '<span class="text-muted">-</span>'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editarOrden(${orden.idOt})"
                        title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                ${orden.tecnico && (orden.estado === 'ASIGNADA' || orden.estado === 'EN_PROCESO') ? `
                <button class="btn btn-sm btn-outline-warning" onclick="reasignarTecnico(${orden.idOt})"
                        title="Reasignar Técnico">
                    <i class="fas fa-user-edit"></i>
                </button>
                ` : ''}
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarOrden(${orden.idOt})"
                        title="Eliminar">
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
document.getElementById('filterTecnico').addEventListener('change', aplicarFiltros);

function aplicarFiltros() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const estado = document.getElementById('filterEstado').value;
    const prioridad = document.getElementById('filterPrioridad').value;
    const tecnico = document.getElementById('filterTecnico').value;

    let filtered = ordenes.filter(orden => {
        const matchSearch = orden.numeroOt.toLowerCase().includes(searchTerm) ||
                          (orden.pedido?.cliente?.nombre || '').toLowerCase().includes(searchTerm);
        const matchEstado = !estado || orden.estado === estado;
        const matchPrioridad = !prioridad || orden.prioridad === prioridad;
        const matchTecnico = !tecnico || (orden.tecnico && orden.tecnico.idTecnico == tecnico);

        return matchSearch && matchEstado && matchPrioridad && matchTecnico;
    });

    renderOrdenes(filtered);
}

// Cargar datos del formulario
async function cargarDatosFormulario() {
    try {
        // Cargar pedidos EN_PROCESO (tienen presupuesto aceptado) o NUEVO con presupuesto aceptado
        const pedidosResponse = await PedidoService.getAll();
        if (pedidosResponse.success && pedidosResponse.data) {
            pedidos = pedidosResponse.data.filter(p =>
                p.estado === 'EN_PROCESO' || p.estado === 'NUEVO'
            );
            const select = document.getElementById('idPedido');
            select.innerHTML = '<option value="">Seleccione un pedido</option>' +
                pedidos.map(p => `<option value="${p.idPedido}">${p.numeroPedido} - ${p.cliente?.nombre || 'Sin cliente'}</option>`).join('');

            // Remover listeners anteriores para evitar duplicados
            const newSelect = select.cloneNode(true);
            select.parentNode.replaceChild(newSelect, select);

            // Agregar event listener para cargar presupuesto cuando se seleccione un pedido
            document.getElementById('idPedido').addEventListener('change', async function() {
                const idPedido = this.value;
                const presupuestoInfo = document.getElementById('presupuestoInfo');
                const idPresupuestoHidden = document.getElementById('idPresupuesto');
                const descripcionTrabajo = document.getElementById('descripcionTrabajo');

                if (idPedido) {
                    try {
                        // Cargar presupuestos aceptados
                        const presupuestosResponse = await PresupuestoService.getPresupuestosAceptadosPorPedido(idPedido);

                        if (presupuestosResponse.success && presupuestosResponse.data && presupuestosResponse.data.length > 0) {
                            // Tomar el primer presupuesto aceptado
                            const presupuesto = presupuestosResponse.data[0];

                            // Validar fecha de vencimiento
                            let estadoVencimiento = '';
                            if (presupuesto.fechaVencimiento) {
                                const fechaVenc = new Date(presupuesto.fechaVencimiento);
                                const hoy = new Date();
                                hoy.setHours(0, 0, 0, 0);
                                fechaVenc.setHours(0, 0, 0, 0);

                                if (fechaVenc < hoy) {
                                    estadoVencimiento = ' - VENCIDO';
                                    alert('ADVERTENCIA: Este presupuesto ha vencido el ' + presupuesto.fechaVencimiento + '. Se recomienda generar uno nuevo.');
                                } else {
                                    const diasRestantes = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
                                    if (diasRestantes <= 3) {
                                        estadoVencimiento = ` - Vence en ${diasRestantes} día(s)`;
                                    }
                                }
                            }

                            presupuestoInfo.value = `${presupuesto.numeroPresupuesto} - Total: ${formatMoney(presupuesto.total)}${estadoVencimiento}`;
                            idPresupuestoHidden.value = presupuesto.idPresupuesto;
                        } else {
                            presupuestoInfo.value = 'No hay presupuestos aceptados para este pedido';
                            idPresupuestoHidden.value = '';
                        }

                        // Cargar datos del pedido para copiar la descripción
                        const pedidoResponse = await PedidoService.getById(idPedido);
                        if (pedidoResponse.success && pedidoResponse.data) {
                            const pedido = pedidoResponse.data;
                            // Copiar la descripción del pedido a descripción del trabajo
                            if (pedido.descripcion) {
                                descripcionTrabajo.value = pedido.descripcion;
                            }

                            // Filtrar técnicos por categoría del pedido
                            const selectTecnico = document.getElementById('idTecnicoAsignado');
                            const categoriaIdPedido = pedido.categoria?.idCategoria;
                            const categoriaNombre = pedido.categoria?.nombre || 'Sin categoría';

                            if (categoriaIdPedido && tecnicos.length > 0) {
                                // Filtrar técnicos que coincidan con la categoría del pedido
                                // Primero intentar por relación categoria, si no, por campo especialidad
                                const tecnicosFiltrados = tecnicos.filter(t => {
                                    // Si tiene categoría asignada, comparar por ID
                                    if (t.categoria && t.categoria.idCategoria) {
                                        return t.categoria.idCategoria === categoriaIdPedido;
                                    }
                                    // Si no tiene categoría pero tiene especialidad, comparar por nombre (case-insensitive)
                                    if (t.especialidad) {
                                        return t.especialidad.toLowerCase().includes(categoriaNombre.toLowerCase()) ||
                                               categoriaNombre.toLowerCase().includes(t.especialidad.toLowerCase());
                                    }
                                    return false;
                                });

                                if (tecnicosFiltrados.length > 0) {
                                    selectTecnico.innerHTML = '<option value="">Sin asignar</option>' +
                                        tecnicosFiltrados.map(t =>
                                            `<option value="${t.idTecnico}">${t.nombre} ${t.apellido}${t.especialidad ? ' - ' + t.especialidad : ''}</option>`
                                        ).join('');
                                } else {
                                    selectTecnico.innerHTML = '<option value="">Sin asignar</option>' +
                                        `<option disabled>No hay técnicos de ${categoriaNombre}</option>`;
                                }
                            } else {
                                // Si el pedido no tiene categoría, mostrar todos los técnicos
                                selectTecnico.innerHTML = '<option value="">Sin asignar</option>' +
                                    tecnicos.map(t =>
                                        `<option value="${t.idTecnico}">${t.nombre} ${t.apellido}${t.especialidad ? ' - ' + t.especialidad : ''}${t.categoria ? ' (' + t.categoria.nombre + ')' : ''}</option>`
                                    ).join('');
                            }
                        }
                    } catch (error) {
                        console.error('Error cargando datos del pedido:', error);
                        presupuestoInfo.value = 'Error al cargar presupuestos';
                        idPresupuestoHidden.value = '';
                    }
                } else {
                    presupuestoInfo.value = '';
                    idPresupuestoHidden.value = '';
                    descripcionTrabajo.value = '';
                }
            });
        }

        // Cargar técnicos desde la tabla tecnicos (no usuarios)
        const tecnicosResponse = await TecnicoService.getAll();
        if (tecnicosResponse.success && tecnicosResponse.data) {
            tecnicos = tecnicosResponse.data.filter(t => t.activo);

            // Llenar select de técnico asignado
            const selectAsignado = document.getElementById('idTecnicoAsignado');
            selectAsignado.innerHTML = '<option value="">Sin asignar</option>' +
                tecnicos.map(t => `<option value="${t.idTecnico}">${t.nombre} ${t.apellido}${t.especialidad ? ' - ' + t.especialidad : ''}</option>`).join('');

            // Llenar filtro de técnico
            const selectFiltro = document.getElementById('filterTecnico');
            selectFiltro.innerHTML = '<option value="">Todos los técnicos</option>' +
                tecnicos.map(t => `<option value="${t.idTecnico}">${t.nombre} ${t.apellido}</option>`).join('');
        }
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// Abrir modal para nueva orden
async function openModalOrden() {
    document.getElementById('modalOrdenTitle').innerHTML =
        '<i class="fas fa-wrench"></i> Nueva Orden de Trabajo';
    document.getElementById('ordenForm').reset();
    document.getElementById('ordenId').value = '';

    // Mostrar campos de pedido y presupuesto (modo creación)
    document.getElementById('divPedido').style.display = 'block';
    document.getElementById('divPresupuesto').style.display = 'block';
    document.getElementById('idPedido').required = true;

    // Limpiar repuestos de OT
    repuestosOT = [];
    renderRepuestosOTTable();

    await cargarDatosFormulario();
    await cargarRepuestosOT();
    modal.show();
}

// Editar orden
async function editarOrden(id) {
    try {
        const response = await OrdenTrabajoService.getById(id);

        if (response.success && response.data) {
            const orden = response.data;

            // Si la orden está esperando revisión, abrir modal de revisión
            if (orden.estado === 'ESPERANDO_REVISION') {
                abrirModalRevision(orden);
                return;
            }

            // Edición normal para otros estados
            document.getElementById('modalOrdenTitle').innerHTML =
                '<i class="fas fa-edit"></i> Editar Orden de Trabajo';

            await cargarDatosFormulario();

            // Ocultar campos de pedido y presupuesto (modo edición)
            document.getElementById('divPedido').style.display = 'none';
            document.getElementById('divPresupuesto').style.display = 'none';
            document.getElementById('idPedido').required = false;

            // Llenar formulario
            document.getElementById('ordenId').value = orden.idOt;
            document.getElementById('idPedido').value = orden.pedido?.idPedido || '';

            // Cargar presupuesto del pedido (aunque esté oculto, mantener el valor)
            if (orden.presupuesto) {
                document.getElementById('presupuestoInfo').value =
                    `${orden.presupuesto.numeroPresupuesto} - Total: ${formatMoney(orden.presupuesto.total)}`;
                document.getElementById('idPresupuesto').value = orden.presupuesto.idPresupuesto;
            }

            document.getElementById('idTecnicoAsignado').value = orden.tecnico?.idTecnico || '';
            document.getElementById('prioridad').value = orden.prioridad;
            document.getElementById('descripcionTrabajo').value = orden.descripcionTrabajo;
            document.getElementById('observaciones').value = orden.observaciones || '';

            // Mostrar información del técnico si existe
            mostrarTrabajoTecnico(orden);

            modal.show();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los datos de la orden de trabajo');
    }
}

// Mostrar trabajo del técnico en el modal de edición
function mostrarTrabajoTecnico(orden) {
    const seccion = document.getElementById('seccionTrabajoTecnico');

    // Verificar si hay información del técnico para mostrar
    const tieneTrabajoTecnico = orden.diagnosticoTecnico || orden.informeFinal ||
                                 orden.horasTrabajadas || orden.costoManoObra;

    if (tieneTrabajoTecnico) {
        // Calcular costo de mano de obra desde servicios del presupuesto
        let costoManoObraCalculado = 0;
        if (orden.presupuesto && orden.presupuesto.items && orden.presupuesto.items.length > 0) {
            costoManoObraCalculado = orden.presupuesto.items
                .filter(item => item.tipoItem === 'SERVICIO')
                .reduce((total, item) => total + (parseFloat(item.subtotal) || 0), 0);
        }

        // Llenar campos
        document.getElementById('viewDiagnostico').value = orden.diagnosticoTecnico || 'No especificado';
        document.getElementById('viewInforme').value = orden.informeFinal || 'No especificado';
        document.getElementById('viewHoras').value = orden.horasTrabajadas ?
            `${orden.horasTrabajadas} horas` : 'No especificado';

        // Mostrar el costo de mano de obra calculado desde servicios o el guardado
        const costoManoObraFinal = costoManoObraCalculado > 0 ? costoManoObraCalculado : (orden.costoManoObra || 0);
        document.getElementById('viewCostoManoObra').value = costoManoObraFinal > 0 ?
            formatMoney(costoManoObraFinal) : 'No especificado';

        document.getElementById('viewPresupuestoFinal').value = orden.presupuestoFinal ?
            formatMoney(orden.presupuestoFinal) : (orden.presupuesto?.total ? formatMoney(orden.presupuesto.total) : 'No especificado');

        // Mostrar repuestos si existen
        if (orden.repuestos && orden.repuestos.length > 0) {
            const tbody = document.getElementById('viewRepuestosTable');
            tbody.innerHTML = orden.repuestos.map(r => `
                <tr>
                    <td>${r.repuesto?.nombre || 'N/A'}</td>
                    <td class="text-center">${r.cantidad}</td>
                    <td class="text-end">${formatMoney(r.precioUnitario)}</td>
                    <td class="text-end">${formatMoney(r.subtotal)}</td>
                </tr>
            `).join('');
            document.getElementById('seccionRepuestos').style.display = 'block';
        } else {
            document.getElementById('seccionRepuestos').style.display = 'none';
        }

        seccion.style.display = 'block';
    } else {
        seccion.style.display = 'none';
    }
}

// Guardar orden
async function guardarOrden() {
    const form = document.getElementById('ordenForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const id = document.getElementById('ordenId').value;

    try {
        let response;

        if (id) {
            // Actualización - enviar todos los campos
            const ordenData = {
                idPedido: parseInt(document.getElementById('idPedido').value),
                idPresupuesto: parseInt(document.getElementById('idPresupuesto').value),
                idTecnicoAsignado: document.getElementById('idTecnicoAsignado').value ?
                                  parseInt(document.getElementById('idTecnicoAsignado').value) : null,
                descripcionTrabajo: document.getElementById('descripcionTrabajo').value,
                observaciones: document.getElementById('observaciones').value
            };
            response = await OrdenTrabajoService.update(id, ordenData);
        } else {
            // Creación - solo enviar IDs
            const ordenData = {
                idPedido: parseInt(document.getElementById('idPedido').value),
                idPresupuesto: parseInt(document.getElementById('idPresupuesto').value),
                idTecnico: document.getElementById('idTecnicoAsignado').value ?
                          parseInt(document.getElementById('idTecnicoAsignado').value) : null
            };
            response = await OrdenTrabajoService.create(ordenData);
        }

        if (response.success) {
            modal.hide();
            await cargarOrdenes();
            alert(id ? 'Orden de trabajo actualizada exitosamente' : 'Orden de trabajo creada exitosamente');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar la orden de trabajo: ' + error.message);
    }
}

// Eliminar orden
async function eliminarOrden(id) {
    if (!confirm('¿Está seguro que desea eliminar esta orden de trabajo?')) {
        return;
    }

    try {
        const response = await OrdenTrabajoService.delete(id);

        if (response.success) {
            await cargarOrdenes();
            alert('Orden de trabajo eliminada exitosamente');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la orden de trabajo: ' + error.message);
    }
}

// Reasignar técnico a una OT
async function reasignarTecnico(idOt) {
    try {
        // Cargar la OT actual
        const response = await OrdenTrabajoService.getById(idOt);
        if (!response.success || !response.data) {
            throw new Error('No se pudo cargar la orden de trabajo');
        }

        const orden = response.data;
        const tecnicoActual = orden.tecnico;
        const categoriaIdPedido = orden.pedido?.categoria?.idCategoria;

        // Cargar técnicos activos
        const tecnicosResponse = await TecnicoService.getAll();
        if (!tecnicosResponse.success) {
            throw new Error('No se pudo cargar la lista de técnicos');
        }

        let tecnicosDisponibles = tecnicosResponse.data.filter(t => t.activo);

        // Si hay categoría, filtrar técnicos por categoría
        if (categoriaIdPedido) {
            tecnicosDisponibles = tecnicosDisponibles.filter(t =>
                !t.categoria || t.categoria.idCategoria === categoriaIdPedido
            );
        }

        // Excluir el técnico actual
        tecnicosDisponibles = tecnicosDisponibles.filter(t => t.idTecnico !== tecnicoActual?.idTecnico);

        if (tecnicosDisponibles.length === 0) {
            alert('No hay otros técnicos disponibles para reasignar');
            return;
        }

        // Crear el HTML del select para el modal de confirmación
        const opcionesTecnicos = tecnicosDisponibles.map(t =>
            `<option value="${t.idTecnico}">${t.nombre} ${t.apellido}${t.especialidad ? ' - ' + t.especialidad : ''}${t.categoria ? ' (' + t.categoria.nombre + ')' : ''}</option>`
        ).join('');

        // Crear un modal temporal para la reasignación
        const modalHtml = `
            <div class="modal fade" id="modalReasignar" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-warning">
                            <h5 class="modal-title"><i class="fas fa-user-edit"></i> Reasignar Técnico</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p><strong>OT:</strong> ${orden.numeroOt}</p>
                            <p><strong>Técnico actual:</strong> ${tecnicoActual ? tecnicoActual.nombre + ' ' + tecnicoActual.apellido : 'Sin asignar'}</p>
                            <div class="mb-3">
                                <label class="form-label">Nuevo técnico *</label>
                                <select class="form-select" id="nuevoTecnicoId" required>
                                    <option value="">Seleccione un técnico</option>
                                    ${opcionesTecnicos}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Motivo de reasignación</label>
                                <textarea class="form-control" id="motivoReasignacion" rows="2" placeholder="Opcional"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-warning" onclick="confirmarReasignacion(${idOt})">
                                <i class="fas fa-check"></i> Confirmar Reasignación
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Eliminar modal anterior si existe
        const modalAnterior = document.getElementById('modalReasignar');
        if (modalAnterior) modalAnterior.remove();

        // Agregar el nuevo modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Mostrar el modal
        const modalReasignar = new bootstrap.Modal(document.getElementById('modalReasignar'));
        modalReasignar.show();

    } catch (error) {
        console.error('Error:', error);
        alert('Error al preparar reasignación: ' + error.message);
    }
}

// Confirmar la reasignación del técnico
async function confirmarReasignacion(idOt) {
    const nuevoTecnicoId = document.getElementById('nuevoTecnicoId').value;
    const motivoReasignacion = document.getElementById('motivoReasignacion').value;

    if (!nuevoTecnicoId) {
        alert('Debe seleccionar un técnico');
        return;
    }

    try {
        // Actualizar la OT con el nuevo técnico
        const response = await OrdenTrabajoService.getById(idOt);
        if (!response.success || !response.data) {
            throw new Error('No se pudo cargar la orden de trabajo');
        }

        const orden = response.data;

        // Preparar datos de actualización
        const updateData = {
            idPedido: orden.pedido?.idPedido,
            idPresupuesto: orden.presupuesto?.idPresupuesto,
            idTecnicoAsignado: parseInt(nuevoTecnicoId),
            prioridad: orden.prioridad,
            descripcionTrabajo: orden.descripcionTrabajo,
            observaciones: (orden.observaciones || '') + (motivoReasignacion ? `\n[Reasignación: ${motivoReasignacion}]` : '')
        };

        const updateResponse = await OrdenTrabajoService.update(idOt, updateData);

        if (updateResponse.success) {
            // Cerrar modal
            const modalElement = document.getElementById('modalReasignar');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();
            modalElement.remove();

            // Recargar órdenes
            await cargarOrdenes();
            alert('Técnico reasignado exitosamente');
        } else {
            throw new Error(updateResponse.message || 'Error al reasignar técnico');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al reasignar técnico: ' + error.message);
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

function getEstadoClass(estado) {
    const classes = {
        'ABIERTA': 'nuevo',
        'ASIGNADA': 'en-proceso',
        'EN_PROCESO': 'en-proceso',
        'ESPERANDO_REVISION': 'pendiente',
        'DEVUELTA_A_TECNICO': 'cancelado',
        'TERMINADA': 'completado',
        'FACTURADA': 'completado',
        'CANCELADA': 'cancelado'
    };
    return classes[estado] || 'nuevo';
}

function formatMoney(amount) {
    return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: 'PYG',
        minimumFractionDigits: 0
    }).format(amount || 0);
}

// ============================================
// FUNCIONES DE REVISIÓN ADMINISTRATIVA
// ============================================

// Abrir modal de revisión
function abrirModalRevision(orden) {
    ordenEnRevision = orden;

    // Información general
    document.getElementById('revisionOtId').value = orden.idOt;
    document.getElementById('revNumeroOT').value = orden.numeroOt;
    document.getElementById('revCliente').value =
        `${orden.pedido?.cliente?.nombre || ''} ${orden.pedido?.cliente?.apellido || ''}`;
    document.getElementById('revTecnico').value =
        `${orden.tecnico?.nombre || ''} ${orden.tecnico?.apellido || ''}`;
    document.getElementById('revPrioridad').value = orden.prioridad;
    document.getElementById('revDescripcion').value = orden.descripcionTrabajo || '';

    // Trabajo del técnico
    document.getElementById('revDiagnostico').value = orden.diagnosticoTecnico || '';
    document.getElementById('revInforme').value = orden.informeFinal || '';
    document.getElementById('revHoras').value = orden.horasTrabajadas ? `${orden.horasTrabajadas} horas` : 'N/A';

    // Calcular costo de mano de obra desde servicios del presupuesto
    let costoManoObraCalculado = 0;
    if (orden.presupuesto && orden.presupuesto.items && orden.presupuesto.items.length > 0) {
        costoManoObraCalculado = orden.presupuesto.items
            .filter(item => item.tipoItem === 'SERVICIO')
            .reduce((total, item) => total + (parseFloat(item.subtotal) || 0), 0);
    }

    // Mostrar el costo de mano de obra calculado desde servicios o el guardado
    const costoManoObraFinal = costoManoObraCalculado > 0 ? costoManoObraCalculado : (orden.costoManoObra || 0);
    document.getElementById('revCostoManoObra').value = costoManoObraFinal > 0 ?
        formatMoney(costoManoObraFinal) : 'N/A';

    // Presupuesto final (editable) - inicializar con presupuesto inicial
    const presupuestoInicial = orden.presupuesto?.total || 0;
    document.getElementById('revPresupuestoFinal').value = presupuestoInicial;

    // Cargar valores existentes si ya fueron editados
    if (orden.presupuestoFinal) {
        document.getElementById('revPresupuestoFinal').value = orden.presupuestoFinal;
    }
    if (orden.justificacionAjuste) {
        document.getElementById('revJustificacionAjuste').value = orden.justificacionAjuste;
    } else {
        document.getElementById('revJustificacionAjuste').value = '';
    }

    document.getElementById('revObservacionesDevolucion').value = '';

    modalRevision.show();
}

// Aprobar y cerrar OT
async function aprobarYCerrar() {
    const presupuestoFinal = parseFloat(document.getElementById('revPresupuestoFinal').value);
    const presupuestoInicial = ordenEnRevision?.presupuesto?.total || 0;
    const justificacion = document.getElementById('revJustificacionAjuste').value.trim();

    // Validar presupuesto final
    if (!presupuestoFinal || presupuestoFinal <= 0) {
        alert('Debe ingresar un presupuesto final válido');
        return;
    }

    // Si hay diferencia, validar que haya justificación
    if (Math.abs(presupuestoFinal - presupuestoInicial) > 0 && !justificacion) {
        if (!confirm('Ha modificado el presupuesto sin agregar justificación. ¿Desea continuar de todos modos?')) {
            return;
        }
    }

    if (!confirm('¿Está seguro que desea aprobar y cerrar esta orden de trabajo? La orden pasará a estado TERMINADA.')) {
        return;
    }

    try {
        const ordenData = {
            estado: 'TERMINADA',
            presupuestoFinal: presupuestoFinal,
            justificacionAjuste: justificacion || null
        };

        const response = await OrdenTrabajoService.update(ordenEnRevision.idOt, ordenData);

        if (response.success) {
            alert('Orden de trabajo aprobada y cerrada exitosamente');
            modalRevision.hide();
            await cargarOrdenes();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al aprobar la orden de trabajo: ' + error.message);
    }
}

// Devolver OT al técnico
async function devolverATecnico() {
    const observaciones = document.getElementById('revObservacionesDevolucion').value.trim();

    if (!observaciones) {
        alert('Debe ingresar observaciones indicando qué debe corregir o completar el técnico');
        return;
    }

    if (!confirm('¿Está seguro que desea devolver esta orden al técnico? El técnico recibirá sus observaciones y deberá corregir el trabajo.')) {
        return;
    }

    try {
        const ordenData = {
            estado: 'DEVUELTA_A_TECNICO',
            observacionesDevolucion: observaciones
        };

        const response = await OrdenTrabajoService.update(ordenEnRevision.idOt, ordenData);

        if (response.success) {
            alert('Orden devuelta al técnico exitosamente');
            modalRevision.hide();
            await cargarOrdenes();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al devolver la orden al técnico: ' + error.message);
    }
}

// ==============================================
// FUNCIONES PARA REPUESTOS EN OT CON VALIDACIÓN DE STOCK
// ==============================================

// Cargar repuestos activos
async function cargarRepuestosOT() {
    try {
        const response = await RepuestoService.getActivos();

        if (response.success && response.data) {
            repuestosCatalogo = response.data;
            const select = document.getElementById('selectRepuestoOT');

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
window.cargarRepuestosOT = cargarRepuestosOT;

// Obtener badge de stock
function getStockBadge(repuesto) {
    if (repuesto.stockActual === 0) {
        return '(SIN STOCK)';
    } else if (repuesto.stockActual <= repuesto.stockMinimo) {
        return `(Stock bajo: ${repuesto.stockActual})`;
    }
    return `(Stock: ${repuesto.stockActual})`;
}

// Cuando se selecciona un repuesto
function seleccionarRepuestoOT() {
    const select = document.getElementById('selectRepuestoOT');
    const repuestoId = parseInt(select.value);

    if (!repuestoId) {
        repuestoOTSeleccionado = null;
        document.getElementById('repuestoOTPrecio').value = '';
        document.getElementById('repuestoOTStock').value = '';
        document.getElementById('repuestoOTInfo').style.display = 'none';
        document.getElementById('repuestoOTAlerta').style.display = 'none';
        return;
    }

    repuestoOTSeleccionado = repuestosCatalogo.find(r => r.idRepuesto === repuestoId);

    if (repuestoOTSeleccionado) {
        document.getElementById('repuestoOTPrecio').value = repuestoOTSeleccionado.precioVenta;
        document.getElementById('repuestoOTStock').value = repuestoOTSeleccionado.stockActual;

        // Mostrar información del repuesto
        document.getElementById('repuestoOTDescripcionText').textContent =
            `${repuestoOTSeleccionado.nombre} - ${repuestoOTSeleccionado.categoria?.nombre || 'Sin categoría'}`;
        document.getElementById('repuestoOTInfo').style.display = 'block';

        // Mostrar alerta si el stock es bajo o no hay stock
        if (repuestoOTSeleccionado.stockActual === 0) {
            document.getElementById('repuestoOTAlertaText').textContent =
                'Este repuesto NO tiene stock disponible. No se puede agregar a la orden.';
            document.getElementById('repuestoOTAlerta').style.display = 'block';
        } else if (repuestoOTSeleccionado.stockActual <= repuestoOTSeleccionado.stockMinimo) {
            document.getElementById('repuestoOTAlertaText').textContent =
                `ADVERTENCIA: Stock bajo. Solo quedan ${repuestoOTSeleccionado.stockActual} unidades disponibles.`;
            document.getElementById('repuestoOTAlerta').style.display = 'block';
        } else {
            document.getElementById('repuestoOTAlerta').style.display = 'none';
        }
    }
}

// Hacer la función global
window.seleccionarRepuestoOT = seleccionarRepuestoOT;

// Agregar repuesto a la OT con validación de stock
function agregarRepuestoOT() {
    if (!repuestoOTSeleccionado) {
        alert('Por favor seleccione un repuesto');
        return;
    }

    const cantidad = parseInt(document.getElementById('repuestoOTCantidad').value) || 0;
    const precioUnitario = parseFloat(document.getElementById('repuestoOTPrecio').value) || 0;

    if (cantidad <= 0) {
        alert('La cantidad debe ser mayor a 0');
        return;
    }

    // VALIDACIÓN DE STOCK EN TIEMPO REAL
    if (repuestoOTSeleccionado.stockActual === 0) {
        alert('ERROR: Este repuesto NO tiene stock disponible. No se puede agregar a la orden.');
        return;
    }

    if (cantidad > repuestoOTSeleccionado.stockActual) {
        alert(`ERROR: Stock insuficiente. Solo hay ${repuestoOTSeleccionado.stockActual} unidades disponibles.`);
        return;
    }

    // Advertencia si se está comprometiendo mucho stock
    if (cantidad > repuestoOTSeleccionado.stockActual * 0.8) {
        if (!confirm(`ADVERTENCIA: Va a comprometer ${cantidad} de ${repuestoOTSeleccionado.stockActual} unidades disponibles (${Math.round(cantidad/repuestoOTSeleccionado.stockActual*100)}%). ¿Desea continuar?`)) {
            return;
        }
    }

    const repuesto = {
        idRepuesto: repuestoOTSeleccionado.idRepuesto,
        descripcion: `${repuestoOTSeleccionado.codigo} - ${repuestoOTSeleccionado.nombre}`,
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        subtotal: cantidad * precioUnitario,
        stockDisponible: repuestoOTSeleccionado.stockActual
    };

    repuestosOT.push(repuesto);

    // Limpiar formulario
    document.getElementById('selectRepuestoOT').value = '';
    document.getElementById('repuestoOTCantidad').value = '1';
    document.getElementById('repuestoOTPrecio').value = '';
    document.getElementById('repuestoOTStock').value = '';
    document.getElementById('repuestoOTInfo').style.display = 'none';
    document.getElementById('repuestoOTAlerta').style.display = 'none';
    repuestoOTSeleccionado = null;

    renderRepuestosOTTable();
}

// Hacer la función global
window.agregarRepuestoOT = agregarRepuestoOT;

// Eliminar repuesto de la OT
function eliminarRepuestoOT(index) {
    if (confirm('¿Desea eliminar este repuesto?')) {
        repuestosOT.splice(index, 1);
        renderRepuestosOTTable();
    }
}

// Hacer la función global
window.eliminarRepuestoOT = eliminarRepuestoOT;

// Renderizar tabla de repuestos de OT
function renderRepuestosOTTable() {
    const tbody = document.getElementById('repuestosOTTableBody');

    if (repuestosOT.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    <small>No hay repuestos agregados</small>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = repuestosOT.map((repuesto, index) => `
        <tr>
            <td>${repuesto.descripcion}</td>
            <td class="text-end">${repuesto.cantidad}</td>
            <td class="text-end">${formatCurrency(repuesto.precioUnitario)}</td>
            <td class="text-end"><strong>${formatCurrency(repuesto.subtotal)}</strong></td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarRepuestoOT(${index})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Formatear moneda
function formatCurrency(amount) {
    if (!amount && amount !== 0) return 'Gs. 0';
    return 'Gs. ' + Number(amount).toLocaleString('es-PY', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    cargarOrdenes();
    cargarDatosFormulario(); // Cargar técnicos para el filtro
    cargarRepuestosOT(); // Cargar repuestos del catálogo
});
