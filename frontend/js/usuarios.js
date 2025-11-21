// Verificar autenticación y que sea ADMIN
AuthService.checkAuth();

const user = AuthService.getUser();
if (user.rol !== 'ADMIN') {
    alert('Acceso denegado. Solo administradores pueden acceder a esta sección.');
    window.location.href = 'dashboard.html';
}

document.getElementById('userName').textContent = `${user.nombre} ${user.apellido}`;
document.getElementById('userRole').textContent = user.rol;
document.getElementById('userAvatar').textContent = user.nombre.charAt(0);

let usuarios = [];
let rolesDisponibles = [];
const modal = new bootstrap.Modal(document.getElementById('modalUsuario'));

document.getElementById('sidebarToggle')?.addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
});

function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        AuthService.logout();
    }
}

async function cargarUsuarios() {
    const table = document.getElementById('usuariosTable');

    try {
        const response = await UsuarioService.getAll();

        if (response.success && response.data) {
            usuarios = response.data;
            renderUsuarios(usuarios);
        } else {
            throw new Error(response.message || 'Error al cargar usuarios');
        }
    } catch (error) {
        console.error('Error:', error);
        table.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle"></i> Error al cargar usuarios
                </td>
            </tr>
        `;
    }
}

function renderUsuarios(data) {
    const table = document.getElementById('usuariosTable');

    if (data.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i><br>
                    No hay usuarios registrados
                </td>
            </tr>
        `;
        return;
    }

    table.innerHTML = data.map(usuario => `
        <tr>
            <td>${usuario.idUsuario}</td>
            <td><strong>${usuario.username}</strong></td>
            <td>${usuario.nombre} ${usuario.apellido}</td>
            <td>${usuario.email}</td>
            <td>
                <span class="badge bg-${getRolColor(usuario.rol)}">
                    ${formatRol(usuario.rol)}
                </span>
            </td>
            <td>
                <span class="badge ${usuario.activo ? 'bg-success' : 'bg-danger'}">
                    ${usuario.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editarUsuario(${usuario.idUsuario})"
                        title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

document.getElementById('searchInput').addEventListener('input', aplicarFiltros);
document.getElementById('filterRol').addEventListener('change', aplicarFiltros);

function aplicarFiltros() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const rol = document.getElementById('filterRol').value;

    let filtered = usuarios.filter(usuario => {
        const matchSearch = usuario.username.toLowerCase().includes(searchTerm) ||
                          usuario.nombre.toLowerCase().includes(searchTerm) ||
                          usuario.apellido.toLowerCase().includes(searchTerm);
        const matchRol = !rol || usuario.rol === rol;

        return matchSearch && matchRol;
    });

    renderUsuarios(filtered);
}

function openModalUsuario() {
    document.getElementById('modalUsuarioTitle').innerHTML =
        '<i class="fas fa-user-plus"></i> Nuevo Usuario';
    document.getElementById('usuarioForm').reset();
    document.getElementById('usuarioId').value = '';
    document.getElementById('passwordDiv').style.display = 'block';
    document.getElementById('password').required = true;
    document.getElementById('passwordLabel').innerHTML = '<i class="fas fa-lock"></i> Contraseña *';
    document.getElementById('passwordHelp').style.display = 'none';

    modal.show();
}

async function editarUsuario(id) {
    try {
        const response = await UsuarioService.getById(id);

        if (response.success && response.data) {
            const usuario = response.data;
            document.getElementById('modalUsuarioTitle').innerHTML =
                '<i class="fas fa-edit"></i> Editar Usuario';

            document.getElementById('usuarioId').value = usuario.idUsuario;
            document.getElementById('username').value = usuario.username;
            document.getElementById('nombre').value = usuario.nombre;
            document.getElementById('apellido').value = usuario.apellido;
            document.getElementById('email').value = usuario.email;
            document.getElementById('rol').value = usuario.rol;
            document.getElementById('activo').value = usuario.activo.toString();

            // Mostrar campo de contraseña como opcional al editar
            document.getElementById('passwordDiv').style.display = 'block';
            document.getElementById('password').required = false;
            document.getElementById('password').value = '';
            document.getElementById('passwordLabel').innerHTML = '<i class="fas fa-lock"></i> Nueva Contraseña';
            document.getElementById('passwordHelp').style.display = 'block';

            modal.show();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los datos del usuario');
    }
}

async function guardarUsuario() {
    const form = document.getElementById('usuarioForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const usuarioData = {
        username: document.getElementById('username').value,
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        email: document.getElementById('email').value,
        rol: document.getElementById('rol').value,
        activo: document.getElementById('activo').value === 'true'
    };

    const id = document.getElementById('usuarioId').value;
    const password = document.getElementById('password').value;

    // Incluir password si es nuevo usuario o si se proporcionó una nueva
    if (!id || password) {
        usuarioData.password = password;
    }

    try {
        let response;

        if (id) {
            response = await UsuarioService.update(id, usuarioData);
        } else {
            response = await UsuarioService.create(usuarioData);
        }

        if (response.success) {
            modal.hide();
            await cargarUsuarios();
            alert(id ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el usuario: ' + error.message);
    }
}

function formatRol(rol) {
    const roles = {
        'ADMIN': 'Administrador',
        'TECNICO': 'Técnico',
        'SUPERVISOR': 'Supervisor',
        'DUENO': 'Dueño',
        'RECEPCION': 'Recepción'
    };
    return roles[rol] || rol;
}

function getRolColor(rol) {
    const colors = {
        'ADMIN': 'danger',
        'TECNICO': 'primary',
        'SUPERVISOR': 'warning',
        'DUENO': 'success',
        'RECEPCION': 'info'
    };
    return colors[rol] || 'secondary';
}

async function cargarRoles() {
    try {
        const response = await UsuarioService.getRoles();
        if (response.success && response.data) {
            rolesDisponibles = response.data;

            // Actualizar select del filtro
            const filterRol = document.getElementById('filterRol');
            filterRol.innerHTML = '<option value="">Todos los roles</option>' +
                rolesDisponibles.map(rol =>
                    `<option value="${rol.valor}">${rol.nombre}</option>`
                ).join('');

            // Actualizar select del modal
            const selectRol = document.getElementById('rol');
            selectRol.innerHTML = '<option value="">Seleccione un rol</option>' +
                rolesDisponibles.map(rol =>
                    `<option value="${rol.valor}">${rol.nombre}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error al cargar roles:', error);
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    await cargarRoles();
    await cargarUsuarios();
});
