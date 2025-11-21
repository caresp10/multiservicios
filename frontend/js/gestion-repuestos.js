// Verificar autenticación
AuthService.checkAuth();

// Cargar información del usuario
const user = AuthService.getUser();
document.getElementById('userName').textContent = `${user.nombre} ${user.apellido}`;
document.getElementById('userRole').textContent = user.rol;
document.getElementById('userAvatar').textContent = user.nombre.charAt(0);

// Variables globales
let repuestos = [];
let categorias = [];
let proveedores = [];
const modal = new bootstrap.Modal(document.getElementById('modalRepuesto'));

// Función de logout
function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        AuthService.logout();
    }
}

// Cargar repuestos
async function cargarRepuestos() {
    const table = document.getElementById('repuestosTable');

    try {
        const response = await RepuestoService.getAll();

        if (response.success && response.data) {
            repuestos = response.data;
            renderRepuestos(repuestos);
            mostrarAlertasStock();
        } else {
            throw new Error(response.message || 'Error al cargar repuestos');
        }
    } catch (error) {
        console.error('Error:', error);
        table.innerHTML = `
            <tr>
                <td colspan="11" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle"></i> Error al cargar repuestos
                </td>
            </tr>
        `;
    }
}

// Renderizar tabla de repuestos
function renderRepuestos(data) {
    const table = document.getElementById('repuestosTable');

    if (data.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="11" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i><br>
                    No hay repuestos registrados
                </td>
            </tr>
        `;
        return;
    }

    table.innerHTML = data.map(repuesto => {
        const stockClass = getStockClass(repuesto);
        return `
        <tr class="${stockClass}">
            <td><strong>${repuesto.codigo}</strong></td>
            <td>${repuesto.nombre}</td>
            <td>${repuesto.categoria?.nombre || 'N/A'}</td>
            <td class="text-end">${formatCurrency(repuesto.precioCosto)}</td>
            <td class="text-end"><strong>${formatCurrency(repuesto.precioVenta)}</strong></td>
            <td class="text-center">
                <span class="badge ${getMargenClass(repuesto.margenGanancia)}">
                    ${repuesto.margenGanancia ? repuesto.margenGanancia.toFixed(2) + '%' : 'N/A'}
                </span>
            </td>
            <td class="text-center">
                <strong>${repuesto.stockActual}</strong>
                ${repuesto.stockActual <= repuesto.stockMinimo ?
                    '<i class="fas fa-exclamation-triangle text-danger ms-1" title="Stock bajo"></i>' : ''}
            </td>
            <td class="text-center text-muted">
                <small>${repuesto.stockMinimo}/${repuesto.stockMaximo}</small>
            </td>
            <td>${repuesto.ubicacion || '-'}</td>
            <td>
                <span class="badge bg-${repuesto.activo ? 'success' : 'secondary'}">
                    ${repuesto.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary"
                        onclick="editarRepuesto(${repuesto.idRepuesto})"
                        title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger"
                        onclick="eliminarRepuesto(${repuesto.idRepuesto})"
                        title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `}).join('');
}

// Obtener clase de stock
function getStockClass(repuesto) {
    if (repuesto.stockActual === 0) return 'stock-critico';
    if (repuesto.stockActual <= repuesto.stockMinimo) return 'stock-bajo';
    return '';
}

// Obtener clase de margen
function getMargenClass(margen) {
    if (!margen) return 'bg-secondary';
    if (margen < 15) return 'bg-danger';
    if (margen < 30) return 'bg-warning';
    return 'bg-success';
}

// Mostrar alertas de stock bajo
function mostrarAlertasStock() {
    const repuestosBajo = repuestos.filter(r => r.stockActual <= r.stockMinimo && r.activo);
    const alertasContainer = document.getElementById('alertasStock');

    if (repuestosBajo.length === 0) {
        alertasContainer.innerHTML = '';
        return;
    }

    alertasContainer.innerHTML = `
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
            <i class="fas fa-exclamation-triangle"></i>
            <strong>Atención:</strong> Hay ${repuestosBajo.length} repuesto(s) con stock bajo.
            <button class="btn btn-sm btn-warning ms-2" onclick="verStockBajo()">
                Ver Detalles
            </button>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

// Ver stock bajo
function verStockBajo() {
    const repuestosBajo = repuestos.filter(r => r.stockActual <= r.stockMinimo && r.activo);
    document.getElementById('filterStock').value = 'bajo';
    aplicarFiltros();
}

// Filtros
document.getElementById('searchInput').addEventListener('input', aplicarFiltros);
document.getElementById('filterCategoria').addEventListener('change', aplicarFiltros);
document.getElementById('filterStock').addEventListener('change', aplicarFiltros);
document.getElementById('filterEstado').addEventListener('change', aplicarFiltros);

function aplicarFiltros() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoria = document.getElementById('filterCategoria').value;
    const stock = document.getElementById('filterStock').value;
    const estado = document.getElementById('filterEstado').value;

    let filtered = repuestos.filter(repuesto => {
        const matchSearch = repuesto.codigo.toLowerCase().includes(searchTerm) ||
                          repuesto.nombre.toLowerCase().includes(searchTerm);
        const matchCategoria = !categoria || repuesto.categoria?.idCategoria == categoria;
        const matchEstado = !estado || repuesto.activo.toString() === estado;

        let matchStock = true;
        if (stock === 'bajo') {
            matchStock = repuesto.stockActual <= repuesto.stockMinimo;
        } else if (stock === 'sin') {
            matchStock = repuesto.stockActual === 0;
        }

        return matchSearch && matchCategoria && matchStock && matchEstado;
    });

    renderRepuestos(filtered);
}

// Cargar categorías
async function cargarCategorias() {
    try {
        const response = await CategoriaService.getAll();
        if (response.success && response.data) {
            const categoriasUnicas = response.data.filter((cat, index, self) =>
                index === self.findIndex((c) => c.idCategoria === cat.idCategoria)
            );
            categorias = categoriasUnicas;

            const selectForm = document.getElementById('idCategoria');
            selectForm.innerHTML = '<option value="">Seleccione categoría</option>' +
                categorias.filter(c => c.activo).map(c =>
                    `<option value="${c.idCategoria}">${c.nombre}</option>`
                ).join('');

            const selectFilter = document.getElementById('filterCategoria');
            selectFilter.innerHTML = '<option value="">Todas las categorías</option>' +
                categorias.map(c =>
                    `<option value="${c.idCategoria}">${c.nombre}</option>`
                ).join('');

            // Agregar event listener para generar código automático
            selectForm.addEventListener('change', async function() {
                const idCategoria = this.value;
                const idRepuesto = document.getElementById('idRepuesto').value;

                // Solo generar código si es un nuevo repuesto (no edición)
                if (idCategoria && !idRepuesto) {
                    await generarCodigoAutomatico(idCategoria);
                } else if (!idCategoria && !idRepuesto) {
                    // Si no hay categoría seleccionada, limpiar código
                    document.getElementById('codigo').value = '';
                }
            });

            // Agregar event listener para botón de regenerar código
            document.getElementById('btnRefreshCodigo')?.addEventListener('click', async function() {
                const idCategoria = document.getElementById('idCategoria').value;
                const idRepuesto = document.getElementById('idRepuesto').value;

                if (idCategoria && !idRepuesto) {
                    await generarCodigoAutomatico(idCategoria);
                } else if (!idCategoria) {
                    alert('Seleccione una categoría primero');
                }
            });
        }
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

// Generar código automático basado en categoría
async function generarCodigoAutomatico(idCategoria) {
    const codigoInput = document.getElementById('codigo');

    try {
        // Mostrar indicador de carga
        codigoInput.value = 'Generando...';

        const response = await fetch(`${CONFIG.API_URL}/repuestos/generar-codigo/${idCategoria}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${AuthService.getToken()}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success && result.data) {
            codigoInput.value = result.data;
            codigoInput.readOnly = true;
        } else {
            console.error('Error generando código:', result.message);
            // Si falla, permitir ingreso manual
            codigoInput.value = '';
            codigoInput.readOnly = false;
            codigoInput.placeholder = 'Ingrese código manualmente';
            alert('No se pudo generar el código automáticamente. Puede ingresarlo manualmente.');
        }
    } catch (error) {
        console.error('Error:', error);
        // Si falla, permitir ingreso manual
        codigoInput.value = '';
        codigoInput.readOnly = false;
        codigoInput.placeholder = 'Ingrese código manualmente';
    }
}

// Calcular margen automáticamente
document.getElementById('precioCosto').addEventListener('input', calcularMargen);
document.getElementById('precioVenta').addEventListener('input', calcularMargen);

function calcularMargen() {
    const costo = parseFloat(document.getElementById('precioCosto').value) || 0;
    const venta = parseFloat(document.getElementById('precioVenta').value) || 0;
    const margenInput = document.getElementById('margenCalculado');

    if (costo > 0) {
        const margen = ((venta - costo) / costo * 100).toFixed(2);
        margenInput.value = margen + '%';
    } else {
        margenInput.value = '';
    }
}

// Abrir modal para nuevo repuesto
function openModalRepuesto() {
    document.getElementById('formRepuesto').reset();
    document.getElementById('idRepuesto').value = '';
    document.getElementById('modalTitleText').textContent = 'Nuevo Repuesto';
    document.getElementById('estadoContainer').style.display = 'none';
    document.getElementById('activo').checked = true;
    document.getElementById('margenCalculado').value = '';

    // Configurar campo código para nuevo repuesto
    const codigoInput = document.getElementById('codigo');
    codigoInput.value = '';
    codigoInput.readOnly = true;
    codigoInput.placeholder = 'Se genera automáticamente';

    // Mostrar botón de regenerar
    const btnRefresh = document.getElementById('btnRefreshCodigo');
    if (btnRefresh) btnRefresh.style.display = 'block';

    modal.show();
}

// Editar repuesto
async function editarRepuesto(id) {
    try {
        const response = await RepuestoService.getById(id);

        if (response.success && response.data) {
            const repuesto = response.data;

            document.getElementById('idRepuesto').value = repuesto.idRepuesto;
            document.getElementById('idCategoria').value = repuesto.categoria?.idCategoria || '';
            document.getElementById('codigo').value = repuesto.codigo;
            document.getElementById('nombre').value = repuesto.nombre;
            document.getElementById('descripcion').value = repuesto.descripcion || '';
            document.getElementById('marca').value = repuesto.marca || '';
            document.getElementById('modelo').value = repuesto.modelo || '';
            document.getElementById('unidadMedida').value = repuesto.unidadMedida || 'UNIDAD';
            document.getElementById('ubicacion').value = repuesto.ubicacion || '';
            document.getElementById('precioCosto').value = repuesto.precioCosto || 0;
            document.getElementById('precioVenta').value = repuesto.precioVenta || 0;
            document.getElementById('stockActual').value = repuesto.stockActual || 0;
            document.getElementById('stockMinimo').value = repuesto.stockMinimo || 10;
            document.getElementById('stockMaximo').value = repuesto.stockMaximo || 100;
            document.getElementById('puntoReorden').value = repuesto.puntoReorden || '';
            document.getElementById('idProveedor').value = repuesto.proveedor?.idProveedor || '';
            document.getElementById('activo').checked = repuesto.activo;

            // En modo edición, el código no se puede cambiar
            const codigoInput = document.getElementById('codigo');
            codigoInput.readOnly = true;
            codigoInput.placeholder = '';

            // Ocultar botón de regenerar en modo edición
            const btnRefresh = document.getElementById('btnRefreshCodigo');
            if (btnRefresh) btnRefresh.style.display = 'none';

            calcularMargen();

            document.getElementById('modalTitleText').textContent = 'Editar Repuesto';
            document.getElementById('estadoContainer').style.display = 'block';
            modal.show();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el repuesto');
    }
}

// Guardar repuesto
async function guardarRepuesto() {
    const form = document.getElementById('formRepuesto');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const idRepuesto = document.getElementById('idRepuesto').value;
    const idCategoria = document.getElementById('idCategoria').value;
    const idProveedor = document.getElementById('idProveedor').value;

    const repuestoData = {
        codigo: document.getElementById('codigo').value.trim().toUpperCase(),
        nombre: document.getElementById('nombre').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim() || null,
        categoria: idCategoria ? { idCategoria: parseInt(idCategoria) } : null,
        marca: document.getElementById('marca').value.trim() || null,
        modelo: document.getElementById('modelo').value.trim() || null,
        unidadMedida: document.getElementById('unidadMedida').value,
        ubicacion: document.getElementById('ubicacion').value.trim() || null,
        precioCosto: parseFloat(document.getElementById('precioCosto').value) || 0,
        precioVenta: parseFloat(document.getElementById('precioVenta').value) || 0,
        stockActual: parseInt(document.getElementById('stockActual').value) || 0,
        stockMinimo: parseInt(document.getElementById('stockMinimo').value) || 10,
        stockMaximo: parseInt(document.getElementById('stockMaximo').value) || 100,
        puntoReorden: parseInt(document.getElementById('puntoReorden').value) || null,
        proveedor: idProveedor ? { idProveedor: parseInt(idProveedor) } : null,
        activo: document.getElementById('activo').checked
    };

    try {
        let response;

        if (idRepuesto) {
            response = await RepuestoService.update(idRepuesto, repuestoData);
        } else {
            response = await RepuestoService.create(repuestoData);
        }

        if (response.success) {
            alert(idRepuesto ? 'Repuesto actualizado correctamente' : 'Repuesto creado correctamente');
            modal.hide();
            cargarRepuestos();
        } else {
            alert(response.message || 'Error al guardar el repuesto');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el repuesto');
    }
}

// Eliminar repuesto
async function eliminarRepuesto(id) {
    if (!confirm('¿Está seguro que desea eliminar este repuesto?')) {
        return;
    }

    try {
        const response = await RepuestoService.delete(id);

        if (response.success) {
            alert('Repuesto eliminado correctamente');
            cargarRepuestos();
        } else {
            alert(response.message || 'Error al eliminar el repuesto');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el repuesto');
    }
}

// Cargar proveedores
async function cargarProveedores() {
    try {
        const response = await ProveedorService.getAll();
        if (response.success && response.data) {
            proveedores = response.data;

            const selectProveedor = document.getElementById('idProveedor');
            selectProveedor.innerHTML = '<option value="">Seleccione proveedor</option>' +
                proveedores.filter(p => p.activo).map(p =>
                    `<option value="${p.idProveedor}">${p.nombre}${p.telefono ? ' - ' + p.telefono : ''}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error cargando proveedores:', error);
    }
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();
    cargarProveedores();
    cargarRepuestos();
});
