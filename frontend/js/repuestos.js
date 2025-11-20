// Estado global
let repuestos = [];
let repuestoEditando = null;
let modalRepuesto;
// let modalStock; // Eliminado: ya no se usa modal de stock

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    AuthService.checkAuth();
    displayUserInfo();
    modalRepuesto = new bootstrap.Modal(document.getElementById('modalRepuesto'));
    // modalStock eliminado
    cargarCategorias();
    cargarRepuestos();
    setupBusqueda();
    setupCategoriaListener();
});

// Cargar categorías desde el backend y poblar el select
async function cargarCategorias() {
    try {
        const data = await ApiService.get('/categorias');
        if (data.success) {
            const select = document.getElementById('categoria');
            select.innerHTML = '<option value="">Seleccione una categoría</option>';
            data.data.forEach(cat => {
                select.innerHTML += `<option value="${cat.idCategoria}" data-nombre="${cat.nombre}">${cat.nombre}</option>`;
            });
        }
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

// Configurar listener de categoría para generar código automático
function setupCategoriaListener() {
    const select = document.getElementById('categoria');
    if (select) {
        select.addEventListener('change', async function() {
            const idCategoria = this.value;
            console.log('Categoría seleccionada:', idCategoria, 'Editando:', repuestoEditando);

            if (idCategoria && !repuestoEditando) {
                try {
                    console.log('Llamando a /repuestos/generar-codigo/' + idCategoria);
                    const response = await ApiService.get(`/repuestos/generar-codigo/${idCategoria}`);
                    console.log('Respuesta del servidor:', response);

                    if (response.success && response.data) {
                        document.getElementById('codigo').value = response.data;
                        console.log('Código generado:', response.data);
                    } else {
                        console.error('Error en respuesta:', response.message);
                    }
                } catch (error) {
                    console.error('Error generando código:', error);
                }
            }
        });
        console.log('Listener de categoría configurado');
    } else {
        console.error('No se encontró el select de categoría');
    }
}

// Cargar repuestos
async function cargarRepuestos() {
    try {
            const data = await ApiService.get('/repuestos');
        if (data.success) {
            repuestos = data.data;
            renderizarRepuestos(repuestos);
            actualizarEstadisticas();
        }
    } catch (error) {
        console.error('Error cargando repuestos:', error);
        mostrarError('Error al cargar repuestos');
    }
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    const sinStock = repuestos.filter(r => r.activo && r.stockActual === 0).length;
    const stockBajo = repuestos.filter(r => r.activo && r.stockActual > 0 && r.stockActual <= r.stockMinimo).length;

    document.getElementById('sinStock').textContent = sinStock;
    document.getElementById('stockBajo').textContent = stockBajo;
    document.getElementById('totalRepuestos').textContent = repuestos.filter(r => r.activo).length;
}

// Renderizar repuestos
function renderizarRepuestos(lista) {
    const tbody = document.getElementById('repuestosTable');
    if (!lista || lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No hay repuestos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(repuesto => {
        let stockBadge = '';
        if (repuesto.stockActual === 0) {
            stockBadge = '<span class="badge bg-danger">SIN STOCK</span>';
        } else if (repuesto.stockActual <= repuesto.stockMinimo) {
            stockBadge = '<span class="badge bg-warning text-dark">STOCK BAJO</span>';
        } else {
            stockBadge = '<span class="badge bg-success">OK</span>';
        }

        return `
        <tr>
            <td><strong>${repuesto.codigo}</strong></td>
            <td>${repuesto.nombre}</td>
            <td>${repuesto.marca || '-'}</td>
            <td>${repuesto.categoria?.nombre || '-'}</td>
            <td>${formatearMoneda(repuesto.precioCosto)}</td>
            <td>${formatearMoneda(repuesto.precioVenta)}</td>
            <td>
                ${repuesto.stockActual} ${stockBadge}
            </td>
            <td>
                <span class="badge bg-${repuesto.activo ? 'success' : 'danger'}">
                    ${repuesto.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editarRepuesto(${repuesto.idRepuesto})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                ${repuesto.activo ? `
                <button class="btn btn-sm btn-danger" onclick="desactivarRepuesto(${repuesto.idRepuesto})" title="Desactivar">
                    <i class="fas fa-ban"></i>
                </button>
                ` : `
                <button class="btn btn-sm btn-success" onclick="activarRepuesto(${repuesto.idRepuesto})" title="Activar">
                    <i class="fas fa-check"></i>
                </button>
                `}
            </td>
        </tr>
        `;
    }).join('');
}

// Abrir modal nuevo repuesto
async function openModalRepuesto() {
    repuestoEditando = null;
    document.getElementById('modalRepuestoTitle').innerHTML = '<i class="fas fa-cogs"></i> Nuevo Repuesto';
    document.getElementById('repuestoForm').reset();
    document.getElementById('repuestoId').value = '';
    document.getElementById('unidadMedida').value = 'Unidad';
    // Solo asignar si el campo existe
    const precioVentaInput = document.getElementById('precioVenta');
    if (precioVentaInput) precioVentaInput.value = 0;

    // Limpiar código y hacerlo readonly
    document.getElementById('codigo').value = '';
    document.getElementById('codigo').readOnly = true;
    document.getElementById('codigo').placeholder = 'Seleccione una categoría para generar el código';

    modalRepuesto.show();
}

// Editar repuesto
async function editarRepuesto(id) {
    try {
            const data = await ApiService.get(`/repuestos/${id}`);
        if (data.success) {
            repuestoEditando = data.data;
            document.getElementById('modalRepuestoTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Repuesto';
            document.getElementById('repuestoId').value = repuestoEditando.idRepuesto;
            document.getElementById('codigo').value = repuestoEditando.codigo;
            document.getElementById('codigo').readOnly = true;
            document.getElementById('nombre').value = repuestoEditando.nombre;
            document.getElementById('descripcion').value = repuestoEditando.descripcion || '';
            document.getElementById('marca').value = repuestoEditando.marca || '';
            document.getElementById('modelo').value = repuestoEditando.modelo || '';
            // Establecer categoría por ID
            document.getElementById('categoria').value = repuestoEditando.categoria?.idCategoria || '';
            document.getElementById('unidadMedida').value = repuestoEditando.unidadMedida || 'Unidad';
            document.getElementById('ubicacion').value = repuestoEditando.ubicacion || '';
            const precioVentaInput = document.getElementById('precioVenta');
            if (precioVentaInput) precioVentaInput.value = repuestoEditando.precioVenta || 0;
            const stockMinimoInput = document.getElementById('stockMinimo');
            if (stockMinimoInput) stockMinimoInput.value = repuestoEditando.stockMinimo || 5;
            const stockMaximoInput = document.getElementById('stockMaximo');
            if (stockMaximoInput) stockMaximoInput.value = repuestoEditando.stockMaximo || 100;
            modalRepuesto.show();
        }
    } catch (error) {
        console.error('Error cargando repuesto:', error);
        mostrarError('Error al cargar repuesto');
    }
}

// Guardar repuesto
async function guardarRepuesto() {
    const form = document.getElementById('repuestoForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const idCategoria = document.getElementById('categoria').value;

    const repuesto = {
        codigo: document.getElementById('codigo').value.trim(),
        nombre: document.getElementById('nombre').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim() || null,
        marca: document.getElementById('marca').value.trim() || null,
        modelo: document.getElementById('modelo').value.trim() || null,
        categoria: idCategoria ? { idCategoria: parseInt(idCategoria) } : null,
        unidadMedida: document.getElementById('unidadMedida').value,
        ubicacion: document.getElementById('ubicacion').value.trim() || null,
        precioVenta: parseFloat(document.getElementById('precioVenta').value) || 0,
        stockActual: 0 // Siempre inicializar en 0
    };

    try {
        const id = document.getElementById('repuestoId').value;
        let data;

        if (id) {
                data = await ApiService.request(`/repuestos/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(repuesto)
                });
        } else {
                data = await ApiService.post('/repuestos', repuesto);
        }

        if (data.success) {
            mostrarExito(data.message);
            modalRepuesto.hide();
            cargarRepuestos();
        } else {
            mostrarError(data.message);
        }
    } catch (error) {
        console.error('Error guardando repuesto:', error);
        mostrarError('Error al guardar repuesto');
    }
}

// Abrir modal ajustar stock
// función abrirModalStock eliminada: el ajuste de stock se maneja automáticamente

// Aplicar ajuste de stock
// función aplicarAjusteStock eliminada: el ajuste de stock se maneja automáticamente

// Desactivar repuesto
async function desactivarRepuesto(id) {
    if (!confirm('¿Está seguro de desactivar este repuesto?')) return;

    try {
            const data = await ApiService.request(`/repuestos/${id}`, {
                method: 'DELETE'
            });

        if (data.success) {
            mostrarExito(data.message);
            cargarRepuestos();
        } else {
            mostrarError(data.message);
        }
    } catch (error) {
        console.error('Error desactivando repuesto:', error);
        mostrarError('Error al desactivar repuesto');
    }
}

// Activar repuesto
async function activarRepuesto(id) {
    try {
            const data = await ApiService.request(`/repuestos/${id}/activar`, {
                method: 'PATCH'
            });

        if (data.success) {
            mostrarExito(data.message);
            cargarRepuestos();
        } else {
            mostrarError(data.message);
        }
    } catch (error) {
        console.error('Error activando repuesto:', error);
        mostrarError('Error al activar repuesto');
    }
}

// Búsqueda
function setupBusqueda() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function() {
        const termino = this.value.toLowerCase();
        const filtrados = repuestos.filter(r =>
            r.codigo.toLowerCase().includes(termino) ||
            r.nombre.toLowerCase().includes(termino) ||
            (r.marca && r.marca.toLowerCase().includes(termino)) ||
            (r.categoria && r.categoria.toLowerCase().includes(termino))
        );
        renderizarRepuestos(filtrados);
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

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: 'PYG',
        minimumFractionDigits: 0
    }).format(valor);
}

function mostrarExito(mensaje) {
    alert(mensaje);
}

function mostrarError(mensaje) {
    alert('Error: ' + mensaje);
}
