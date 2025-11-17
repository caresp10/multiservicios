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
let tecnicos = [];
let tecnicoEditando = null;
const modal = new bootstrap.Modal(document.getElementById('modalTecnico'));

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

// Cargar técnicos
async function cargarTecnicos() {
    const table = document.getElementById('tecnicosTable');

    try {
        const response = await TecnicoService.getAll();

        if (response.success && response.data) {
            tecnicos = response.data;
            renderTecnicos(tecnicos);
        } else {
            throw new Error(response.message || 'Error al cargar técnicos');
        }
    } catch (error) {
        console.error('Error:', error);
        table.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle"></i> Error al cargar técnicos
                </td>
            </tr>
        `;
    }
}

// Renderizar tabla de técnicos
function renderTecnicos(data) {
    const table = document.getElementById('tecnicosTable');

    if (data.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i><br>
                    No hay técnicos registrados
                </td>
            </tr>
        `;
        return;
    }

    table.innerHTML = data.map(tecnico => `
        <tr>
            <td>${tecnico.idTecnico}</td>
            <td>
                <strong>${tecnico.nombre} ${tecnico.apellido || ''}</strong><br>
                ${tecnico.email ? `<small class="text-muted">${tecnico.email}</small>` : ''}
            </td>
            <td>${tecnico.ci || 'N/A'}</td>
            <td>
                ${tecnico.telefono || ''}
                ${tecnico.celular ? `<br><small class="text-muted">${tecnico.celular}</small>` : ''}
            </td>
            <td>${tecnico.email || 'N/A'}</td>
            <td>${tecnico.especialidad || 'N/A'}</td>
            <td>
                ${tecnico.nivelExperiencia ?
                    `<span class="badge bg-info">${formatNivelExperiencia(tecnico.nivelExperiencia)}</span>`
                    : '<span class="text-muted">-</span>'}
            </td>
            <td>
                <span class="badge ${tecnico.activo ? 'bg-success' : 'bg-danger'}">
                    ${tecnico.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editarTecnico(${tecnico.idTecnico})"
                        title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarTecnico(${tecnico.idTecnico})"
                        title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Buscar técnicos
document.getElementById('searchInput').addEventListener('input', aplicarFiltros);

function aplicarFiltros() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    let filtered = tecnicos.filter(tecnico => {
        return tecnico.nombre.toLowerCase().includes(searchTerm) ||
               tecnico.apellido.toLowerCase().includes(searchTerm) ||
               (tecnico.email && tecnico.email.toLowerCase().includes(searchTerm)) ||
               (tecnico.especialidad && tecnico.especialidad.toLowerCase().includes(searchTerm)) ||
               (tecnico.ci && tecnico.ci.toLowerCase().includes(searchTerm));
    });

    renderTecnicos(filtered);
}

// Cargar categorías de servicio en el select de especialidad
async function cargarEspecialidades() {
    try {
        const response = await CategoriaService.getActivas();
        const select = document.getElementById('especialidad');

        if (response.success && response.data && response.data.length > 0) {
            // Construir las opciones
            let opciones = '<option value="">Seleccione especialidad</option>';
            response.data.forEach(cat => {
                opciones += `<option value="${cat.nombre}">${cat.nombre}</option>`;
            });
            select.innerHTML = opciones;
        } else {
            select.innerHTML = '<option value="">No hay especialidades disponibles</option>';
        }
    } catch (error) {
        console.error('Error cargando especialidades:', error);
        const select = document.getElementById('especialidad');
        select.innerHTML = '<option value="">Error al cargar especialidades</option>';
    }
}

// Cargar usuarios con rol TECNICO
async function cargarUsuariosTecnicos() {
    try {
        const response = await UsuarioService.getAll();
        const select = document.getElementById('idUsuario');

        if (response.success && response.data && response.data.length > 0) {
            // Filtrar solo usuarios con rol TECNICO
            const usuariosTecnicos = response.data.filter(u => u.rol === 'TECNICO');

            let opciones = '<option value="">Sin usuario asignado</option>';
            usuariosTecnicos.forEach(usuario => {
                opciones += `<option value="${usuario.idUsuario}">${usuario.nombre} ${usuario.apellido} (${usuario.username})</option>`;
            });
            select.innerHTML = opciones;
        } else {
            select.innerHTML = '<option value="">No hay usuarios técnicos disponibles</option>';
        }
    } catch (error) {
        console.error('Error cargando usuarios técnicos:', error);
        const select = document.getElementById('idUsuario');
        select.innerHTML = '<option value="">Error al cargar usuarios</option>';
    }
}

// Abrir modal para crear nuevo técnico
async function openModalTecnico() {
    document.getElementById('modalTecnicoTitle').innerHTML =
        '<i class="fas fa-user-plus"></i> Nuevo Técnico';
    document.getElementById('tecnicoForm').reset();
    document.getElementById('tecnicoId').value = '';
    document.getElementById('activo').checked = true;
    tecnicoEditando = null;

    // Cargar especialidades y usuarios antes de mostrar el modal
    await Promise.all([
        cargarEspecialidades(),
        cargarUsuariosTecnicos()
    ]);

    modal.show();
}

// Editar técnico
async function editarTecnico(id) {
    try {
        const response = await TecnicoService.getById(id);

        if (response.success && response.data) {
            const tecnico = response.data;
            document.getElementById('modalTecnicoTitle').innerHTML =
                '<i class="fas fa-edit"></i> Editar Técnico';

            // Cargar especialidades y usuarios primero
            await Promise.all([
                cargarEspecialidades(),
                cargarUsuariosTecnicos()
            ]);

            document.getElementById('tecnicoId').value = tecnico.idTecnico;
            document.getElementById('nombre').value = tecnico.nombre;
            document.getElementById('apellido').value = tecnico.apellido;
            document.getElementById('ci').value = tecnico.ci || '';
            document.getElementById('telefono').value = tecnico.telefono || '';
            document.getElementById('celular').value = tecnico.celular || '';
            document.getElementById('email').value = tecnico.email || '';
            document.getElementById('direccion').value = tecnico.direccion || '';
            document.getElementById('especialidad').value = tecnico.especialidad || '';
            document.getElementById('nivelExperiencia').value = tecnico.nivelExperiencia || '';
            document.getElementById('observaciones').value = tecnico.observaciones || '';
            document.getElementById('activo').checked = tecnico.activo;

            // Setear usuario si existe
            if (tecnico.usuario && tecnico.usuario.idUsuario) {
                document.getElementById('idUsuario').value = tecnico.usuario.idUsuario;
            }

            tecnicoEditando = tecnico;
            modal.show();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los datos del técnico');
    }
}

// Guardar técnico
let guardando = false;

async function guardarTecnico() {
    if (guardando) {
        return;
    }

    const form = document.getElementById('tecnicoForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const idUsuarioValue = document.getElementById('idUsuario').value;

    const tecnicoData = {
        nombre: document.getElementById('nombre').value.trim(),
        apellido: document.getElementById('apellido').value.trim(),
        ci: document.getElementById('ci').value.trim() || null,
        telefono: document.getElementById('telefono').value.trim() || null,
        celular: document.getElementById('celular').value.trim() || null,
        email: document.getElementById('email').value.trim() || null,
        direccion: document.getElementById('direccion').value.trim() || null,
        especialidad: document.getElementById('especialidad').value || null,
        nivelExperiencia: document.getElementById('nivelExperiencia').value || null,
        observaciones: document.getElementById('observaciones').value.trim() || null,
        activo: document.getElementById('activo').checked,
        idUsuario: idUsuarioValue ? parseInt(idUsuarioValue) : null
    };

    guardando = true;
    const btnGuardar = document.querySelector('#modalTecnico .btn-primary:last-child');
    const originalText = btnGuardar.innerHTML;
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        let response;
        const id = document.getElementById('tecnicoId').value;

        if (id) {
            response = await TecnicoService.update(id, tecnicoData);
        } else {
            response = await TecnicoService.create(tecnicoData);
        }

        if (response.success) {
            modal.hide();
            await cargarTecnicos();
            alert(id ? 'Técnico actualizado exitosamente' : 'Técnico creado exitosamente');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el técnico: ' + error.message);
    } finally {
        guardando = false;
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = originalText;
    }
}

// Eliminar técnico
async function eliminarTecnico(id) {
    if (!confirm('¿Está seguro que desea eliminar este técnico?')) {
        return;
    }

    try {
        const response = await TecnicoService.delete(id);

        if (response.success) {
            await cargarTecnicos();
            alert('Técnico eliminado exitosamente');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el técnico: ' + error.message);
    }
}

// Funciones auxiliares
function formatNivelExperiencia(nivel) {
    const niveles = {
        'JUNIOR': 'Junior',
        'SEMI_SENIOR': 'Semi-Senior',
        'SENIOR': 'Senior'
    };
    return niveles[nivel] || nivel;
}

// Cargar técnicos al inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarTecnicos();
});
