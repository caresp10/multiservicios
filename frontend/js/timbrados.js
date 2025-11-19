// Verificar autenticación
AuthService.checkAuth();

// Cargar información del usuario
const user = AuthService.getUser();
document.getElementById('userName').textContent = `${user.nombre} ${user.apellido}`;
document.getElementById('userRole').textContent = user.rol;
document.getElementById('userAvatar').textContent = user.nombre.charAt(0);

// Variables globales
let timbrados = [];
let timbradoEditando = null;
const modal = new bootstrap.Modal(document.getElementById('modalTimbrado'));

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

// Event listener para el filtro
document.getElementById('filtroEstado').addEventListener('change', function() {
    cargarTimbrados(this.value);
});

// Cargar timbrados según el filtro
async function cargarTimbrados(filtro = 'vigentes') {
    const table = document.getElementById('timbradosTable');

    try {
        let response;

        switch(filtro) {
            case 'todos':
                response = await TimbradoService.getAll();
                break;
            case 'vigentes':
                response = await TimbradoService.getVigentes();
                break;
            case 'proximos':
                response = await TimbradoService.getProximosAVencer(30);
                break;
            case 'vencidos':
                response = await TimbradoService.getVencidos();
                break;
            default:
                response = await TimbradoService.getVigentes();
        }

        if (response.success && response.data) {
            timbrados = response.data;
            renderTimbrados(timbrados);
            mostrarAlertas();
        } else {
            throw new Error(response.message || 'Error al cargar timbrados');
        }
    } catch (error) {
        console.error('Error:', error);
        table.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle"></i> Error al cargar timbrados
                </td>
            </tr>
        `;
    }
}

// Mostrar alertas de timbrados próximos a vencer
async function mostrarAlertas() {
    const container = document.getElementById('alertasContainer');

    try {
        const response = await TimbradoService.getProximosAVencer(30);

        if (response.success && response.data && response.data.length > 0) {
            const alertas = response.data.map(t => {
                const diasRestantes = Math.ceil((new Date(t.fechaVencimiento) - new Date()) / (1000 * 60 * 60 * 24));
                const color = diasRestantes <= 7 ? 'danger' : 'warning';

                return `
                    <div class="alert alert-${color} alert-dismissible fade show" role="alert">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>Atención:</strong> El timbrado ${t.numero} vence en ${diasRestantes} días (${new Date(t.fechaVencimiento).toLocaleDateString()})
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                `;
            }).join('');

            container.innerHTML = alertas;
        } else {
            container.innerHTML = '';
        }
    } catch (error) {
        console.error('Error al cargar alertas:', error);
    }
}

// Renderizar tabla de timbrados
function renderTimbrados(data) {
    const table = document.getElementById('timbradosTable');

    if (data.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i><br>
                    No hay timbrados registrados
                </td>
            </tr>
        `;
        return;
    }

    table.innerHTML = data.map(timbrado => {
        const fechaInicio = new Date(timbrado.fechaInicio);
        const fechaVencimiento = new Date(timbrado.fechaVencimiento);
        const hoy = new Date();

        // Determinar estado
        let estadoBadge = '';
        if (!timbrado.activo) {
            estadoBadge = '<span class="badge bg-secondary">Inactivo</span>';
        } else if (fechaVencimiento < hoy) {
            estadoBadge = '<span class="badge bg-danger">Vencido</span>';
        } else if (fechaInicio > hoy) {
            estadoBadge = '<span class="badge bg-info">Pendiente</span>';
        } else {
            const diasRestantes = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
            if (diasRestantes <= 7) {
                estadoBadge = `<span class="badge bg-danger">Vigente (${diasRestantes}d)</span>`;
            } else if (diasRestantes <= 30) {
                estadoBadge = `<span class="badge bg-warning">Vigente (${diasRestantes}d)</span>`;
            } else {
                estadoBadge = '<span class="badge bg-success">Vigente</span>';
            }
        }

        return `
            <tr>
                <td>${timbrado.idTimbrado}</td>
                <td><strong>${timbrado.numero}</strong></td>
                <td><span class="badge bg-info">${timbrado.establecimiento}-${timbrado.puntoExpedicion}</span></td>
                <td>${fechaInicio.toLocaleDateString()}</td>
                <td>${fechaVencimiento.toLocaleDateString()}</td>
                <td>
                    <small class="text-muted">
                        ${timbrado.numeroInicio} - ${timbrado.numeroFin}
                    </small>
                </td>
                <td><span class="badge bg-primary">${timbrado.numeroActual}</span></td>
                <td>${estadoBadge}</td>
                <td>
                    ${!timbrado.activo && !timbrado.isVencido && fechaInicio <= hoy ?
                        `<button class="btn btn-sm btn-outline-success" onclick="activarTimbrado(${timbrado.idTimbrado})"
                                title="Activar">
                            <i class="fas fa-check"></i>
                        </button>` : ''}
                    <button class="btn btn-sm btn-outline-primary" onclick="editarTimbrado(${timbrado.idTimbrado})"
                            title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarTimbrado(${timbrado.idTimbrado})"
                            title="Desactivar" ${!timbrado.activo ? 'disabled' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Abrir modal para nuevo timbrado
function openModalTimbrado() {
    timbradoEditando = null;
    document.getElementById('modalTimbradoTitle').innerHTML = '<i class="fas fa-file-invoice"></i> Nuevo Timbrado';
    document.getElementById('timbradoForm').reset();
    document.getElementById('timbradoId').value = '';

    // Establecer fecha de inicio como hoy
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaInicio').value = hoy;

    modal.show();
}

// Editar timbrado
async function editarTimbrado(id) {
    try {
        const response = await TimbradoService.getById(id);

        if (response.success && response.data) {
            timbradoEditando = response.data;
            document.getElementById('modalTimbradoTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Timbrado';
            document.getElementById('timbradoId').value = timbradoEditando.idTimbrado;
            document.getElementById('numero').value = timbradoEditando.numero;
            document.getElementById('establecimiento').value = timbradoEditando.establecimiento;
            document.getElementById('puntoExpedicion').value = timbradoEditando.puntoExpedicion;
            document.getElementById('fechaInicio').value = timbradoEditando.fechaInicio;
            document.getElementById('fechaVencimiento').value = timbradoEditando.fechaVencimiento;
            document.getElementById('numeroInicio').value = timbradoEditando.numeroInicio;
            document.getElementById('numeroFin').value = timbradoEditando.numeroFin;
            document.getElementById('observaciones').value = timbradoEditando.observaciones || '';

            modal.show();
        }
    } catch (error) {
        Swal.fire('Error', 'No se pudo cargar el timbrado', 'error');
    }
}

// Guardar timbrado
async function guardarTimbrado() {
    const form = document.getElementById('timbradoForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const timbrado = {
        numero: document.getElementById('numero').value.trim(),
        establecimiento: document.getElementById('establecimiento').value.trim().padStart(3, '0'),
        puntoExpedicion: document.getElementById('puntoExpedicion').value.trim().padStart(3, '0'),
        fechaInicio: document.getElementById('fechaInicio').value,
        fechaVencimiento: document.getElementById('fechaVencimiento').value,
        numeroInicio: document.getElementById('numeroInicio').value.trim(),
        numeroFin: document.getElementById('numeroFin').value.trim(),
        observaciones: document.getElementById('observaciones').value.trim()
    };

    // Validar fechas
    if (new Date(timbrado.fechaInicio) > new Date(timbrado.fechaVencimiento)) {
        Swal.fire('Error', 'La fecha de inicio no puede ser posterior a la fecha de vencimiento', 'error');
        return;
    }

    try {
        const id = document.getElementById('timbradoId').value;
        let response;

        if (id) {
            response = await TimbradoService.update(id, timbrado);
        } else {
            response = await TimbradoService.create(timbrado);
        }

        if (response.success) {
            Swal.fire('Éxito', response.message, 'success');
            modal.hide();
            cargarTimbrados(document.getElementById('filtroEstado').value);
        } else {
            Swal.fire('Error', response.message, 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'No se pudo guardar el timbrado', 'error');
        console.error('Error:', error);
    }
}

// Eliminar (desactivar) timbrado
async function eliminarTimbrado(id) {
    const result = await Swal.fire({
        title: '¿Está seguro?',
        text: 'El timbrado será desactivado',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, desactivar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const response = await TimbradoService.delete(id);

            if (response.success) {
                Swal.fire('Desactivado', response.message, 'success');
                cargarTimbrados(document.getElementById('filtroEstado').value);
            } else {
                Swal.fire('Error', response.message, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'No se pudo desactivar el timbrado', 'error');
            console.error('Error:', error);
        }
    }
}

// Activar timbrado manualmente
async function activarTimbrado(id) {
    const result = await Swal.fire({
        title: '¿Activar timbrado?',
        text: 'Esto desactivará cualquier otro timbrado activo',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, activar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const response = await TimbradoService.activar(id);

            if (response.success) {
                Swal.fire('Activado', response.message, 'success');
                cargarTimbrados(document.getElementById('filtroEstado').value);
            } else {
                Swal.fire('Error', response.message, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'No se pudo activar el timbrado', 'error');
            console.error('Error:', error);
        }
    }
}

// Cargar timbrados vigentes al iniciar
cargarTimbrados('vigentes');
