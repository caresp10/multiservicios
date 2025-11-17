// Estado global
let compras = [];
let proveedores = [];
let repuestos = [];
let detallesCompra = [];
let modalCompra;
let modalDetalles;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    AuthService.checkAuth();
    displayUserInfo();
    modalCompra = new bootstrap.Modal(document.getElementById('modalCompra'));
    modalDetalles = new bootstrap.Modal(document.getElementById('modalDetalles'));

    cargarCompras();
    cargarProveedores();
    cargarRepuestos();
    setupBusqueda();

    // Establecer fecha actual por defecto
    document.getElementById('fechaCompra').valueAsDate = new Date();

    // Actualizar precio unitario automáticamente al seleccionar un repuesto
    const repuestoSelect = document.getElementById('repuestoSelect');
    if (repuestoSelect) {
        repuestoSelect.addEventListener('change', function() {
            const idRepuesto = parseInt(this.value);
            const repuesto = repuestos.find(r => r.idRepuesto === idRepuesto);
            document.getElementById('precioDetalle').value = repuesto ? repuesto.precioVenta : 0;
        });
    }
});

// Cargar compras
async function cargarCompras() {
    try {
        const data = await ApiService.get('/compras');
        if (data.success) {
            compras = data.data;
            renderizarCompras(compras);
        }
    } catch (error) {
        console.error('Error cargando compras:', error);
        mostrarError('Error al cargar compras');
    }
}

// Cargar proveedores
async function cargarProveedores() {
    try {
        const data = await ApiService.get('/proveedores');
        if (data.success) {
            proveedores = data.data.filter(p => p.activo);
            const select = document.getElementById('proveedor');
            select.innerHTML = '<option value="">Seleccione un proveedor</option>';
            proveedores.forEach(p => {
                select.innerHTML += `<option value="${p.idProveedor}">${p.nombre} - ${p.razonSocial || ''}</option>`;
            });
        }
    } catch (error) {
        console.error('Error cargando proveedores:', error);
    }
}

// Cargar repuestos
async function cargarRepuestos() {
    try {
        const data = await ApiService.get('/repuestos');
        if (data.success) {
            repuestos = data.data.filter(r => r.activo);
            const select = document.getElementById('repuestoSelect');
            select.innerHTML = '<option value="">Seleccione un repuesto</option>';
            repuestos.forEach(r => {
                select.innerHTML += `<option value="${r.idRepuesto}" data-precio="${r.precioCompra}">${r.codigo} - ${r.nombre}</option>`;
            });
        }
    } catch (error) {
        console.error('Error cargando repuestos:', error);
    }
}

// Renderizar compras
function renderizarCompras(lista) {
    const tbody = document.getElementById('comprasTable');
    if (!lista || lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay compras registradas</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(compra => {
        return `
        <tr>
            <td><strong>${compra.numeroCompra}</strong></td>
            <td>${formatearFecha(compra.fechaCompra)}</td>
            <td>${compra.proveedor?.nombre || '-'}</td>
            <td>${compra.numeroFactura || '-'}</td>
            <td>${formatearMoneda(compra.total)}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="verDetalles(${compra.idCompra})" title="Ver Detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminarCompra(${compra.idCompra})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

// Abrir modal nueva compra
function openModalCompra() {
    detallesCompra = [];
    document.getElementById('modalCompraTitle').innerHTML = '<i class="fas fa-shopping-cart"></i> Nueva Compra';
    document.getElementById('compraForm').reset();
    document.getElementById('compraId').value = '';
    document.getElementById('fechaCompra').valueAsDate = new Date();
    document.getElementById('formaPago').value = 'EFECTIVO';
    // Generar número de compra automático
    const fecha = new Date();
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    const secuencia = (compras.length + 1).toString().padStart(4, '0');
    const numeroAuto = `C${yyyy}${mm}${dd}-${secuencia}`;
    document.getElementById('numeroCompra').value = numeroAuto;
    document.getElementById('numeroCompra').readOnly = true;
    renderizarDetallesFormulario();
    modalCompra.show();
}

// Editar compra
async function editarCompra(id) {
    try {
        const data = await ApiService.get(`/compras/${id}`);
        if (data.success) {
            const compra = data.data;
            document.getElementById('modalCompraTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Compra';
            document.getElementById('compraId').value = compra.idCompra;
            document.getElementById('numeroCompra').value = compra.numeroCompra;
            document.getElementById('fechaCompra').value = compra.fechaCompra;
            document.getElementById('proveedor').value = compra.proveedor.idProveedor;
            document.getElementById('numeroFactura').value = compra.numeroFactura || '';
            document.getElementById('formaPago').value = compra.formaPago || 'EFECTIVO';
            document.getElementById('observaciones').value = compra.observaciones || '';

            // Cargar detalles
            detallesCompra = compra.detalles.map(d => ({
                idRepuesto: d.repuesto.idRepuesto,
                nombreRepuesto: d.repuesto.nombre,
                codigoRepuesto: d.repuesto.codigo,
                cantidad: d.cantidad,
                precioUnitario: d.precioUnitario
            }));

            renderizarDetallesFormulario();
            modalCompra.show();
        }
    } catch (error) {
        console.error('Error cargando compra:', error);
        mostrarError('Error al cargar compra');
    }
}

// Agregar detalle
function agregarDetalle() {
    const repuestoSelect = document.getElementById('repuestoSelect');
    const idRepuesto = parseInt(repuestoSelect.value);
    const cantidad = parseInt(document.getElementById('cantidadDetalle').value);
    const precioUnitario = parseFloat(document.getElementById('precioDetalle').value);

    if (!idRepuesto) {
        mostrarError('Debe seleccionar un repuesto');
        return;
    }

    if (!cantidad || cantidad <= 0) {
        mostrarError('La cantidad debe ser mayor a 0');
        return;
    }

    if (precioUnitario < 0) {
        mostrarError('El precio no puede ser negativo');
        return;
    }

    // Verificar si ya existe el repuesto
    const existe = detallesCompra.find(d => d.idRepuesto === idRepuesto);
    if (existe) {
        mostrarError('El repuesto ya está en la lista');
        return;
    }

    const selectedOption = repuestoSelect.options[repuestoSelect.selectedIndex];
    const nombreRepuesto = selectedOption.text;
    const codigoRepuesto = repuestos.find(r => r.idRepuesto === idRepuesto)?.codigo || '';

    detallesCompra.push({
        idRepuesto,
        nombreRepuesto,
        codigoRepuesto,
        cantidad,
        precioUnitario
    });

    // Limpiar campos
    repuestoSelect.value = '';
    document.getElementById('cantidadDetalle').value = 1;
    document.getElementById('precioDetalle').value = 0;

    renderizarDetallesFormulario();
}

// Eliminar detalle
function eliminarDetalle(index) {
    detallesCompra.splice(index, 1);
    renderizarDetallesFormulario();
}

// Renderizar detalles en el formulario
function renderizarDetallesFormulario() {
    const tbody = document.getElementById('detallesTable');

    if (detallesCompra.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay repuestos agregados</td></tr>';
        document.getElementById('subtotalCompra').textContent = 'Gs. 0';
        document.getElementById('ivaCompra').textContent = 'Gs. 0';
        document.getElementById('totalCompra').textContent = 'Gs. 0';
        return;
    }

    tbody.innerHTML = detallesCompra.map((detalle, index) => {
        const subtotal = detalle.cantidad * detalle.precioUnitario;
        return `
        <tr>
            <td>${detalle.nombreRepuesto}</td>
            <td>${detalle.cantidad}</td>
            <td>${formatearMoneda(detalle.precioUnitario)}</td>
            <td>${formatearMoneda(subtotal)}</td>
            <td>
                <button type="button" class="btn btn-sm btn-danger" onclick="eliminarDetalle(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');

    // Calcular totales
    const subtotal = detallesCompra.reduce((sum, d) => sum + (d.cantidad * d.precioUnitario), 0);
    const iva = subtotal * 0.10;
    const total = subtotal + iva;

    document.getElementById('subtotalCompra').textContent = formatearMoneda(subtotal);
    document.getElementById('ivaCompra').textContent = formatearMoneda(iva);
    document.getElementById('totalCompra').textContent = formatearMoneda(total);
}

// Cuando cambie el repuesto, actualizar el precio
document.addEventListener('DOMContentLoaded', function() {
    const repuestoSelect = document.getElementById('repuestoSelect');
    repuestoSelect?.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const precio = selectedOption.getAttribute('data-precio') || 0;
        document.getElementById('precioDetalle').value = precio;
    });
});

// Guardar compra
async function guardarCompra() {
    const form = document.getElementById('compraForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    if (detallesCompra.length === 0) {
        mostrarError('Debe agregar al menos un repuesto');
        return;
    }

    const compra = {
        numero: document.getElementById('numeroCompra').value.trim(),
        fecha: document.getElementById('fechaCompra').value || null, // yyyy-MM-dd
        proveedorId: parseInt(document.getElementById('proveedor').value),
        numeroFactura: document.getElementById('numeroFactura').value.trim() || null,
        formaPago: document.getElementById('formaPago').value,
        observaciones: document.getElementById('observaciones').value.trim() || null,
        detalles: detallesCompra.map(d => ({
            repuestoId: d.idRepuesto,
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
            subtotal: d.cantidad * d.precioUnitario
        }))
    };

    try {
        const id = document.getElementById('compraId').value;
        let data;

        if (id) {
            data = await ApiService.request(`/compras/${id}`, {
                method: 'PUT',
                body: JSON.stringify(compra)
            });
        } else {
            data = await ApiService.post('/compras', compra);
        }

        if (data.success) {
            mostrarExito(data.message);
            modalCompra.hide();
            cargarCompras();
        } else {
            // Si hay errores de validación, mostrar todos
            if (data.errors && Array.isArray(data.errors)) {
                mostrarError(data.errors.map(e => e.message || e).join('\n'));
            } else {
                mostrarError(data.message);
            }
        }
    } catch (error) {
        console.error('Error guardando compra:', error);
        mostrarError('Error al guardar compra');
    }
}

// Ver detalles
async function verDetalles(id) {
    try {
        const data = await ApiService.get(`/compras/${id}`);
        if (data.success) {
            const compra = data.data;

            document.getElementById('detalleNumero').textContent = compra.numeroCompra;
            document.getElementById('detalleFecha').textContent = formatearFecha(compra.fechaCompra);
            document.getElementById('detalleProveedor').textContent = compra.proveedor?.nombre || '-';
            document.getElementById('detalleFactura').textContent = compra.numeroFactura || '-';

            const tbody = document.getElementById('detallesVerTable');
            tbody.innerHTML = compra.detalles.map(detalle => `
                <tr>
                    <td>${detalle.repuesto.nombre}</td>
                    <td>${detalle.cantidad}</td>
                    <td>${formatearMoneda(detalle.precioUnitario)}</td>
                    <td>${formatearMoneda(detalle.subtotal)}</td>
                </tr>
            `).join('');

            document.getElementById('detalleTotal').textContent = formatearMoneda(compra.total);

            modalDetalles.show();
        }
    } catch (error) {
        console.error('Error cargando detalles:', error);
        mostrarError('Error al cargar detalles');
    }
}

// Eliminar compra
async function eliminarCompra(id) {
    if (!confirm('¿Está seguro de eliminar esta compra?')) return;

    try {
        const data = await ApiService.request(`/compras/${id}`, {
            method: 'DELETE'
        });

        if (data.success) {
            mostrarExito(data.message);
            cargarCompras();
        } else {
            mostrarError(data.message);
        }
    } catch (error) {
        console.error('Error eliminando compra:', error);
        mostrarError('Error al eliminar compra');
    }
}

// Búsqueda
function setupBusqueda() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function() {
        const termino = this.value.toLowerCase();
        const filtrados = compras.filter(c =>
            c.numeroCompra.toLowerCase().includes(termino) ||
            (c.numeroFactura && c.numeroFactura.toLowerCase().includes(termino)) ||
            (c.proveedor && c.proveedor.nombre.toLowerCase().includes(termino))
        );
        renderizarCompras(filtrados);
    });
}

// Utilidades
function displayUserInfo() {
    const user = AuthService.getUser();
    if (user) {
        document.getElementById('userName').textContent = user.nombre;
        document.getElementById('userRole').textContent = user.rol;
        document.getElementById('userAvatar').textContent = user.nombre.charAt(0).toUpperCase();
        // Mostrar token y rol para depuración
        const infoDiv = document.createElement('div');
        infoDiv.style.fontSize = '0.8em';
        infoDiv.style.wordBreak = 'break-all';
        infoDiv.className = 'text-muted mt-2';
        infoDiv.innerHTML = `<strong>Token:</strong> ${AuthService.getToken() || '-'}<br><strong>Rol:</strong> ${user.rol}`;
        document.querySelector('.user-info').appendChild(infoDiv);
    }
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: 'PYG',
        minimumFractionDigits: 0
    }).format(valor);
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    const d = new Date(fecha + 'T00:00:00');
    return d.toLocaleDateString('es-PY');
}

function mostrarExito(mensaje) {
    alert(mensaje);
}

function mostrarError(mensaje) {
    alert('Error: ' + mensaje);
}
