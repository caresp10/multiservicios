// Estado global
let proveedores = [];
let proveedorEditando = null;
let modalProveedor;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    AuthService.checkAuth();
    displayUserInfo();
    modalProveedor = new bootstrap.Modal(document.getElementById('modalProveedor'));
    cargarProveedores();
    setupBusqueda();
});

// Cargar proveedores
async function cargarProveedores() {
    try {
        const data = await ApiService.get('/proveedores');
        if (data.success) {
            proveedores = data.data;
            renderizarProveedores(proveedores);
        }
    } catch (error) {
        console.error('Error cargando proveedores:', error);
        mostrarError('Error al cargar proveedores');
    }
}

// Renderizar proveedores en la tabla
function renderizarProveedores(lista) {
    const tbody = document.getElementById('proveedoresTable');
    if (!lista || lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay proveedores registrados</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(proveedor => `
        <tr>
            <td>${proveedor.nombre}</td>
            <td>${proveedor.razonSocial || '-'}</td>
            <td>${proveedor.ruc || '-'}</td>
            <td>${proveedor.telefono || '-'}</td>
            <td>${proveedor.ciudad || '-'}</td>
            <td>${proveedor.personaContacto || '-'}</td>
            <td>
                <span class="badge bg-${proveedor.activo ? 'success' : 'danger'}">
                    ${proveedor.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editarProveedor(${proveedor.idProveedor})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                ${proveedor.activo ? `
                <button class="btn btn-sm btn-danger" onclick="desactivarProveedor(${proveedor.idProveedor})" title="Desactivar">
                    <i class="fas fa-ban"></i>
                </button>
                ` : `
                <button class="btn btn-sm btn-success" onclick="activarProveedor(${proveedor.idProveedor})" title="Activar">
                    <i class="fas fa-check"></i>
                </button>
                `}
            </td>
        </tr>
    `).join('');
}

// Abrir modal para nuevo proveedor
function openModalProveedor() {
    proveedorEditando = null;
    document.getElementById('modalProveedorTitle').innerHTML = '<i class="fas fa-truck"></i> Nuevo Proveedor';
    document.getElementById('proveedorForm').reset();
    document.getElementById('proveedorId').value = '';
    document.getElementById('pais').value = 'Paraguay';
    modalProveedor.show();
}

// Editar proveedor
async function editarProveedor(id) {
    try {
        const data = await ApiService.get(`/proveedores/${id}`);
        if (data.success) {
            proveedorEditando = data.data;
            document.getElementById('modalProveedorTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Proveedor';
            document.getElementById('proveedorId').value = proveedorEditando.idProveedor;
            document.getElementById('nombre').value = proveedorEditando.nombre || '';
            document.getElementById('razonSocial').value = proveedorEditando.razonSocial || '';
            document.getElementById('ruc').value = proveedorEditando.ruc || '';
            document.getElementById('telefono').value = proveedorEditando.telefono || '';
            document.getElementById('email').value = proveedorEditando.email || '';
            document.getElementById('direccion').value = proveedorEditando.direccion || '';
            document.getElementById('ciudad').value = proveedorEditando.ciudad || '';
            document.getElementById('pais').value = proveedorEditando.pais || 'Paraguay';
            document.getElementById('personaContacto').value = proveedorEditando.personaContacto || '';
            document.getElementById('observaciones').value = proveedorEditando.observaciones || '';
            modalProveedor.show();
        }
    } catch (error) {
        console.error('Error cargando proveedor:', error);
        mostrarError('Error al cargar proveedor');
    }
}

// Guardar proveedor
async function guardarProveedor() {
    const form = document.getElementById('proveedorForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const proveedor = {
        nombre: document.getElementById('nombre').value.trim(),
        razonSocial: document.getElementById('razonSocial').value.trim() || null,
        ruc: document.getElementById('ruc').value.trim() || null,
        telefono: document.getElementById('telefono').value.trim() || null,
        email: document.getElementById('email').value.trim() || null,
        direccion: document.getElementById('direccion').value.trim() || null,
        ciudad: document.getElementById('ciudad').value.trim() || null,
        pais: document.getElementById('pais').value.trim() || 'Paraguay',
        personaContacto: document.getElementById('personaContacto').value.trim() || null,
        observaciones: document.getElementById('observaciones').value.trim() || null
    };

    try {
        const id = document.getElementById('proveedorId').value;
        let data;

        if (id) {
            // Actualizar
            data = await ApiService.request(`/proveedores/${id}`, {
                method: 'PUT',
                body: proveedor
            });
        } else {
            // Crear
            data = await ApiService.post('/proveedores', proveedor);
        }

        if (data.success) {
            mostrarExito(data.message);
            modalProveedor.hide();
            cargarProveedores();
        } else {
            mostrarError(data.message);
        }
    } catch (error) {
        console.error('Error guardando proveedor:', error);
        mostrarError('Error al guardar proveedor');
    }
}

// Desactivar proveedor
async function desactivarProveedor(id) {
    if (!confirm('¿Está seguro de desactivar este proveedor?')) return;

    try {
        const data = await ApiService.request(`/proveedores/${id}`, {
            method: 'DELETE'
        });

        if (data.success) {
            mostrarExito(data.message);
            cargarProveedores();
        } else {
            mostrarError(data.message);
        }
    } catch (error) {
        console.error('Error desactivando proveedor:', error);
        mostrarError('Error al desactivar proveedor');
    }
}

// Activar proveedor
async function activarProveedor(id) {
    try {
        const data = await ApiService.request(`/proveedores/${id}/activar`, {
            method: 'PATCH'
        });

        if (data.success) {
            mostrarExito(data.message);
            cargarProveedores();
        } else {
            mostrarError(data.message);
        }
    } catch (error) {
        console.error('Error activando proveedor:', error);
        mostrarError('Error al activar proveedor');
    }
}

// Búsqueda
function setupBusqueda() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function() {
        const termino = this.value.toLowerCase();
        const filtrados = proveedores.filter(p =>
            p.nombre.toLowerCase().includes(termino) ||
            (p.razonSocial && p.razonSocial.toLowerCase().includes(termino)) ||
            (p.ruc && p.ruc.toLowerCase().includes(termino))
        );
        renderizarProveedores(filtrados);
    });
}

// Utilidades
function displayUserInfo() {
    const user = AuthService.getUser();
    if (user) {
        document.getElementById('userName').textContent = user.nombre;
        document.getElementById('userRole').textContent = user.rol;
        document.getElementById('userAvatar').textContent = user.nombre.charAt(0).toUpperCase();
    }
}

function mostrarExito(mensaje) {
    alert(mensaje);
}

function mostrarError(mensaje) {
    alert('Error: ' + mensaje);
}
