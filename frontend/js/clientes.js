// Verificar autenticación
AuthService.checkAuth();

// Cargar información del usuario
const user = AuthService.getUser();
document.getElementById('userName').textContent = `${user.nombre} ${user.apellido}`;
document.getElementById('userRole').textContent = user.rol;
document.getElementById('userAvatar').textContent = user.nombre.charAt(0);

// Variables globales
let clientes = [];
let clienteEditando = null;
const modal = new bootstrap.Modal(document.getElementById('modalCliente'));

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

// Mostrar/ocultar razón social según tipo de cliente
document.getElementById('tipoCliente').addEventListener('change', function() {
    const razonSocialDiv = document.getElementById('razonSocialDiv');
    if (this.value === 'EMPRESA') {
        razonSocialDiv.style.display = 'block';
    } else {
        razonSocialDiv.style.display = 'none';
    }
});

// Cargar clientes
async function cargarClientes() {
    const table = document.getElementById('clientesTable');

    try {
        const response = await ClienteService.getAll();

        if (response.success && response.data) {
            clientes = response.data;
            renderClientes(clientes);
        } else {
            throw new Error(response.message || 'Error al cargar clientes');
        }
    } catch (error) {
        console.error('Error:', error);
        table.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle"></i> Error al cargar clientes
                </td>
            </tr>
        `;
    }
}

// Renderizar tabla de clientes
function renderClientes(data) {
    const table = document.getElementById('clientesTable');

    if (data.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i><br>
                    No hay clientes registrados
                </td>
            </tr>
        `;
        return;
    }

    table.innerHTML = data.map(cliente => `
        <tr>
            <td>${cliente.idCliente}</td>
            <td>
                <strong>${cliente.nombre} ${cliente.apellido || ''}</strong><br>
                ${cliente.tipoCliente === 'EMPRESA' && cliente.razonSocial ?
                    `<small class="text-muted">${cliente.razonSocial}</small>` : ''}
            </td>
            <td>
                <span class="badge ${cliente.tipoCliente === 'EMPRESA' ? 'bg-info' : 'bg-secondary'}">
                    ${cliente.tipoCliente}
                </span>
            </td>
            <td>${cliente.rucCi || 'N/A'}</td>
            <td>
                ${cliente.telefono}<br>
                ${cliente.celular ? `<small class="text-muted">${cliente.celular}</small>` : ''}
            </td>
            <td>${cliente.email || 'N/A'}</td>
            <td>
                <span class="badge ${cliente.activo ? 'bg-success' : 'bg-danger'}">
                    ${cliente.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editarCliente(${cliente.idCliente})"
                        title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarCliente(${cliente.idCliente})"
                        title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Buscar clientes
document.getElementById('searchInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = clientes.filter(cliente =>
        cliente.nombre.toLowerCase().includes(searchTerm) ||
        (cliente.apellido && cliente.apellido.toLowerCase().includes(searchTerm)) ||
        (cliente.rucCi && cliente.rucCi.includes(searchTerm)) ||
        (cliente.telefono && cliente.telefono.includes(searchTerm))
    );
    renderClientes(filtered);
});

// Abrir modal para nuevo cliente
function openModalCliente() {
    clienteEditando = null;
    document.getElementById('modalClienteTitle').innerHTML =
        '<i class="fas fa-user-plus"></i> Nuevo Cliente';
    document.getElementById('clienteForm').reset();
    document.getElementById('clienteId').value = '';
    document.getElementById('razonSocialDiv').style.display = 'none';
    modal.show();
}

// Editar cliente
async function editarCliente(id) {
    try {
        const response = await ClienteService.getById(id);

        if (response.success && response.data) {
            clienteEditando = response.data;
            document.getElementById('modalClienteTitle').innerHTML =
                '<i class="fas fa-edit"></i> Editar Cliente';

            // Llenar formulario
            document.getElementById('clienteId').value = clienteEditando.idCliente;
            document.getElementById('tipoCliente').value = clienteEditando.tipoCliente;
            document.getElementById('nombre').value = clienteEditando.nombre;
            document.getElementById('apellido').value = clienteEditando.apellido || '';
            document.getElementById('rucCi').value = clienteEditando.rucCi || '';
            document.getElementById('razonSocial').value = clienteEditando.razonSocial || '';
            document.getElementById('telefono').value = clienteEditando.telefono;
            document.getElementById('celular').value = clienteEditando.celular || '';
            document.getElementById('email').value = clienteEditando.email || '';
            document.getElementById('direccion').value = clienteEditando.direccion || '';
            document.getElementById('ciudad').value = clienteEditando.ciudad || '';
            document.getElementById('activo').value = clienteEditando.activo.toString();
            document.getElementById('observaciones').value = clienteEditando.observaciones || '';

            // Mostrar razón social si es empresa
            if (clienteEditando.tipoCliente === 'EMPRESA') {
                document.getElementById('razonSocialDiv').style.display = 'block';
            }

            modal.show();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los datos del cliente');
    }
}

// Guardar cliente
async function guardarCliente() {
    const form = document.getElementById('clienteForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const clienteData = {
        tipoCliente: document.getElementById('tipoCliente').value,
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        rucCi: document.getElementById('rucCi').value,
        razonSocial: document.getElementById('razonSocial').value,
        telefono: document.getElementById('telefono').value,
        celular: document.getElementById('celular').value,
        email: document.getElementById('email').value,
        direccion: document.getElementById('direccion').value,
        ciudad: document.getElementById('ciudad').value,
        activo: document.getElementById('activo').value === 'true',
        observaciones: document.getElementById('observaciones').value
    };

    try {
        let response;
        const id = document.getElementById('clienteId').value;

        if (id) {
            // Actualizar
            response = await ClienteService.update(id, clienteData);
        } else {
            // Crear nuevo
            response = await ClienteService.create(clienteData);
        }

        if (response.success) {
            modal.hide();
            await cargarClientes();
            alert(id ? 'Cliente actualizado exitosamente' : 'Cliente creado exitosamente');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el cliente: ' + error.message);
    }
}

// Eliminar cliente
async function eliminarCliente(id) {
    if (!confirm('¿Está seguro que desea eliminar este cliente?')) {
        return;
    }

    try {
        const response = await ClienteService.delete(id);

        if (response.success) {
            await cargarClientes();
            alert('Cliente eliminado exitosamente');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el cliente: ' + error.message);
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    cargarClientes();
});
