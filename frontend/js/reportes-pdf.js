// ========================================
// EXPORTAR A PDF CON PDFMAKE
// ========================================

async function exportarPDFconPdfMake() {
    // Obtener el tab activo
    const activeTab = document.querySelector('.tab-pane.active');
    const activeTabId = activeTab.id;

    let nombreReporte = '';
    let tituloReporte = '';
    if (activeTabId === 'resumen-panel') {
        nombreReporte = 'Reporte_Resumen_General';
        tituloReporte = 'Reporte Resumen General';
    } else if (activeTabId === 'stock-panel') {
        nombreReporte = 'Reporte_Stock_Margenes';
        tituloReporte = 'Reporte Stock y Margenes';
    } else if (activeTabId === 'ventas-panel') {
        nombreReporte = 'Reporte_Ventas';
        tituloReporte = 'Reporte de Ventas';
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

    // Generar contenido según el tab activo con pdfmake
    let contenido = [];

    // Encabezado del documento
    contenido.push(
        { text: 'Sistema Multiservicios', style: 'header', alignment: 'center' },
        { text: tituloReporte, style: 'subheader', alignment: 'center' },
        { text: `Periodo: ${fechaInicio} al ${fechaFin}`, style: 'info', alignment: 'center' },
        { text: `Generado: ${fechaActual}`, style: 'info', alignment: 'center', margin: [0, 0, 0, 15] }
    );

    if (activeTabId === 'resumen-panel') {
        // ========== REPORTE RESUMEN GENERAL ==========
        const totalFacturado = facturas.filter(f => f.estado === 'PAGADA').reduce((sum, f) => sum + (f.total || 0), 0);

        // Estadísticas generales
        contenido.push({ text: 'Estadisticas Generales', style: 'tableHeader', margin: [0, 10, 0, 5] });
        contenido.push({
            table: {
                widths: ['*', 'auto'],
                body: [
                    [{ text: 'Metrica', style: 'tableHeaderCell' }, { text: 'Valor', style: 'tableHeaderCell', alignment: 'right' }],
                    ['Total de Pedidos', { text: pedidos.length.toString(), alignment: 'right' }],
                    ['Pedidos Completados', { text: pedidos.filter(p => p.estado === 'COMPLETADO').length.toString(), alignment: 'right' }],
                    ['Ordenes Activas', { text: ordenes.filter(o => ['ABIERTA', 'ASIGNADA', 'EN_PROCESO'].includes(o.estado)).length.toString(), alignment: 'right' }],
                    ['Total Facturado', { text: formatMoney(totalFacturado), alignment: 'right' }]
                ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 10]
        });

        // Pedidos por Estado
        const estadosUnicosPedidos = [...new Set(pedidos.map(p => p.estado))];
        if (estadosUnicosPedidos.length > 0) {
            contenido.push({ text: 'Pedidos por Estado', style: 'tableHeader', margin: [0, 10, 0, 5] });
            const bodyPedidos = [
                [{ text: 'Estado', style: 'tableHeaderCell' }, { text: 'Cantidad', style: 'tableHeaderCell', alignment: 'right' }]
            ];
            estadosUnicosPedidos.forEach(estado => {
                const cantidad = pedidos.filter(p => p.estado === estado).length;
                bodyPedidos.push([formatEstadoPedido(estado), { text: cantidad.toString(), alignment: 'right' }]);
            });
            contenido.push({
                table: { widths: ['*', 'auto'], body: bodyPedidos },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 10]
            });
        }

        // Órdenes por Estado
        const estadosUnicosOrdenes = [...new Set(ordenes.map(o => o.estado))];
        if (estadosUnicosOrdenes.length > 0) {
            contenido.push({ text: 'Ordenes de Trabajo por Estado', style: 'tableHeader', margin: [0, 10, 0, 5] });
            const bodyOrdenes = [
                [{ text: 'Estado', style: 'tableHeaderCell' }, { text: 'Cantidad', style: 'tableHeaderCell', alignment: 'right' }]
            ];
            estadosUnicosOrdenes.forEach(estado => {
                const cantidad = ordenes.filter(o => o.estado === estado).length;
                bodyOrdenes.push([formatEstadoOrden(estado), { text: cantidad.toString(), alignment: 'right' }]);
            });
            contenido.push({
                table: { widths: ['*', 'auto'], body: bodyOrdenes },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 10]
            });
        }

        // Facturas por Estado
        const estadosUnicosFacturas = [...new Set(facturas.map(f => f.estado))];
        if (estadosUnicosFacturas.length > 0) {
            contenido.push({ text: 'Facturas por Estado', style: 'tableHeader', margin: [0, 10, 0, 5], pageBreak: 'before' });
            const bodyFacturas = [
                [{ text: 'Estado', style: 'tableHeaderCell' }, { text: 'Cantidad', style: 'tableHeaderCell', alignment: 'right' }, { text: 'Monto Total', style: 'tableHeaderCell', alignment: 'right' }]
            ];
            estadosUnicosFacturas.forEach(estado => {
                const facturasEstado = facturas.filter(f => f.estado === estado);
                const monto = facturasEstado.reduce((sum, f) => sum + (f.total || 0), 0);
                bodyFacturas.push([formatEstadoFactura(estado), { text: facturasEstado.length.toString(), alignment: 'right' }, { text: formatMoney(monto), alignment: 'right' }]);
            });
            contenido.push({
                table: { widths: ['*', 'auto', 'auto'], body: bodyFacturas },
                layout: 'lightHorizontalLines'
            });
        }

    } else if (activeTabId === 'stock-panel') {
        // ========== REPORTE STOCK Y MÁRGENES ==========
        const repuestosActivos = repuestos.filter(r => r.activo);
        const stockBajo = repuestos.filter(r => r.stockActual <= r.stockMinimo && r.activo);
        const sinStock = repuestos.filter(r => r.stockActual === 0 && r.activo);
        const valorInventario = repuestosActivos.reduce((sum, r) => sum + ((r.precioCosto || 0) * (r.stockActual || 0)), 0);

        // Resumen de Inventario
        contenido.push({ text: 'Resumen de Inventario', style: 'tableHeader', margin: [0, 10, 0, 5] });
        contenido.push({
            table: {
                widths: ['*', 'auto'],
                body: [
                    [{ text: 'Metrica', style: 'tableHeaderCell' }, { text: 'Valor', style: 'tableHeaderCell', alignment: 'right' }],
                    ['Total de Repuestos Activos', { text: repuestosActivos.length.toString(), alignment: 'right' }],
                    ['Con Stock Bajo/Critico', { text: stockBajo.length.toString(), alignment: 'right' }],
                    ['Sin Stock', { text: sinStock.length.toString(), alignment: 'right' }],
                    [{ text: 'Valor Total del Inventario', bold: true }, { text: 'Gs. ' + (valorInventario || 0).toLocaleString('es-PY'), alignment: 'right', bold: true }]
                ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 10]
        });

        // Repuestos con Stock Bajo
        if (stockBajo.length > 0) {
            contenido.push({ text: 'Repuestos con Stock Bajo/Critico (Top 15)', style: 'tableHeader', margin: [0, 10, 0, 5], pageBreak: 'before' });
            const bodyStockBajo = [
                [
                    { text: 'Codigo', style: 'tableHeaderCell', fontSize: 8 },
                    { text: 'Nombre', style: 'tableHeaderCell', fontSize: 8 },
                    { text: 'Stock Actual', style: 'tableHeaderCell', fontSize: 8, alignment: 'right' },
                    { text: 'Stock Minimo', style: 'tableHeaderCell', fontSize: 8, alignment: 'right' },
                    { text: 'Estado', style: 'tableHeaderCell', fontSize: 8, alignment: 'center' }
                ]
            ];
            stockBajo.slice(0, 15).forEach(r => {
                let estado = '';
                if (r.stockActual === 0) estado = 'SIN STOCK';
                else if (r.stockActual <= r.stockMinimo) estado = 'CRITICO';
                else if (r.stockActual <= r.puntoReorden) estado = 'BAJO';

                bodyStockBajo.push([
                    { text: r.codigo || '-', fontSize: 7 },
                    { text: (r.nombre || '').substring(0, 40), fontSize: 7 },
                    { text: (r.stockActual || 0).toString(), fontSize: 7, alignment: 'right', bold: true },
                    { text: (r.stockMinimo || 0).toString(), fontSize: 7, alignment: 'right' },
                    { text: estado, fontSize: 7, alignment: 'center' }
                ]);
            });
            contenido.push({
                table: { widths: [60, '*', 60, 60, 60], body: bodyStockBajo },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 10]
            });
        }

        // Análisis de Márgenes
        const repuestosConMargen = repuestosActivos
            .filter(r => r.precioCosto > 0 && r.precioVenta > 0)
            .map(r => ({
                ...r,
                margenGs: r.precioVenta - r.precioCosto,
                margenPorcentaje: ((r.precioVenta - r.precioCosto) / r.precioCosto * 100).toFixed(2)
            }))
            .sort((a, b) => b.margenPorcentaje - a.margenPorcentaje);

        if (repuestosConMargen.length > 0) {
            contenido.push({ text: 'Analisis de Margenes de Ganancia (Top 15)', style: 'tableHeader', margin: [0, 10, 0, 5], pageBreak: 'before' });
            const bodyMargenes = [
                [
                    { text: 'Codigo', style: 'tableHeaderCell', fontSize: 7 },
                    { text: 'Nombre', style: 'tableHeaderCell', fontSize: 7 },
                    { text: 'Precio Costo', style: 'tableHeaderCell', fontSize: 7, alignment: 'right' },
                    { text: 'Precio Venta', style: 'tableHeaderCell', fontSize: 7, alignment: 'right' },
                    { text: 'Margen Gs.', style: 'tableHeaderCell', fontSize: 7, alignment: 'right' },
                    { text: 'Margen %', style: 'tableHeaderCell', fontSize: 7, alignment: 'right' }
                ]
            ];
            repuestosConMargen.slice(0, 15).forEach(r => {
                bodyMargenes.push([
                    { text: r.codigo || '-', fontSize: 6 },
                    { text: (r.nombre || '').substring(0, 30), fontSize: 6 },
                    { text: 'Gs. ' + (r.precioCosto || 0).toLocaleString('es-PY'), fontSize: 6, alignment: 'right' },
                    { text: 'Gs. ' + (r.precioVenta || 0).toLocaleString('es-PY'), fontSize: 6, alignment: 'right' },
                    { text: 'Gs. ' + (r.margenGs || 0).toLocaleString('es-PY'), fontSize: 6, alignment: 'right', bold: true },
                    { text: r.margenPorcentaje + '%', fontSize: 6, alignment: 'right', bold: true }
                ]);
            });
            contenido.push({
                table: { widths: [50, '*', 55, 55, 55, 40], body: bodyMargenes },
                layout: 'lightHorizontalLines'
            });
        }

    } else if (activeTabId === 'ventas-panel') {
        // ========== REPORTE DE VENTAS ==========
        const facturasValidas = facturas.filter(f => f.estado !== 'ANULADA');
        const facturasPagadas = facturas.filter(f => f.estado === 'PAGADA');
        const totalVentas = facturasPagadas.reduce((sum, f) => sum + (f.total || 0), 0);

        // Analizar servicios y repuestos vendidos
        const serviciosVendidos = {};
        const repuestosVendidos = {};
        let totalServicios = 0;
        let totalRepuestos = 0;

        facturasValidas.forEach(factura => {
            if (factura.items && Array.isArray(factura.items)) {
                factura.items.forEach(item => {
                    const subtotal = parseFloat(item.subtotal) || (parseFloat(item.cantidad) * parseFloat(item.precioUnitario));
                    let esRepuesto = false;
                    let esServicio = false;

                    if (item.tipoItem === 'REPUESTO' || item.repuesto) {
                        esRepuesto = true;
                    } else if (item.tipoItem === 'SERVICIO' || item.servicio) {
                        esServicio = true;
                    } else {
                        const desc = item.descripcion || '';
                        if (/^[A-Z0-9]+-\s/.test(desc) || /repuesto|pieza|componente/i.test(desc)) {
                            esRepuesto = true;
                        } else {
                            esServicio = true;
                        }
                    }

                    if (esServicio) {
                        const idServicio = item.servicio?.idServicio || `desc_${item.descripcion}`;
                        const nombreServicio = item.servicio?.nombre || item.descripcion;
                        if (!serviciosVendidos[idServicio]) {
                            serviciosVendidos[idServicio] = { nombre: nombreServicio, cantidad: 0, total: 0 };
                        }
                        serviciosVendidos[idServicio].cantidad += parseFloat(item.cantidad) || 1;
                        serviciosVendidos[idServicio].total += subtotal;
                        totalServicios += subtotal;
                    } else if (esRepuesto) {
                        const idRepuesto = item.repuesto?.idRepuesto || `desc_${item.descripcion}`;
                        const nombreRepuesto = item.repuesto ? `${item.repuesto.codigo} - ${item.repuesto.nombre}` : item.descripcion;
                        if (!repuestosVendidos[idRepuesto]) {
                            repuestosVendidos[idRepuesto] = { nombre: nombreRepuesto, cantidad: 0, total: 0 };
                        }
                        repuestosVendidos[idRepuesto].cantidad += parseFloat(item.cantidad) || 1;
                        repuestosVendidos[idRepuesto].total += subtotal;
                        totalRepuestos += subtotal;
                    }
                });
            }
        });

        const topServicios = Object.values(serviciosVendidos).sort((a, b) => b.total - a.total).slice(0, 10);
        const topRepuestos = Object.values(repuestosVendidos).sort((a, b) => b.total - a.total).slice(0, 10);

        // Resumen de Ventas
        contenido.push({ text: 'Resumen de Ventas', style: 'tableHeader', margin: [0, 10, 0, 5] });
        contenido.push({
            table: {
                widths: ['*', 'auto'],
                body: [
                    [{ text: 'Metrica', style: 'tableHeaderCell' }, { text: 'Valor', style: 'tableHeaderCell', alignment: 'right' }],
                    ['Total de Facturas', { text: facturas.length.toString(), alignment: 'right' }],
                    ['Facturas Pagadas', { text: facturasPagadas.length.toString(), alignment: 'right' }],
                    ['Total en Servicios', { text: 'Gs. ' + (totalServicios || 0).toLocaleString('es-PY'), alignment: 'right' }],
                    ['Total en Repuestos', { text: 'Gs. ' + (totalRepuestos || 0).toLocaleString('es-PY'), alignment: 'right' }],
                    [{ text: 'Total Ventas', bold: true }, { text: 'Gs. ' + (totalVentas || 0).toLocaleString('es-PY'), alignment: 'right', bold: true }]
                ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 10]
        });

        // Top 10 Servicios
        if (topServicios.length > 0) {
            contenido.push({ text: 'Top 10 Servicios Mas Vendidos', style: 'tableHeader', margin: [0, 10, 0, 5], pageBreak: 'before' });
            const bodyServicios = [
                [
                    { text: '#', style: 'tableHeaderCell', fontSize: 7, alignment: 'center' },
                    { text: 'Servicio', style: 'tableHeaderCell', fontSize: 7 },
                    { text: 'Cant.', style: 'tableHeaderCell', fontSize: 7, alignment: 'right' },
                    { text: 'Total Facturado', style: 'tableHeaderCell', fontSize: 7, alignment: 'right' }
                ]
            ];
            topServicios.forEach((s, index) => {
                bodyServicios.push([
                    { text: (index + 1).toString(), fontSize: 7, alignment: 'center', bold: true },
                    { text: (s.nombre || '').substring(0, 50), fontSize: 7 },
                    { text: s.cantidad.toString(), fontSize: 7, alignment: 'right' },
                    { text: 'Gs. ' + (s.total || 0).toLocaleString('es-PY'), fontSize: 7, alignment: 'right', bold: true }
                ]);
            });
            contenido.push({
                table: { widths: [20, '*', 40, 80], body: bodyServicios },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 10]
            });
        }

        // Top 10 Repuestos
        if (topRepuestos.length > 0) {
            contenido.push({ text: 'Top 10 Repuestos Mas Vendidos', style: 'tableHeader', margin: [0, 10, 0, 5] });
            const bodyRepuestos = [
                [
                    { text: '#', style: 'tableHeaderCell', fontSize: 7, alignment: 'center' },
                    { text: 'Repuesto', style: 'tableHeaderCell', fontSize: 7 },
                    { text: 'Cant.', style: 'tableHeaderCell', fontSize: 7, alignment: 'right' },
                    { text: 'Total Facturado', style: 'tableHeaderCell', fontSize: 7, alignment: 'right' }
                ]
            ];
            topRepuestos.forEach((r, index) => {
                bodyRepuestos.push([
                    { text: (index + 1).toString(), fontSize: 7, alignment: 'center', bold: true },
                    { text: (r.nombre || '').substring(0, 50), fontSize: 7 },
                    { text: r.cantidad.toString(), fontSize: 7, alignment: 'right' },
                    { text: 'Gs. ' + (r.total || 0).toLocaleString('es-PY'), fontSize: 7, alignment: 'right', bold: true }
                ]);
            });
            contenido.push({
                table: { widths: [20, '*', 40, 80], body: bodyRepuestos },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 10]
            });
        }

        // Detalle de Facturas
        if (facturas.length > 0) {
            contenido.push({ text: 'Detalle de Facturas (Ultimas 50)', style: 'tableHeader', margin: [0, 10, 0, 5], pageBreak: 'before' });
            const bodyFacturas = [
                [
                    { text: 'N° Factura', style: 'tableHeaderCell', fontSize: 7 },
                    { text: 'Cliente', style: 'tableHeaderCell', fontSize: 7 },
                    { text: 'Fecha', style: 'tableHeaderCell', fontSize: 7, alignment: 'center' },
                    { text: 'Estado', style: 'tableHeaderCell', fontSize: 7, alignment: 'center' },
                    { text: 'Total', style: 'tableHeaderCell', fontSize: 7, alignment: 'right' }
                ]
            ];
            facturas.slice(0, 50).forEach(f => {
                bodyFacturas.push([
                    { text: f.numeroFactura || '-', fontSize: 6 },
                    { text: ((f.cliente?.nombre || '') + ' ' + (f.cliente?.apellido || '')).substring(0, 25), fontSize: 6 },
                    { text: new Date(f.fechaEmision).toLocaleDateString('es-PY'), fontSize: 6, alignment: 'center' },
                    { text: formatEstadoFactura(f.estado), fontSize: 6, alignment: 'center' },
                    { text: 'Gs. ' + (f.total || 0).toLocaleString('es-PY'), fontSize: 6, alignment: 'right' }
                ]);
            });
            contenido.push({
                table: { widths: [55, '*', 45, 50, 70], body: bodyFacturas },
                layout: 'lightHorizontalLines'
            });
        }
    }

    // Definición del documento PDF
    const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [40, 60, 40, 60],
        content: contenido,
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                margin: [0, 0, 0, 5]
            },
            subheader: {
                fontSize: 14,
                bold: true,
                margin: [0, 5, 0, 5]
            },
            info: {
                fontSize: 9,
                margin: [0, 2, 0, 2]
            },
            tableHeader: {
                fontSize: 11,
                bold: true,
                fillColor: '#eeeeee'
            },
            tableHeaderCell: {
                fillColor: '#f0f0f0',
                bold: true,
                fontSize: 9
            }
        },
        defaultStyle: {
            fontSize: 9
        }
    };

    // Generar y descargar el PDF
    pdfMake.createPdf(docDefinition).download(`${nombreReporte}_${fechaActual.replace(/\//g, '-')}.pdf`);
}
