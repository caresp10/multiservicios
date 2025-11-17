// Verificar autenticación
AuthService.checkAuth();

// Cargar información del usuario
const user = AuthService.getUser();
document.getElementById('userName').textContent = `${user.nombre} ${user.apellido}`;
document.getElementById('userRole').textContent = user.rol;
document.getElementById('userAvatar').textContent = user.nombre.charAt(0);

if (user.rol !== 'ADMIN') {
    document.getElementById('menuUsuarios').style.display = 'none';
}

// Variables globales
let ordenes = [];
let pedidos = [];
let tecnicos = [];
let ordenEnRevision = null;
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
        // Cargar solo pedidos con presupuesto ACEPTADO
        const pedidosResponse = await PedidoService.getAll();
        if (pedidosResponse.success && pedidosResponse.data) {
            pedidos = pedidosResponse.data.filter(p =>
                p.estado === 'PRESUPUESTO_ACEPTADO'
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
                            presupuestoInfo.value = `${presupuesto.numeroPresupuesto} - Total: ${formatMoney(presupuesto.total)}`;
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

    await cargarDatosFormulario();
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

            // Llenar formulario
            document.getElementById('ordenId').value = orden.idOt;
            document.getElementById('idPedido').value = orden.pedido?.idPedido || '';

            // Cargar presupuesto del pedido
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
        // Llenar campos
        document.getElementById('viewDiagnostico').value = orden.diagnosticoTecnico || 'No especificado';
        document.getElementById('viewInforme').value = orden.informeFinal || 'No especificado';
        document.getElementById('viewHoras').value = orden.horasTrabajadas ?
            `${orden.horasTrabajadas} horas` : 'No especificado';
        document.getElementById('viewCostoManoObra').value = orden.costoManoObra ?
            formatMoney(orden.costoManoObra) : 'No especificado';
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
    document.getElementById('revCostoManoObra').value = orden.costoManoObra ?
        formatMoney(orden.costoManoObra) : 'N/A';
    document.getElementById('revPresupuestoInicial').value = orden.presupuesto?.total ?
        formatMoney(orden.presupuesto.total) : 'N/A';

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

    // Calcular diferencia inicial
    calcularDiferencia();

    // Agregar listener para calcular diferencia en tiempo real
    document.getElementById('revPresupuestoFinal').addEventListener('input', calcularDiferencia);

    modalRevision.show();
}

// Calcular diferencia entre presupuesto inicial y final
function calcularDiferencia() {
    const presupuestoInicial = ordenEnRevision?.presupuesto?.total || 0;
    const presupuestoFinal = parseFloat(document.getElementById('revPresupuestoFinal').value) || 0;
    const diferencia = presupuestoFinal - presupuestoInicial;

    const diferenciaCampo = document.getElementById('revDiferencia');
    if (diferencia > 0) {
        diferenciaCampo.value = `+${formatMoney(diferencia)} (Aumento)`;
        diferenciaCampo.className = 'form-control bg-danger bg-opacity-10';
    } else if (diferencia < 0) {
        diferenciaCampo.value = `${formatMoney(diferencia)} (Reducción)`;
        diferenciaCampo.className = 'form-control bg-success bg-opacity-10';
    } else {
        diferenciaCampo.value = 'Sin cambios';
        diferenciaCampo.className = 'form-control bg-light';
    }
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

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    cargarOrdenes();
    cargarDatosFormulario(); // Cargar técnicos para el filtro
});
