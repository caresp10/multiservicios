// Verificar autenticación
AuthService.checkAuth();

const user = AuthService.getUser();
document.getElementById('userName').textContent = `${user.nombre} ${user.apellido}`;
document.getElementById('userRole').textContent = user.rol;
document.getElementById('userAvatar').textContent = user.nombre.charAt(0);

if (user.rol !== 'ADMIN') {
    document.getElementById('menuUsuarios').style.display = 'none';
}

// Variables globales
let categorias = [];
const modal = new bootstrap.Modal(document.getElementById('modalCategoria'));

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

// Cargar categorías
async function cargarCategorias() {
    const table = document.getElementById('categoriasTable');

    try {
        const response = await CategoriaService.getAll();

        if (response.success && response.data) {
            categorias = response.data;
            renderCategorias(categorias);
        } else {
            throw new Error(response.message || 'Error al cargar categorías');
        }
    } catch (error) {
        console.error('Error:', error);
        table.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle"></i> Error al cargar categorías
                </td>
            </tr>
        `;
    }
}

// Renderizar tabla de categorías
function renderCategorias(data) {
    const table = document.getElementById('categoriasTable');

    if (data.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i><br>
                    No hay categorías registradas
                </td>
            </tr>
        `;
        return;
    }

    table.innerHTML = data.map(cat => `
        <tr>
            <td>${cat.idCategoria}</td>
            <td><strong>${cat.nombre}</strong></td>
            <td>${cat.descripcion || '<span class="text-muted">Sin descripción</span>'}</td>
            <td>
                <span class="badge ${cat.activo ? 'bg-success' : 'bg-danger'}">
                    ${cat.activo ? 'Activa' : 'Inactiva'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editarCategoria(${cat.idCategoria})"
                        title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarCategoria(${cat.idCategoria})"
                        title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Abrir modal para nueva categoría
function openModalCategoria() {
    document.getElementById('modalCategoriaTitle').innerHTML =
        '<i class="fas fa-plus"></i> Nueva Categoría';
    document.getElementById('categoriaForm').reset();
    document.getElementById('categoriaId').value = '';
    document.getElementById('activo').checked = true;
    modal.show();
}

// Editar categoría
async function editarCategoria(id) {
    try {
        const response = await CategoriaService.getById(id);

        if (response.success && response.data) {
            const categoria = response.data;
            document.getElementById('modalCategoriaTitle').innerHTML =
                '<i class="fas fa-edit"></i> Editar Categoría';

            document.getElementById('categoriaId').value = categoria.idCategoria;
            document.getElementById('nombre').value = categoria.nombre;
            document.getElementById('descripcion').value = categoria.descripcion || '';
            document.getElementById('activo').checked = categoria.activo;

            modal.show();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los datos de la categoría');
    }
}

// Guardar categoría
async function guardarCategoria() {
    const form = document.getElementById('categoriaForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const categoriaData = {
        nombre: document.getElementById('nombre').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim() || null,
        activo: document.getElementById('activo').checked
    };

    try {
        let response;
        const id = document.getElementById('categoriaId').value;

        if (id) {
            response = await CategoriaService.update(id, categoriaData);
        } else {
            response = await CategoriaService.create(categoriaData);
        }

        if (response.success) {
            modal.hide();
            await cargarCategorias();
            alert(id ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar la categoría: ' + error.message);
    }
}

// Eliminar categoría
async function eliminarCategoria(id) {
    if (!confirm('¿Está seguro que desea eliminar esta categoría?')) {
        return;
    }

    try {
        const response = await CategoriaService.delete(id);

        if (response.success) {
            await cargarCategorias();
            alert('Categoría eliminada exitosamente');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la categoría: ' + error.message);
    }
}

// Cargar categorías al inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarCategorias();
});
