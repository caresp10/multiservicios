// Verificar autenticación
AuthService.checkAuth();

const user = AuthService.getUser();
document.getElementById('userName').textContent = `${user.nombre} ${user.apellido}`;
document.getElementById('userRole').textContent = user.rol;
document.getElementById('userAvatar').textContent = user.nombre.charAt(0);

// Verificar acceso: solo ADMIN, SUPERVISOR y DUENO pueden ver reportes
if (!['ADMIN', 'SUPERVISOR', 'DUENO'].includes(user.rol)) {
    alert('No tiene permisos para acceder a los reportes');
    window.location.href = 'dashboard.html';
}

// Ajustar vista para SUPERVISOR (solo reportes de OT por técnicos)
function ajustarVistaParaSupervisor() {
    if (user.rol === 'SUPERVISOR') {
        // Ocultar pestañas de Stock y Ventas
        const stockTab = document.getElementById('stock-tab');
        const ventasTab = document.getElementById('ventas-tab');
        if (stockTab) stockTab.parentElement.style.display = 'none';
        if (ventasTab) ventasTab.parentElement.style.display = 'none';

        // Ocultar cards de facturación en resumen general
        const totalFacturadoCard = document.getElementById('totalFacturado')?.closest('.col-md-3');
        if (totalFacturadoCard) totalFacturadoCard.style.display = 'none';

        // Ocultar gráfico de facturación mensual
        const chartFacturacionContainer = document.getElementById('chartFacturacionMensual')?.closest('.col-md-6');
        if (chartFacturacionContainer) chartFacturacionContainer.style.display = 'none';

        // Expandir gráfico de estados de pedidos
        const chartPedidosContainer = document.getElementById('chartEstadosPedidos')?.closest('.col-md-6');
        if (chartPedidosContainer) {
            chartPedidosContainer.classList.remove('col-md-6');
            chartPedidosContainer.classList.add('col-md-12');
        }

        // Ocultar sección de facturas por estado
        const facturasEstadoTable = document.getElementById('facturasEstadoTable')?.closest('.table-card');
        if (facturasEstadoTable) facturasEstadoTable.style.display = 'none';

        // Cambiar título de la página
        const pageTitle = document.querySelector('.page-header h1');
        if (pageTitle) {
            pageTitle.innerHTML = '<i class="fas fa-chart-bar"></i> Reportes de Órdenes de Trabajo';
        }
    }
}

document.getElementById('sidebarToggle')?.addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
});

function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        AuthService.logout();
    }
}

// ========================================
// GRÁFICOS CON CHART.JS
// ========================================

// Variables globales para los gráficos
let chartFacturacionMensual;
let chartEstadosPedidos;
let chartStockBajo;
let chartPrecioMargen;
let chartTopServicios;
let chartServiciosVsRepuestos;

// Establecer fechas por defecto (último mes)
const hoy = new Date();
const hace30Dias = new Date();
hace30Dias.setDate(hoy.getDate() - 30);

document.getElementById('fechaInicio').value = hace30Dias.toISOString().split('T')[0];
document.getElementById('fechaFin').value = hoy.toISOString().split('T')[0];

// Función para filtrar datos por rango de fechas
function filtrarPorFecha(datos, campoFecha) {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;

    if (!fechaInicio || !fechaFin) return datos;

    const inicio = new Date(fechaInicio);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);

    return datos.filter(item => {
        const fecha = new Date(item[campoFecha]);
        return fecha >= inicio && fecha <= fin;
    });
}

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

        const pedidosRaw = pedidosRes.success ? pedidosRes.data : [];
        const ordenesRaw = ordenesRes.success ? ordenesRes.data : [];
        const facturasRaw = facturasRes.success ? facturasRes.data : [];
        const clientes = clientesRes.success ? clientesRes.data : [];
        const repuestos = repuestosRes.success ? repuestosRes.data : [];

        // Aplicar filtro de fechas
        const pedidos = filtrarPorFecha(pedidosRaw, 'fechaPedido');
        const ordenes = filtrarPorFecha(ordenesRaw, 'fechaCreacion');
        const facturas = filtrarPorFecha(facturasRaw, 'fechaEmision');

        // TAB 1: Resumen General
        actualizarEstadisticasGenerales(pedidos, ordenes, facturas);
        renderPedidosPorEstado(pedidos);
        renderOrdenesPorEstado(ordenes);
        renderFacturasPorEstado(facturas);
        renderTopClientes(pedidos, clientes);

        // Gráficos TAB 1
        renderChartFacturacionMensual(facturas);
        renderChartEstadosPedidos(pedidos);

        // TAB 2: Stock y Márgenes
        await cargarReportesStock();
        renderAnalisisMargenes(repuestos);

        // Gráficos TAB 2
        renderChartStockBajo(repuestos);
        renderChartPrecioMargen(repuestos);

        // TAB 3: Ventas
        const datosVentas = renderReportesVentas(facturas);

        // Gráficos TAB 3
        renderChartTopServicios(datosVentas.topServicios);
        renderChartServiciosVsRepuestos(datosVentas.totalServicios, datosVentas.totalRepuestos);

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

    // Total facturado (PAGADA y PENDIENTE, excluyendo ANULADA)
    const totalFacturado = facturas
        .filter(f => f.estado === 'PAGADA' || f.estado === 'PENDIENTE')
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
        'ESPERANDO_REVISION': 'Esperando Revisión',
        'DEVUELTA_A_TECNICO': 'Devuelta a Técnico',
        'TERMINADA': 'Terminada',
        'FACTURADA': 'Facturada',
        'CANCELADA': 'Cancelada'
    };
    return estados[estado] || estado;
}

function getEstadoOrdenClass(estado) {
    const classes = {
        'ABIERTA': 'nuevo',
        'ASIGNADA': 'en-proceso',
        'EN_PROCESO': 'en-proceso',
        'ESPERANDO_REVISION': 'pendiente',
        'DEVUELTA_A_TECNICO': 'cancelado',
        'TERMINADA': 'completado',
        'FACTURADA': 'completado',
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
            fetch(`${CONFIG.API_URL}/repuestos/stock-bajo`, {
                headers: { 'Authorization': `Bearer ${AuthService.getToken()}` }
            }),
            fetch(`${CONFIG.API_URL}/repuestos/sin-stock`, {
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
    // Filtrar facturas válidas para análisis de ventas (excluyendo ANULADA)
    const facturasValidas = facturas.filter(f => f.estado !== 'ANULADA');

    // Calcular el total real facturado directamente desde las facturas
    const totalRealFacturado = facturasValidas.reduce((sum, f) => sum + (parseFloat(f.total) || 0), 0);

    // Analizar items de las facturas
    const serviciosVendidos = {};
    const repuestosVendidos = {};
    const categoriaServicios = {};

    let totalServicios = 0;
    let totalRepuestos = 0;

    facturasValidas.forEach(factura => {
        if (factura.items && Array.isArray(factura.items)) {
            factura.items.forEach(item => {
                const subtotal = parseFloat(item.subtotal) || (parseFloat(item.cantidad) * parseFloat(item.precioUnitario));

                // Determinar el tipo de item
                // Prioridad: 1) tipoItem explícito, 2) existencia de objeto repuesto/servicio, 3) patrón en descripción
                let esRepuesto = false;
                let esServicio = false;

                if (item.tipoItem === 'REPUESTO' || item.repuesto) {
                    esRepuesto = true;
                } else if (item.tipoItem === 'SERVICIO' || item.servicio) {
                    esServicio = true;
                } else {
                    // Inferir por la descripción - si tiene formato "CODIGO - Nombre" probablemente es repuesto
                    const desc = item.descripcion || '';
                    if (/^[A-Z0-9]+-\s/.test(desc) || /repuesto|pieza|componente/i.test(desc)) {
                        esRepuesto = true;
                    } else {
                        esServicio = true; // Por defecto es servicio
                    }
                }

                if (esServicio) {
                    // Usar datos del servicio si existe, sino usar descripción
                    const idServicio = item.servicio?.idServicio || `desc_${item.descripcion}`;
                    const nombreServicio = item.servicio?.nombre || item.descripcion;
                    const categoria = item.servicio?.categoria?.nombre || 'General';

                    if (!serviciosVendidos[idServicio]) {
                        serviciosVendidos[idServicio] = {
                            nombre: nombreServicio,
                            cantidad: 0,
                            total: 0,
                            categoria: categoria
                        };
                    }
                    serviciosVendidos[idServicio].cantidad += parseFloat(item.cantidad) || 1;
                    serviciosVendidos[idServicio].total += subtotal;
                    totalServicios += subtotal;

                    // Agrupar por categoría
                    if (!categoriaServicios[categoria]) {
                        categoriaServicios[categoria] = { cantidad: 0, total: 0 };
                    }
                    categoriaServicios[categoria].cantidad += parseFloat(item.cantidad) || 1;
                    categoriaServicios[categoria].total += subtotal;

                } else if (esRepuesto) {
                    // Usar datos del repuesto si existe, sino usar descripción
                    const idRepuesto = item.repuesto?.idRepuesto || `desc_${item.descripcion}`;
                    const nombreRepuesto = item.repuesto
                        ? `${item.repuesto.codigo} - ${item.repuesto.nombre}`
                        : item.descripcion;

                    if (!repuestosVendidos[idRepuesto]) {
                        repuestosVendidos[idRepuesto] = {
                            nombre: nombreRepuesto,
                            cantidad: 0,
                            total: 0
                        };
                    }
                    repuestosVendidos[idRepuesto].cantidad += parseFloat(item.cantidad) || 1;
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
    // Usar el total real de las facturas (no la suma de items que puede omitir algunos)
    document.getElementById('totalGeneralFacturado').textContent = formatMoney(totalRealFacturado);

    // Retornar datos para gráficos
    return {
        topServicios: topServicios,
        topRepuestos: topRepuestos,
        totalServicios: totalServicios,
        totalRepuestos: totalRepuestos
    };
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
// RENDERIZADO DE GRÁFICOS
// ========================================

// TAB 1: Gráfico de Facturación Mensual
function renderChartFacturacionMensual(facturas) {
    const ctx = document.getElementById('chartFacturacionMensual');
    if (!ctx) return;

    // Agrupar facturas por mes (últimos 6 meses)
    const mesesLabels = [];
    const mesesData = [];

    for (let i = 5; i >= 0; i--) {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() - i);
        const mesLabel = fecha.toLocaleDateString('es-PY', { month: 'short', year: 'numeric' });
        const mes = fecha.getMonth();
        const anio = fecha.getFullYear();

        const totalMes = facturas
            .filter(f => {
                const fechaFactura = new Date(f.fechaEmision);
                return fechaFactura.getMonth() === mes &&
                       fechaFactura.getFullYear() === anio &&
                       f.estado === 'PAGADA';
            })
            .reduce((sum, f) => sum + (f.total || 0), 0);

        mesesLabels.push(mesLabel);
        mesesData.push(totalMes);
    }

    if (chartFacturacionMensual) chartFacturacionMensual.destroy();

    chartFacturacionMensual = new Chart(ctx, {
        type: 'line',
        data: {
            labels: mesesLabels,
            datasets: [{
                label: 'Facturación (Gs.)',
                data: mesesData,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => formatMoney(context.parsed.y)
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => 'Gs. ' + (value / 1000).toFixed(0) + 'k'
                    }
                }
            }
        }
    });
}

// TAB 1: Gráfico de Estados de Pedidos
function renderChartEstadosPedidos(pedidos) {
    const ctx = document.getElementById('chartEstadosPedidos');
    if (!ctx) return;

    const estados = {};
    pedidos.forEach(p => {
        estados[p.estado] = (estados[p.estado] || 0) + 1;
    });

    const labels = Object.keys(estados).map(e => formatEstadoPedido(e));
    const data = Object.values(estados);
    const colores = Object.keys(estados).map(e => {
        const colorMap = {
            'NUEVO': '#0d6efd',
            'EN_PROCESO': '#ffc107',
            'COMPLETADO': '#198754',
            'CANCELADO': '#dc3545'
        };
        return colorMap[e] || '#6c757d';
    });

    if (chartEstadosPedidos) chartEstadosPedidos.destroy();

    chartEstadosPedidos = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colores,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// TAB 2: Gráfico de Stock Bajo
function renderChartStockBajo(repuestos) {
    const ctx = document.getElementById('chartStockBajo');
    if (!ctx) return;

    const repuestosConStockBajo = repuestos
        .filter(r => r.stockActual <= r.puntoReorden && r.activo)
        .sort((a, b) => a.stockActual - b.stockActual)
        .slice(0, 10);

    const labels = repuestosConStockBajo.map(r => r.nombre.substring(0, 20));
    const dataStock = repuestosConStockBajo.map(r => r.stockActual);
    const dataMinimo = repuestosConStockBajo.map(r => r.stockMinimo || 0);

    if (chartStockBajo) chartStockBajo.destroy();

    chartStockBajo = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Stock Actual',
                    data: dataStock,
                    backgroundColor: '#ffc107',
                    borderColor: '#ff9800',
                    borderWidth: 1
                },
                {
                    label: 'Stock Mínimo',
                    data: dataMinimo,
                    backgroundColor: '#dc3545',
                    borderColor: '#c82333',
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                x: { beginAtZero: true }
            }
        }
    });
}

// TAB 2: Gráfico de Precio vs Margen
function renderChartPrecioMargen(repuestos) {
    const ctx = document.getElementById('chartPrecioMargen');
    if (!ctx) return;

    const repuestosConMargen = repuestos
        .filter(r => r.activo && r.precioCosto > 0 && r.precioVenta > 0)
        .map(r => ({
            x: r.precioVenta,
            y: ((r.precioVenta - r.precioCosto) / r.precioCosto * 100),
            label: r.nombre
        }));

    if (chartPrecioMargen) chartPrecioMargen.destroy();

    chartPrecioMargen = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Repuestos',
                data: repuestosConMargen,
                backgroundColor: 'rgba(25, 135, 84, 0.6)',
                borderColor: '#198754',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.raw.label}: ${formatMoney(context.raw.x)}, Margen: ${context.raw.y.toFixed(1)}%`
                    }
                },
                legend: { display: false }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Precio de Venta (Gs.)' },
                    ticks: {
                        callback: (value) => formatMoney(value)
                    }
                },
                y: {
                    title: { display: true, text: 'Margen (%)' },
                    beginAtZero: true
                }
            }
        }
    });
}

// TAB 3: Gráfico de Top Servicios
function renderChartTopServicios(topServicios) {
    const ctx = document.getElementById('chartTopServicios');
    if (!ctx) return;

    const labels = topServicios.map(s => s.nombre.substring(0, 25));
    const data = topServicios.map(s => s.total);

    if (chartTopServicios) chartTopServicios.destroy();

    chartTopServicios = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Facturado (Gs.)',
                data: data,
                backgroundColor: '#0d6efd',
                borderColor: '#0a58ca',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => formatMoney(context.parsed.y)
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => 'Gs. ' + (value / 1000).toFixed(0) + 'k'
                    }
                }
            }
        }
    });
}

// TAB 3: Gráfico de Servicios vs Repuestos
function renderChartServiciosVsRepuestos(totalServicios, totalRepuestos) {
    const ctx = document.getElementById('chartServiciosVsRepuestos');
    if (!ctx) return;

    if (chartServiciosVsRepuestos) chartServiciosVsRepuestos.destroy();

    chartServiciosVsRepuestos = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Servicios', 'Repuestos'],
            datasets: [{
                data: [totalServicios, totalRepuestos],
                backgroundColor: ['#0d6efd', '#17a2b8'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = formatMoney(context.parsed);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percent = ((context.parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// EXPORTAR A PDF
// ========================================

async function exportarPDF() {
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

    // Cargar datos frescos
    const [pedidosRes, ordenesRes, facturasRes, repuestosRes] = await Promise.all([
        PedidoService.getAll(),
        OrdenTrabajoService.getAll(),
        FacturaService.getAll(),
        RepuestoService.getAll()
    ]);

    const pedidos = filtrarPorFecha(pedidosRes.success ? pedidosRes.data : [], 'fechaPedido');
    const ordenes = filtrarPorFecha(ordenesRes.success ? ordenesRes.data : [], 'fechaCreacion');
    const facturas = filtrarPorFecha(facturasRes.success ? facturasRes.data : [], 'fechaEmision');
    const repuestos = repuestosRes.success ? repuestosRes.data : [];

    // Generar contenido según el tab activo
    let contenidoTablas = '';

    if (activeTabId === 'resumen-panel') {
        // Estadísticas generales
        const totalFacturado = facturas.filter(f => f.estado === 'PAGADA').reduce((sum, f) => sum + (f.total || 0), 0);

        contenidoTablas = `
            <h4>Estadísticas Generales</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr style="background-color: #f8f9fa;">
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Métrica</th>
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">Valor</th>
                </tr>
                <tr><td style="border: 1px solid #dee2e6; padding: 8px;">Total de Pedidos</td><td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${pedidos.length}</td></tr>
                <tr><td style="border: 1px solid #dee2e6; padding: 8px;">Pedidos Completados</td><td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${pedidos.filter(p => p.estado === 'COMPLETADO').length}</td></tr>
                <tr><td style="border: 1px solid #dee2e6; padding: 8px;">Órdenes Activas</td><td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${ordenes.filter(o => ['ABIERTA', 'ASIGNADA', 'EN_PROCESO'].includes(o.estado)).length}</td></tr>
                <tr><td style="border: 1px solid #dee2e6; padding: 8px;">Total Facturado</td><td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatMoney(totalFacturado)}</td></tr>
            </table>

            <h4>Pedidos por Estado</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr style="background-color: #f8f9fa;">
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Estado</th>
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">Cantidad</th>
                </tr>
                ${(() => {
                    // Obtener todos los estados únicos de los pedidos
                    const estadosUnicos = [...new Set(pedidos.map(p => p.estado))];
                    return estadosUnicos.map(estado => {
                        const cantidad = pedidos.filter(p => p.estado === estado).length;
                        return `<tr><td style="border: 1px solid #dee2e6; padding: 8px;">${formatEstadoPedido(estado)}</td><td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${cantidad}</td></tr>`;
                    }).join('');
                })()}
            </table>

            <h4>Órdenes de Trabajo por Estado</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr style="background-color: #f8f9fa;">
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Estado</th>
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">Cantidad</th>
                </tr>
                ${(() => {
                    // Obtener todos los estados únicos de las órdenes
                    const estadosUnicos = [...new Set(ordenes.map(o => o.estado))];
                    return estadosUnicos.map(estado => {
                        const cantidad = ordenes.filter(o => o.estado === estado).length;
                        return `<tr><td style="border: 1px solid #dee2e6; padding: 8px;">${formatEstadoOrden(estado)}</td><td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${cantidad}</td></tr>`;
                    }).join('');
                })()}
            </table>

            <h4>Facturas por Estado</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr style="background-color: #f8f9fa;">
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Estado</th>
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">Cantidad</th>
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">Monto Total</th>
                </tr>
                ${(() => {
                    // Obtener todos los estados únicos de las facturas
                    const estadosUnicos = [...new Set(facturas.map(f => f.estado))];
                    return estadosUnicos.map(estado => {
                        const facturasEstado = facturas.filter(f => f.estado === estado);
                        const monto = facturasEstado.reduce((sum, f) => sum + (f.total || 0), 0);
                        return `<tr><td style="border: 1px solid #dee2e6; padding: 8px;">${formatEstadoFactura(estado)}</td><td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${facturasEstado.length}</td><td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatMoney(monto)}</td></tr>`;
                    }).join('');
                })()}
            </table>
        `;
    } else if (activeTabId === 'stock-panel') {
        // Reporte de Stock y Márgenes
        const repuestosActivos = repuestos.filter(r => r.activo);
        const stockBajo = repuestos.filter(r => r.stockActual <= r.stockMinimo && r.activo);
        const sinStock = repuestos.filter(r => r.stockActual === 0 && r.activo);
        const valorInventario = repuestosActivos.reduce((sum, r) => sum + ((r.precioCosto || 0) * (r.stockActual || 0)), 0);

        // Calcular repuestos con márgenes
        const repuestosConMargen = repuestosActivos
            .filter(r => r.precioCosto > 0 && r.precioVenta > 0)
            .map(r => ({
                ...r,
                margenGs: r.precioVenta - r.precioCosto,
                margenPorcentaje: ((r.precioVenta - r.precioCosto) / r.precioCosto * 100).toFixed(2)
            }))
            .sort((a, b) => b.margenPorcentaje - a.margenPorcentaje);

        contenidoTablas = `
            <h4>Resumen de Inventario</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr style="background-color: #f8f9fa;">
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Métrica</th>
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">Valor</th>
                </tr>
                <tr><td style="border: 1px solid #dee2e6; padding: 8px;">Total de Repuestos Activos</td><td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${repuestosActivos.length}</td></tr>
                <tr><td style="border: 1px solid #dee2e6; padding: 8px;">Con Stock Bajo/Crítico</td><td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${stockBajo.length}</td></tr>
                <tr><td style="border: 1px solid #dee2e6; padding: 8px;">Sin Stock</td><td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${sinStock.length}</td></tr>
                <tr><td style="border: 1px solid #dee2e6; padding: 8px;"><strong>Valor Total del Inventario</strong></td><td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;"><strong>${formatMoney(valorInventario)}</strong></td></tr>
            </table>

            ${stockBajo.length > 0 ? `
                <h4>Repuestos con Stock Bajo/Crítico (Top 15)</h4>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr style="background-color: #f8f9fa;">
                        <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Código</th>
                        <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Nombre</th>
                        <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">Stock Actual</th>
                        <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">Stock Mínimo</th>
                        <th style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">Estado</th>
                    </tr>
                    ${stockBajo.slice(0, 15).map(r => {
                        let estado = '';
                        if (r.stockActual === 0) {
                            estado = 'SIN STOCK';
                        } else if (r.stockActual <= r.stockMinimo) {
                            estado = 'CRÍTICO';
                        } else if (r.stockActual <= r.puntoReorden) {
                            estado = 'BAJO';
                        }
                        return `
                        <tr>
                            <td style="border: 1px solid #dee2e6; padding: 8px;">${r.codigo || '-'}</td>
                            <td style="border: 1px solid #dee2e6; padding: 8px;">${r.nombre}</td>
                            <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;"><strong>${r.stockActual || 0}</strong></td>
                            <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${r.stockMinimo || 0}</td>
                            <td style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">${estado}</td>
                        </tr>
                    `;}).join('')}
                </table>
            ` : '<p style="text-align: center; color: #28a745; padding: 20px;"><strong>✓ Todos los repuestos tienen stock adecuado</strong></p>'}

            <h4>Análisis de Márgenes de Ganancia (Top 15)</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr style="background-color: #f8f9fa;">
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Código</th>
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Nombre</th>
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">Precio Costo</th>
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">Precio Venta</th>
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">Margen Gs.</th>
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">Margen %</th>
                </tr>
                ${repuestosConMargen.slice(0, 15).map(r => `
                    <tr>
                        <td style="border: 1px solid #dee2e6; padding: 8px;">${r.codigo || '-'}</td>
                        <td style="border: 1px solid #dee2e6; padding: 8px;">${r.nombre}</td>
                        <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatMoney(r.precioCosto)}</td>
                        <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatMoney(r.precioVenta)}</td>
                        <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right; color: #28a745;"><strong>${formatMoney(r.margenGs)}</strong></td>
                        <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;"><strong>${r.margenPorcentaje}%</strong></td>
                    </tr>
                `).join('')}
            </table>
        `;
    } else if (activeTabId === 'ventas-panel') {
        // Reporte de Ventas
        const facturasPagadas = facturas.filter(f => f.estado === 'PAGADA');
        const totalVentas = facturasPagadas.reduce((sum, f) => sum + (f.total || 0), 0);

        contenidoTablas = `
            <h4>Resumen de Ventas</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr style="background-color: #f8f9fa;">
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Métrica</th>
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">Valor</th>
                </tr>
                <tr><td style="border: 1px solid #dee2e6; padding: 8px;">Total de Facturas</td><td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${facturas.length}</td></tr>
                <tr><td style="border: 1px solid #dee2e6; padding: 8px;">Facturas Pagadas</td><td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${facturasPagadas.length}</td></tr>
                <tr><td style="border: 1px solid #dee2e6; padding: 8px;">Total Ventas</td><td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatMoney(totalVentas)}</td></tr>
            </table>

            <h4>Detalle de Facturas</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr style="background-color: #f8f9fa;">
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Nº Factura</th>
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Cliente</th>
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Fecha</th>
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Estado</th>
                    <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">Total</th>
                </tr>
                ${facturas.slice(0, 30).map(f => `
                    <tr>
                        <td style="border: 1px solid #dee2e6; padding: 8px;">${f.numeroFactura}</td>
                        <td style="border: 1px solid #dee2e6; padding: 8px;">${f.cliente?.nombre || ''} ${f.cliente?.apellido || ''}</td>
                        <td style="border: 1px solid #dee2e6; padding: 8px;">${new Date(f.fechaEmision).toLocaleDateString('es-PY')}</td>
                        <td style="border: 1px solid #dee2e6; padding: 8px;">${f.estado}</td>
                        <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatMoney(f.total)}</td>
                    </tr>
                `).join('')}
            </table>
        `;
    }

    // Crear elemento para el PDF
    const elemento = document.createElement('div');
    elemento.style.padding = '20px';
    elemento.style.fontFamily = 'Arial, sans-serif';
    elemento.style.fontSize = '12px';
    elemento.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0;">Sistema Multiservicios</h2>
            <h3 style="margin: 10px 0;">${nombreReporte.replace(/_/g, ' ')}</h3>
            <p style="margin: 5px 0;">Período: ${fechaInicio} al ${fechaFin}</p>
            <p style="margin: 5px 0;">Generado: ${fechaActual}</p>
        </div>
        ${contenidoTablas}
    `;

    // Configuración de html2pdf
    const opt = {
        margin: 10,
        filename: `${nombreReporte}_${fechaActual.replace(/\//g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Generar PDF
    html2pdf().set(opt).from(elemento).save();
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    // Ajustar vista según el rol
    ajustarVistaParaSupervisor();

    // Cargar reportes
    cargarReportes();
});
