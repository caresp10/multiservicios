// Verificar autenticación
AuthService.checkAuth();

// Cargar información del usuario
const user = AuthService.getUser();
document.getElementById('userName').textContent = `${user.nombre} ${user.apellido}`;
document.getElementById('userRole').textContent = user.rol;
document.getElementById('userAvatar').textContent = user.nombre.charAt(0);

// Variables globales
let servicios = [];
let categorias = [];
const modal = new bootstrap.Modal(document.getElementById('modalServicio'));
const modalHistorico = new bootstrap.Modal(document.getElementById('modalHistorico'));

// Función de logout
function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        AuthService.logout();
    }
}

// Cargar servicios del catálogo
async function cargarServicios() {
    const table = document.getElementById('serviciosTable');

    try {
        const response = await ServicioCatalogoService.getAll();

        if (response.success && response.data) {
            servicios = response.data;
            renderServicios(servicios);
        } else {
            throw new Error(response.message || 'Error al cargar servicios');
        }
    } catch (error) {
        console.error('Error:', error);
        table.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle"></i> Error al cargar servicios
                </td>
            </tr>
        `;
    }
}

// Renderizar tabla de servicios
function renderServicios(data) {
    const table = document.getElementById('serviciosTable');

    if (data.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i><br>
                    No hay servicios registrados
                </td>
            </tr>
        `;
        return;
    }

    table.innerHTML = data.map(servicio => `
        <tr class="${!servicio.activo ? 'table-secondary' : ''}">
            <td><strong>${servicio.codigo}</strong></td>
            <td>${servicio.nombre}</td>
            <td>${servicio.categoria?.nombre || 'N/A'}</td>
            <td class="text-end">
                <strong>${formatCurrency(servicio.precioBase)}</strong>
            </td>
            <td>
                <span class="badge bg-secondary">${formatUnidadMedida(servicio.unidadMedida)}</span>
            </td>
            <td class="text-center">${servicio.tiempoEstimadoHoras || '-'}</td>
            <td class="text-center">
                ${servicio.incluyeMateriales
                    ? '<i class="fas fa-check text-success" title="Incluye materiales"></i>'
                    : '<i class="fas fa-times text-muted" title="No incluye materiales"></i>'}
            </td>
            <td>
                <span class="badge bg-${servicio.activo ? 'success' : 'secondary'}">
                    ${servicio.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-info"
                        onclick="verHistorico(${servicio.idServicio})"
                        title="Ver histórico de precios">
                    <i class="fas fa-history"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary"
                        onclick="editarServicio(${servicio.idServicio})"
                        title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger"
                        onclick="eliminarServicio(${servicio.idServicio})"
                        title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Filtros
document.getElementById('searchInput').addEventListener('input', aplicarFiltros);
document.getElementById('filterCategoria').addEventListener('change', aplicarFiltros);
document.getElementById('filterEstado').addEventListener('change', aplicarFiltros);

function aplicarFiltros() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoria = document.getElementById('filterCategoria').value;
    const estado = document.getElementById('filterEstado').value;

    let filtered = servicios.filter(servicio => {
        const matchSearch = servicio.codigo.toLowerCase().includes(searchTerm) ||
                          servicio.nombre.toLowerCase().includes(searchTerm);
        const matchCategoria = !categoria || servicio.categoria?.idCategoria == categoria;
        const matchEstado = !estado || servicio.activo.toString() === estado;

        return matchSearch && matchCategoria && matchEstado;
    });

    renderServicios(filtered);
}

// Cargar categorías para el formulario y filtros
async function cargarCategorias() {
    try {
        const response = await CategoriaService.getAll();
        if (response.success && response.data) {
            // Filtrar duplicados por idCategoria
            const categoriasUnicas = response.data.filter((cat, index, self) =>
                index === self.findIndex((c) => c.idCategoria === cat.idCategoria)
            );
            categorias = categoriasUnicas;

            // Llenar select del formulario
            const selectForm = document.getElementById('idCategoria');
            selectForm.innerHTML = '<option value="">Seleccione una categoría</option>' +
                categorias.filter(c => c.activo).map(c =>
                    `<option value="${c.idCategoria}">${c.nombre}</option>`
                ).join('');

            // Llenar select del filtro
            const selectFilter = document.getElementById('filterCategoria');
            selectFilter.innerHTML = '<option value="">Todas las categorías</option>' +
                categorias.map(c =>
                    `<option value="${c.idCategoria}">${c.nombre}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

// Abrir modal para nuevo servicio
function openModalServicio() {
    document.getElementById('formServicio').reset();
    document.getElementById('idServicio').value = '';
    document.getElementById('modalTitleText').textContent = 'Nuevo Servicio';
    document.getElementById('estadoContainer').style.display = 'none';
    document.getElementById('activo').checked = true;
    modal.show();
}

// Editar servicio
async function editarServicio(id) {
    try {
        const response = await ServicioCatalogoService.getById(id);

        if (response.success && response.data) {
            const servicio = response.data;

            document.getElementById('idServicio').value = servicio.idServicio;
            document.getElementById('codigo').value = servicio.codigo;
            document.getElementById('nombre').value = servicio.nombre;
            document.getElementById('descripcion').value = servicio.descripcion || '';
            document.getElementById('idCategoria').value = servicio.categoria?.idCategoria || '';
            document.getElementById('precioBase').value = servicio.precioBase;
            document.getElementById('unidadMedida').value = servicio.unidadMedida;
            document.getElementById('tiempoEstimadoHoras').value = servicio.tiempoEstimadoHoras || '';
            document.getElementById('incluye_materiales').checked = servicio.incluyeMateriales;
            document.getElementById('notasAdicionales').value = servicio.notasAdicionales || '';
            document.getElementById('activo').checked = servicio.activo;

            document.getElementById('modalTitleText').textContent = 'Editar Servicio';
            document.getElementById('estadoContainer').style.display = 'block';
            modal.show();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el servicio');
    }
}

// Guardar servicio (crear o actualizar)
async function guardarServicio() {
    const form = document.getElementById('formServicio');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const idServicio = document.getElementById('idServicio').value;
    const idCategoria = document.getElementById('idCategoria').value;

    if (!idCategoria) {
        alert('Debe seleccionar una categoría');
        return;
    }

    const servicioData = {
        codigo: document.getElementById('codigo').value.trim().toUpperCase(),
        nombre: document.getElementById('nombre').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim() || null,
        categoria: { idCategoria: parseInt(idCategoria) },
        precioBase: parseFloat(document.getElementById('precioBase').value),
        unidadMedida: document.getElementById('unidadMedida').value,
        tiempoEstimadoHoras: parseFloat(document.getElementById('tiempoEstimadoHoras').value) || null,
        incluyeMateriales: document.getElementById('incluye_materiales').checked,
        notasAdicionales: document.getElementById('notasAdicionales').value.trim() || null,
        activo: document.getElementById('activo').checked
    };

    try {
        let response;

        if (idServicio) {
            // Actualizar
            response = await ServicioCatalogoService.update(idServicio, servicioData);
        } else {
            // Crear
            response = await ServicioCatalogoService.create(servicioData);
        }

        if (response.success) {
            alert(idServicio ? 'Servicio actualizado correctamente' : 'Servicio creado correctamente');
            modal.hide();
            cargarServicios();
        } else {
            alert(response.message || 'Error al guardar el servicio');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el servicio');
    }
}

// Eliminar servicio
async function eliminarServicio(id) {
    if (!confirm('¿Está seguro que desea eliminar este servicio?\n\nEsta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await ServicioCatalogoService.delete(id);

        if (response.success) {
            alert('Servicio eliminado correctamente');
            cargarServicios();
        } else {
            alert(response.message || 'Error al eliminar el servicio');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el servicio');
    }
}

// Ver histórico de precios
async function verHistorico(idServicio) {
    const servicio = servicios.find(s => s.idServicio === idServicio);

    if (!servicio) return;

    document.getElementById('historicoServicioNombre').textContent =
        `${servicio.codigo} - ${servicio.nombre}`;

    const table = document.getElementById('historicoTable');
    table.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                <div class="spinner-border spinner-border-sm" role="status"></div>
            </td>
        </tr>
    `;

    modalHistorico.show();

    try {
        const response = await ServicioCatalogoService.getHistorico(idServicio);

        if (response.success && response.data) {
            const historico = response.data;

            if (historico.length === 0) {
                table.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-muted">
                            No hay cambios de precio registrados
                        </td>
                    </tr>
                `;
                return;
            }

            table.innerHTML = historico.map(h => {
                const cambio = h.precioNuevo - h.precioAnterior;
                const porcentaje = ((cambio / h.precioAnterior) * 100).toFixed(2);

                return `
                    <tr>
                        <td>${formatDateTime(h.fechaCambio)}</td>
                        <td class="text-end">${formatCurrency(h.precioAnterior)}</td>
                        <td class="text-end"><strong>${formatCurrency(h.precioNuevo)}</strong></td>
                        <td class="${cambio >= 0 ? 'text-success' : 'text-danger'}">
                            <i class="fas fa-arrow-${cambio >= 0 ? 'up' : 'down'}"></i>
                            ${formatCurrency(Math.abs(cambio))} (${porcentaje}%)
                        </td>
                        <td>${h.usuario?.nombre || 'N/A'}</td>
                        <td>${h.motivo || '-'}</td>
                    </tr>
                `;
            }).join('');
        } else {
            table.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">
                        Error al cargar el histórico
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
        table.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">
                    Error al cargar el histórico
                </td>
            </tr>
        `;
    }
}

// Formatear unidad de medida
function formatUnidadMedida(unidad) {
    const unidades = {
        'SERVICIO': 'Servicio',
        'UNIDAD': 'Unidad',
        'HORA': 'Hora',
        'METRO': 'Metro',
        'METRO_CUADRADO': 'm²',
        'DIA': 'Día',
        'VISITA': 'Visita',
        'KILO': 'Kilo',
        'LITRO': 'Litro',
        'CAJA': 'Caja',
        'ROLLO': 'Rollo',
        'PAR': 'Par'
    };
    return unidades[unidad] || unidad;
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();
    cargarServicios();
});
