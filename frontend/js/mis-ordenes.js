// Verificar autenticación
AuthService.checkAuth();

// Cargar información del usuario
const user = AuthService.getUser();
document.getElementById('userName').textContent = `${user.nombre} ${user.apellido}`;
document.getElementById('userRole').textContent = user.rol;
document.getElementById('userAvatar').textContent = user.nombre.charAt(0);

// Configurar visibilidad de campos según el rol
if (user.rol === 'ADMIN') {
    // ADMIN ve ambos campos: horas trabajadas y costo
    document.getElementById('divCostoManoObra').style.display = 'block';
} else {
    // TECNICO solo ve horas trabajadas, que ocupa todo el ancho
    document.getElementById('divHorasTrabajadas').classList.remove('col-md-6');
    document.getElementById('divHorasTrabajadas').classList.add('col-md-12');
}

// Variables globales
let ordenes = [];
let ordenActual = null;
let miTecnico = null; // Datos del técnico asociado al usuario
const modal = new bootstrap.Modal(document.getElementById('modalTrabajarOT'));

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

// Obtener datos del técnico asociado al usuario logueado
async function obtenerMiTecnico() {
    try {
        const response = await TecnicoService.getByUsuarioId(user.idUsuario);
        if (response.success && response.data) {
            miTecnico = response.data;
            console.log('Técnico cargado:', miTecnico);
            return miTecnico;
        } else {
            throw new Error('No se encontró técnico asociado a este usuario');
        }
    } catch (error) {
        console.error('Error obteniendo datos de técnico:', error);
        alert('Error: Este usuario no tiene un técnico asociado. Contacte al administrador.');
        throw error;
    }
}

// Cargar órdenes asignadas al técnico actual
async function cargarMisOrdenes() {
    const table = document.getElementById('ordenesTable');

    try {
        // Primero obtener datos del técnico si es rol TECNICO
        if (user.rol === 'TECNICO' && !miTecnico) {
            console.log('Usuario TECNICO - obteniendo datos del técnico para idUsuario:', user.idUsuario);
            await obtenerMiTecnico();
        }

        const response = await OrdenTrabajoService.getAll();
        console.log('Órdenes obtenidas:', response.data?.length || 0);

        if (response.success && response.data) {
            // Filtrar solo las órdenes asignadas al técnico actual
            ordenes = response.data.filter(orden => {
                // Si el usuario es técnico, mostrar solo sus órdenes asignadas
                if (user.rol === 'TECNICO' && miTecnico) {
                    const ordenTecnicoId = orden.tecnico?.idTecnico;
                    const miTecnicoId = miTecnico.idTecnico;
                    const coincide = ordenTecnicoId === miTecnicoId;

                    if (orden.tecnico) {
                        console.log(`OT ${orden.numeroOt}: tecnico.idTecnico=${ordenTecnicoId}, miTecnico.idTecnico=${miTecnicoId}, coincide=${coincide}`);
                    }

                    return coincide;
                }
                // Si es admin/supervisor, mostrar todas
                return true;
            });

            console.log('Órdenes filtradas por técnico:', ordenes.length);

            // Filtrar estados relevantes para técnicos
            // Incluir ABIERTA para OTs recién creadas que necesitan ser iniciadas
            ordenes = ordenes.filter(orden =>
                ['ABIERTA', 'ASIGNADA', 'EN_PROCESO', 'ESPERANDO_REVISION', 'DEVUELTA_A_TECNICO', 'TERMINADA'].includes(orden.estado)
            );

            console.log('Órdenes filtradas por estado:', ordenes.length);

            renderOrdenes(ordenes);
        } else {
            throw new Error(response.message || 'Error al cargar órdenes de trabajo');
        }
    } catch (error) {
        console.error('Error en cargarMisOrdenes:', error);
        table.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle"></i> Error al cargar órdenes de trabajo: ${error.message}
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
                <td colspan="7" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i><br>
                    No tiene órdenes de trabajo asignadas
                </td>
            </tr>
        `;
        return;
    }

    table.innerHTML = data.map(orden => `
        <tr>
            <td><strong>${orden.numeroOt}</strong></td>
            <td>
                ${orden.pedido?.cliente?.nombre || 'N/A'} ${orden.pedido?.cliente?.apellido || ''}<br>
                <small class="text-muted">${orden.pedido?.cliente?.telefono || ''}</small>
            </td>
            <td>
                <small>${(orden.descripcionTrabajo || '').substring(0, 60)}${(orden.descripcionTrabajo || '').length > 60 ? '...' : ''}</small>
            </td>
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
            <td>${formatDate(orden.fechaAsignacion || orden.fechaCreacion)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="abrirOrden(${orden.idOt})"
                        title="Trabajar en esta orden">
                    <i class="fas fa-wrench"></i> Trabajar
                </button>
            </td>
        </tr>
    `).join('');
}

// Filtros
document.getElementById('searchInput').addEventListener('input', aplicarFiltros);
document.getElementById('filterEstado').addEventListener('change', aplicarFiltros);
document.getElementById('filterPrioridad').addEventListener('change', aplicarFiltros);

function aplicarFiltros() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const estado = document.getElementById('filterEstado').value;
    const prioridad = document.getElementById('filterPrioridad').value;

    let filtered = ordenes.filter(orden => {
        const matchSearch = orden.numeroOt.toLowerCase().includes(searchTerm) ||
                          (orden.pedido?.cliente?.nombre || '').toLowerCase().includes(searchTerm);
        const matchEstado = !estado || orden.estado === estado;
        const matchPrioridad = !prioridad || orden.prioridad === prioridad;

        return matchSearch && matchEstado && matchPrioridad;
    });

    renderOrdenes(filtered);
}

// Abrir modal para trabajar en una orden
async function abrirOrden(id) {
    try {
        const response = await OrdenTrabajoService.getById(id);

        if (response.success && response.data) {
            ordenActual = response.data;

            // Llenar datos readonly
            document.getElementById('otId').value = ordenActual.idOt;
            document.getElementById('numeroOT').value = ordenActual.numeroOt;
            document.getElementById('numeroPedido').value = ordenActual.pedido?.numeroPedido || 'N/A';
            document.getElementById('cliente').value =
                `${ordenActual.pedido?.cliente?.nombre || ''} ${ordenActual.pedido?.cliente?.apellido || ''}`;
            document.getElementById('telefonoCliente').value = ordenActual.pedido?.cliente?.telefono || 'N/A';
            document.getElementById('direccionCliente').value = ordenActual.pedido?.cliente?.direccion || 'No especificada';
            document.getElementById('estadoOT').value = formatEstado(ordenActual.estado);
            document.getElementById('prioridadOT').value = ordenActual.prioridad;
            document.getElementById('descripcionProblema').value = ordenActual.descripcionTrabajo || '';

            // Mostrar observaciones de devolución si existen
            const divObservaciones = document.getElementById('divObservacionesDevolucion');
            if (ordenActual.estado === 'DEVUELTA_A_TECNICO' && ordenActual.observacionesDevolucion) {
                divObservaciones.style.display = 'block';
                document.getElementById('observacionesDevolucion').textContent = ordenActual.observacionesDevolucion;
            } else {
                divObservaciones.style.display = 'none';
            }

            // Llenar datos del trabajo (si existen)
            document.getElementById('diagnosticoTecnico').value = ordenActual.diagnosticoTecnico || '';
            document.getElementById('informeFinal').value = ordenActual.informeFinal || '';
            document.getElementById('horasTrabajadas').value = ordenActual.horasTrabajadas || '';
            document.getElementById('costoManoObra').value = ordenActual.costoManoObra || '';

            // Mostrar botones según el estado
            mostrarBotonesSegunEstado(ordenActual.estado);

            modal.show();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los datos de la orden de trabajo');
    }
}

// Mostrar botones según el estado de la OT
function mostrarBotonesSegunEstado(estado) {
    const btnIniciar = document.getElementById('btnIniciarTrabajo');
    const btnGuardar = document.getElementById('btnGuardarProgreso');
    const btnEnviar = document.getElementById('btnEnviarRevision');

    // Ocultar todos primero
    btnIniciar.style.display = 'none';
    btnGuardar.style.display = 'none';
    btnEnviar.style.display = 'none';

    switch(estado) {
        case 'ABIERTA':
        case 'ASIGNADA':
            btnIniciar.style.display = 'inline-block';
            break;
        case 'EN_PROCESO':
        case 'DEVUELTA_A_TECNICO':
            btnGuardar.style.display = 'inline-block';
            btnEnviar.style.display = 'inline-block';
            break;
        case 'ESPERANDO_REVISION':
        case 'TERMINADA':
            // Solo lectura - todos los campos deshabilitados
            document.getElementById('diagnosticoTecnico').disabled = true;
            document.getElementById('informeFinal').disabled = true;
            document.getElementById('horasTrabajadas').disabled = true;
            document.getElementById('costoManoObra').disabled = true;
            break;
        default:
            break;
    }
}

// Iniciar trabajo en la OT
async function iniciarTrabajo() {
    if (!confirm('¿Desea iniciar el trabajo en esta orden?')) {
        return;
    }

    try {
        const ordenData = {
            estado: 'EN_PROCESO'
        };

        const response = await OrdenTrabajoService.update(ordenActual.idOt, ordenData);

        if (response.success) {
            alert('Trabajo iniciado. Ahora puede registrar el diagnóstico e informe.');
            modal.hide();
            await cargarMisOrdenes();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al iniciar el trabajo: ' + error.message);
    }
}

// Guardar progreso sin enviar a revisión
async function guardarProgreso() {
    const form = document.getElementById('otForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    try {
        const ordenData = {
            diagnosticoTecnico: document.getElementById('diagnosticoTecnico').value,
            informeFinal: document.getElementById('informeFinal').value,
            horasTrabajadas: parseFloat(document.getElementById('horasTrabajadas').value) || null,
            costoManoObra: document.getElementById('costoManoObra').value ?
                          parseFloat(document.getElementById('costoManoObra').value) : null,
            estado: 'EN_PROCESO'
        };

        const response = await OrdenTrabajoService.update(ordenActual.idOt, ordenData);

        if (response.success) {
            alert('Progreso guardado exitosamente');
            modal.hide();
            await cargarMisOrdenes();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el progreso: ' + error.message);
    }
}

// Enviar a revisión
async function enviarRevision() {
    const form = document.getElementById('otForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    if (!confirm('¿Está seguro que desea enviar esta orden a revisión? No podrá modificarla hasta que sea revisada.')) {
        return;
    }

    try {
        const ordenData = {
            diagnosticoTecnico: document.getElementById('diagnosticoTecnico').value,
            informeFinal: document.getElementById('informeFinal').value,
            horasTrabajadas: parseFloat(document.getElementById('horasTrabajadas').value),
            costoManoObra: document.getElementById('costoManoObra').value ?
                          parseFloat(document.getElementById('costoManoObra').value) : null,
            estado: 'ESPERANDO_REVISION'
        };

        const response = await OrdenTrabajoService.update(ordenActual.idOt, ordenData);

        if (response.success) {
            alert('Orden enviada a revisión exitosamente');
            modal.hide();
            await cargarMisOrdenes();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al enviar a revisión: ' + error.message);
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

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    cargarMisOrdenes();
});
