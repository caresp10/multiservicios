// Verificar autenticación
AuthService.checkAuth();

const user = AuthService.getUser();
document.getElementById('userName').textContent = `${user.nombre} ${user.apellido}`;
document.getElementById('userRole').textContent = user.rol;
document.getElementById('userAvatar').textContent = user.nombre.charAt(0);

if (user.rol !== 'ADMIN') {
    document.getElementById('menuUsuarios').style.display = 'none';
}

document.getElementById('sidebarToggle')?.addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
});

function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        AuthService.logout();
    }
}

// Establecer fechas por defecto (último mes)
const hoy = new Date();
const hace30Dias = new Date();
hace30Dias.setDate(hoy.getDate() - 30);

document.getElementById('fechaInicio').value = hace30Dias.toISOString().split('T')[0];
document.getElementById('fechaFin').value = hoy.toISOString().split('T')[0];

async function cargarReportes() {
    try {
        // Cargar datos en paralelo
        const [pedidosRes, ordenesRes, facturasRes, clientesRes, repuestosRes] = await Promise.all([
            PedidoService.getAll(),
            OrdenTrabajoService.getAll(),
            FacturaService.getAll(),
            ClienteService.getAll(),
            RepuestoService.getAll()
        ]);

        const pedidos = pedidosRes.success ? pedidosRes.data : [];
        const ordenes = ordenesRes.success ? ordenesRes.data : [];
        const facturas = facturasRes.success ? facturasRes.data : [];
        const clientes = clientesRes.success ? clientesRes.data : [];
        const repuestos = repuestosRes.success ? repuestosRes.data : [];

        // TAB 1: Resumen General
        actualizarEstadisticasGenerales(pedidos, ordenes, facturas);
        renderPedidosPorEstado(pedidos);
        renderOrdenesPorEstado(ordenes);
        renderFacturasPorEstado(facturas);
        renderTopClientes(pedidos, clientes);

        // TAB 2: Stock y Márgenes
        await cargarReportesStock();
        renderAnalisisMargenes(repuestos);

        // TAB 3: Ventas
        renderReportesVentas(facturas);

    } catch (error) {
        console.error('Error cargando reportes:', error);
        alert('Error al cargar los reportes');
    }
}

function actualizarEstadisticasGenerales(pedidos, ordenes, facturas) {
    // Total de pedidos
    document.getElementById('totalPedidos').textContent = pedidos.length;

    // Pedidos completados
    const completados = pedidos.filter(p => p.estado === 'COMPLETADO').length;
    document.getElementById('pedidosCompletados').textContent = completados;

    // Órdenes activas
    const activas = ordenes.filter(o =>
        o.estado === 'ABIERTA' || o.estado === 'ASIGNADA' || o.estado === 'EN_PROCESO'
    ).length;
    document.getElementById('ordenesActivas').textContent = activas;

    // Total facturado
    const totalFacturado = facturas
        .filter(f => f.estado === 'PAGADA')
        .reduce((sum, f) => sum + (f.total || 0), 0);
    document.getElementById('totalFacturado').textContent = formatMoney(totalFacturado);
}

function renderPedidosPorEstado(pedidos) {
    const estados = {};
    pedidos.forEach(p => {
        estados[p.estado] = (estados[p.estado] || 0) + 1;
    });

    const total = pedidos.length;
    const table = document.getElementById('pedidosPorEstadoTable');

    if (total === 0) {
        table.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Sin datos</td></tr>';
        return;
    }

    table.innerHTML = Object.entries(estados).map(([estado, cantidad]) => `
        <tr>
            <td><span class="badge badge-estado badge-${getEstadoPedidoClass(estado)}">${formatEstadoPedido(estado)}</span></td>
            <td class="text-end"><strong>${cantidad}</strong></td>
            <td class="text-end">${((cantidad / total) * 100).toFixed(1)}%</td>
        </tr>
    `).join('');
}

function renderOrdenesPorEstado(ordenes) {
    const estados = {};
    ordenes.forEach(o => {
        estados[o.estado] = (estados[o.estado] || 0) + 1;
    });

    const total = ordenes.length;
    const table = document.getElementById('ordenesPorEstadoTable');

    if (total === 0) {
        table.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Sin datos</td></tr>';
        return;
    }

    table.innerHTML = Object.entries(estados).map(([estado, cantidad]) => `
        <tr>
            <td><span class="badge badge-estado badge-${getEstadoOrdenClass(estado)}">${formatEstadoOrden(estado)}</span></td>
            <td class="text-end"><strong>${cantidad}</strong></td>
            <td class="text-end">${((cantidad / total) * 100).toFixed(1)}%</td>
        </tr>
    `).join('');
}

function renderFacturasPorEstado(facturas) {
    const estados = {};
    facturas.forEach(f => {
        if (!estados[f.estado]) {
            estados[f.estado] = { cantidad: 0, total: 0 };
        }
        estados[f.estado].cantidad++;
        estados[f.estado].total += f.total || 0;
    });

    const table = document.getElementById('facturasPorEstadoTable');

    if (facturas.length === 0) {
        table.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Sin datos</td></tr>';
        return;
    }

    table.innerHTML = Object.entries(estados).map(([estado, data]) => `
        <tr>
            <td><span class="badge bg-${getEstadoFacturaColor(estado)}">${formatEstadoFactura(estado)}</span></td>
            <td class="text-end"><strong>${data.cantidad}</strong></td>
            <td class="text-end"><strong>${formatMoney(data.total)}</strong></td>
        </tr>
    `).join('');
}

function renderTopClientes(pedidos, clientes) {
    const clientesPedidos = {};

    pedidos.forEach(p => {
        if (p.cliente && p.cliente.idCliente) {
            const id = p.cliente.idCliente;
            if (!clientesPedidos[id]) {
                clientesPedidos[id] = {
                    nombre: `${p.cliente.nombre} ${p.cliente.apellido || ''}`,
                    count: 0
                };
            }
            clientesPedidos[id].count++;
        }
    });

    const top10 = Object.values(clientesPedidos)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const table = document.getElementById('topClientesTable');

    if (top10.length === 0) {
        table.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Sin datos</td></tr>';
        return;
    }

    table.innerHTML = top10.map((cliente, index) => `
        <tr>
            <td><strong>${index + 1}</strong></td>
            <td>${cliente.nombre}</td>
            <td class="text-end"><span class="badge bg-primary">${cliente.count}</span></td>
        </tr>
    `).join('');
}

// Funciones auxiliares de formato
function formatMoney(amount) {
    return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: 'PYG',
        minimumFractionDigits: 0
    }).format(amount || 0);
}

function formatEstadoPedido(estado) {
    const estados = {
        'NUEVO': 'Nuevo',
        'EN_PROCESO': 'En Proceso',
        'COMPLETADO': 'Completado',
        'CANCELADO': 'Cancelado'
    };
    return estados[estado] || estado;
}

function getEstadoPedidoClass(estado) {
    const classes = {
        'NUEVO': 'nuevo',
        'EN_PROCESO': 'en-proceso',
        'COMPLETADO': 'completado',
        'CANCELADO': 'cancelado'
    };
    return classes[estado] || 'nuevo';
}

function formatEstadoOrden(estado) {
    const estados = {
        'ABIERTA': 'Abierta',
        'ASIGNADA': 'Asignada',
        'EN_PROCESO': 'En Proceso',
        'TERMINADA': 'Terminada',
        'CANCELADA': 'Cancelada'
    };
    return estados[estado] || estado;
}

function getEstadoOrdenClass(estado) {
    const classes = {
        'ABIERTA': 'nuevo',
        'ASIGNADA': 'en-proceso',
        'EN_PROCESO': 'en-proceso',
        'TERMINADA': 'completado',
        'CANCELADA': 'cancelado'
    };
    return classes[estado] || 'nuevo';
}

function formatEstadoFactura(estado) {
    const estados = {
        'PENDIENTE': 'Pendiente',
        'PAGADA': 'Pagada',
        'VENCIDA': 'Vencida',
        'ANULADA': 'Anulada'
    };
    return estados[estado] || estado;
}

function getEstadoFacturaColor(estado) {
    const colors = {
        'PENDIENTE': 'warning',
        'PAGADA': 'success',
        'VENCIDA': 'danger',
        'ANULADA': 'secondary'
    };
    return colors[estado] || 'secondary';
}

// ========================================
// TAB 2: STOCK Y MÁRGENES
// ========================================

async function cargarReportesStock() {
    try {
        // Cargar stock bajo y stock crítico en paralelo
        const [stockBajoRes, stockCriticoRes] = await Promise.all([
            fetch(`${API_URL}/repuestos/stock-bajo`, {
                headers: { 'Authorization': `Bearer ${AuthService.getToken()}` }
            }),
            fetch(`${API_URL}/repuestos/sin-stock`, {
                headers: { 'Authorization': `Bearer ${AuthService.getToken()}` }
            })
        ]);

        const stockBajoData = await stockBajoRes.json();
        const stockCriticoData = await stockCriticoRes.json();

        const stockBajo = stockBajoData.success ? stockBajoData.data : [];
        const stockCritico = stockCriticoData.success ? stockCriticoData.data : [];

        renderStockBajo(stockBajo);
        renderStockCritico(stockCritico);

    } catch (error) {
        console.error('Error cargando reportes de stock:', error);
    }
}

function renderStockBajo(repuestos) {
    const table = document.getElementById('stockBajoTable');

    if (repuestos.length === 0) {
        table.innerHTML = '<tr><td colspan="6" class="text-center text-success"><i class="fas fa-check-circle"></i> ¡No hay repuestos con stock bajo!</td></tr>';
        return;
    }

    table.innerHTML = repuestos.map(r => {
        let badge = '';
        if (r.stockActual === 0) {
            badge = '<span class="badge bg-danger">SIN STOCK</span>';
        } else if (r.stockActual <= r.stockMinimo) {
            badge = '<span class="badge bg-danger">CRÍTICO</span>';
        } else if (r.stockActual <= r.puntoReorden) {
            badge = '<span class="badge bg-warning">BAJO</span>';
        }

        return `
            <tr>
                <td><strong>${r.codigo}</strong></td>
                <td>${r.nombre}</td>
                <td class="text-end"><strong>${r.stockActual}</strong></td>
                <td class="text-end">${r.stockMinimo || 0}</td>
                <td class="text-end">${r.puntoReorden || 0}</td>
                <td>${badge}</td>
            </tr>
        `;
    }).join('');
}

function renderStockCritico(repuestos) {
    const table = document.getElementById('stockCriticoTable');

    if (repuestos.length === 0) {
        table.innerHTML = '<tr><td colspan="6" class="text-center text-success"><i class="fas fa-check-circle"></i> ¡Todos los repuestos tienen stock!</td></tr>';
        return;
    }

    table.innerHTML = repuestos.map(r => `
        <tr class="table-danger">
            <td><strong>${r.codigo}</strong></td>
            <td>${r.nombre}</td>
            <td>${r.marca || '-'}</td>
            <td>${r.modelo || '-'}</td>
            <td class="text-end">${r.puntoReorden || 0}</td>
            <td>${r.proveedor || 'Sin proveedor'}</td>
        </tr>
    `).join('');
}

function renderAnalisisMargenes(repuestos) {
    const table = document.getElementById('margenesTable');

    // Filtrar solo repuestos activos con precios definidos
    const repuestosConMargen = repuestos
        .filter(r => r.activo && r.precioCosto > 0 && r.precioVenta > 0)
        .map(r => {
            const margenGs = r.precioVenta - r.precioCosto;
            const margenPorcentaje = ((margenGs / r.precioCosto) * 100).toFixed(2);
            return { ...r, margenGs, margenPorcentaje };
        })
        .sort((a, b) => b.margenPorcentaje - a.margenPorcentaje);

    if (repuestosConMargen.length === 0) {
        table.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay datos de márgenes disponibles</td></tr>';
        return;
    }

    table.innerHTML = repuestosConMargen.map(r => {
        let rentabilidadBadge = '';
        if (r.margenPorcentaje >= 50) {
            rentabilidadBadge = '<span class="badge bg-success">Alta</span>';
        } else if (r.margenPorcentaje >= 25) {
            rentabilidadBadge = '<span class="badge bg-primary">Media</span>';
        } else if (r.margenPorcentaje >= 10) {
            rentabilidadBadge = '<span class="badge bg-warning">Baja</span>';
        } else {
            rentabilidadBadge = '<span class="badge bg-danger">Muy Baja</span>';
        }

        return `
            <tr>
                <td><strong>${r.codigo}</strong></td>
                <td>${r.nombre}</td>
                <td class="text-end">${formatMoney(r.precioCosto)}</td>
                <td class="text-end">${formatMoney(r.precioVenta)}</td>
                <td class="text-end text-success"><strong>${formatMoney(r.margenGs)}</strong></td>
                <td class="text-end"><strong>${r.margenPorcentaje}%</strong></td>
                <td>${rentabilidadBadge}</td>
            </tr>
        `;
    }).join('');
}

// ========================================
// TAB 3: VENTAS
// ========================================

function renderReportesVentas(facturas) {
    // Filtrar solo facturas PAGADAS para análisis de ventas
    const facturasPagadas = facturas.filter(f => f.estado === 'PAGADA');

    // Analizar items de las facturas
    const serviciosVendidos = {};
    const repuestosVendidos = {};
    const categoriaServicios = {};

    let totalServicios = 0;
    let totalRepuestos = 0;

    facturasPagadas.forEach(factura => {
        if (factura.items && Array.isArray(factura.items)) {
            factura.items.forEach(item => {
                const subtotal = item.subtotal || (item.cantidad * item.precioUnitario);

                if (item.tipoItem === 'SERVICIO' && item.servicio) {
                    const idServicio = item.servicio.idServicio;
                    const nombreServicio = item.servicio.nombre || item.descripcion;
                    const categoria = item.servicio.categoria?.nombre || 'Sin categoría';

                    if (!serviciosVendidos[idServicio]) {
                        serviciosVendidos[idServicio] = {
                            nombre: nombreServicio,
                            cantidad: 0,
                            total: 0,
                            categoria: categoria
                        };
                    }
                    serviciosVendidos[idServicio].cantidad += item.cantidad;
                    serviciosVendidos[idServicio].total += subtotal;
                    totalServicios += subtotal;

                    // Agrupar por categoría
                    if (!categoriaServicios[categoria]) {
                        categoriaServicios[categoria] = { cantidad: 0, total: 0 };
                    }
                    categoriaServicios[categoria].cantidad += item.cantidad;
                    categoriaServicios[categoria].total += subtotal;

                } else if (item.tipoItem === 'REPUESTO' && item.repuesto) {
                    const idRepuesto = item.repuesto.idRepuesto;
                    const nombreRepuesto = `${item.repuesto.codigo} - ${item.repuesto.nombre}`;

                    if (!repuestosVendidos[idRepuesto]) {
                        repuestosVendidos[idRepuesto] = {
                            nombre: nombreRepuesto,
                            cantidad: 0,
                            total: 0
                        };
                    }
                    repuestosVendidos[idRepuesto].cantidad += item.cantidad;
                    repuestosVendidos[idRepuesto].total += subtotal;
                    totalRepuestos += subtotal;
                }
            });
        }
    });

    // Renderizar top servicios
    const topServicios = Object.values(serviciosVendidos)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    renderTopServicios(topServicios);

    // Renderizar top repuestos
    const topRepuestos = Object.values(repuestosVendidos)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    renderTopRepuestos(topRepuestos);

    // Renderizar categorías
    renderCategoriaServicios(categoriaServicios);

    // Actualizar resumen de facturación
    document.getElementById('totalServiciosFacturados').textContent = formatMoney(totalServicios);
    document.getElementById('totalRepuestosFacturados').textContent = formatMoney(totalRepuestos);
    document.getElementById('totalGeneralFacturado').textContent = formatMoney(totalServicios + totalRepuestos);
}

function renderTopServicios(servicios) {
    const table = document.getElementById('serviciosVendidosTable');

    if (servicios.length === 0) {
        table.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay datos de servicios vendidos</td></tr>';
        return;
    }

    table.innerHTML = servicios.map((s, index) => `
        <tr>
            <td><strong>${index + 1}</strong></td>
            <td>${s.nombre}</td>
            <td class="text-end"><span class="badge bg-primary">${s.cantidad}</span></td>
            <td class="text-end"><strong>${formatMoney(s.total)}</strong></td>
        </tr>
    `).join('');
}

function renderTopRepuestos(repuestos) {
    const table = document.getElementById('repuestosVendidosTable');

    if (repuestos.length === 0) {
        table.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay datos de repuestos vendidos</td></tr>';
        return;
    }

    table.innerHTML = repuestos.map((r, index) => `
        <tr>
            <td><strong>${index + 1}</strong></td>
            <td>${r.nombre}</td>
            <td class="text-end"><span class="badge bg-info">${r.cantidad}</span></td>
            <td class="text-end"><strong>${formatMoney(r.total)}</strong></td>
        </tr>
    `).join('');
}

function renderCategoriaServicios(categorias) {
    const table = document.getElementById('categoriaServiciosTable');

    const categoriasArray = Object.entries(categorias)
        .map(([nombre, data]) => ({ nombre, ...data }))
        .sort((a, b) => b.total - a.total);

    if (categoriasArray.length === 0) {
        table.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No hay datos de categorías</td></tr>';
        return;
    }

    table.innerHTML = categoriasArray.map(c => `
        <tr>
            <td><strong>${c.nombre}</strong></td>
            <td class="text-end"><span class="badge bg-success">${c.cantidad}</span></td>
            <td class="text-end"><strong>${formatMoney(c.total)}</strong></td>
        </tr>
    `).join('');
}

// ========================================
// EXPORTAR A PDF
// ========================================

function exportarPDF() {
    // Obtener el tab activo
    const activeTab = document.querySelector('.tab-pane.active');
    const activeTabId = activeTab.id;

    let nombreReporte = '';
    if (activeTabId === 'resumen-panel') {
        nombreReporte = 'Reporte_Resumen_General';
    } else if (activeTabId === 'stock-panel') {
        nombreReporte = 'Reporte_Stock_Margenes';
    } else if (activeTabId === 'ventas-panel') {
        nombreReporte = 'Reporte_Ventas';
    }

    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const fechaActual = new Date().toLocaleDateString('es-PY');

    // Crear elemento para el PDF
    const elemento = document.createElement('div');
    elemento.style.padding = '20px';
    elemento.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h2>Sistema Multiservicios</h2>
            <h3>${nombreReporte.replace(/_/g, ' ')}</h3>
            <p>Período: ${fechaInicio} al ${fechaFin}</p>
            <p>Generado: ${fechaActual}</p>
        </div>
        ${activeTab.innerHTML}
    `;

    // Configuración de html2pdf
    const opt = {
        margin: 10,
        filename: `${nombreReporte}_${fechaActual}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Generar PDF
    html2pdf().set(opt).from(elemento).save();
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    cargarReportes();
});
