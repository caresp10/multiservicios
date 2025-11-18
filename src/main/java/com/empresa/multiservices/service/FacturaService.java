package com.empresa.multiservices.service;

import com.empresa.multiservices.model.*;
import com.empresa.multiservices.model.enums.EstadoFactura;
import com.empresa.multiservices.model.enums.EstadoPedido;
import com.empresa.multiservices.model.enums.TipoItemFactura;
import com.empresa.multiservices.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FacturaService {

    private final FacturaRepository facturaRepository;
    private final ClienteRepository clienteRepository;
    private final OrdenTrabajoRepository ordenTrabajoRepository;
    private final PedidoRepository pedidoRepository;
    private final RepuestoRepository repuestoRepository;
    private final MovimientoStockRepository movimientoStockRepository;
    private final ServicioCatalogoRepository servicioCatalogoRepository;

    @Transactional(readOnly = true)
    public List<Factura> listarTodas() {
        List<Factura> facturas = facturaRepository.findAll();
        // Forzar la carga de los items para cada factura y calcular totales
        for (Factura f : facturas) {
            f.getItems().size();
            // Calcular totales desde los items si están en 0
            if ((f.getSubtotal() == null || f.getSubtotal().compareTo(BigDecimal.ZERO) == 0)
                && f.getItems() != null && !f.getItems().isEmpty()) {
                calcularTotalesDesdeItems(f);
            }
        }
        return facturas;
    }

    @Transactional(readOnly = true)
    public Factura obtenerPorId(Long id) {
        Factura factura = facturaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Factura no encontrada"));

        // Calcular totales desde los items si están en 0
        if ((factura.getSubtotal() == null || factura.getSubtotal().compareTo(BigDecimal.ZERO) == 0)
            && factura.getItems() != null && !factura.getItems().isEmpty()) {
            calcularTotalesDesdeItems(factura);
        }

        return factura;
    }

    private void calcularTotalesDesdeItems(Factura factura) {
        BigDecimal subtotal = BigDecimal.ZERO;

        for (FacturaItem item : factura.getItems()) {
            subtotal = subtotal.add(item.getSubtotal());
        }

        BigDecimal tasaIVA = new BigDecimal("0.10");
        BigDecimal iva = subtotal.multiply(tasaIVA).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(iva);

        factura.setSubtotal(subtotal);
        factura.setIva(iva);
        factura.setTotal(total);
    }

    @Transactional
    public Factura crear(Factura factura) {
        // LOG: Ver qué llega al backend
        System.out.println("=== FACTURA RECIBIDA EN BACKEND ===");
        System.out.println("Items recibidos: " + (factura.getItems() != null ? factura.getItems().size() : "null"));
        System.out.println("Subtotal: " + factura.getSubtotal());
        System.out.println("IVA: " + factura.getIva());
        System.out.println("Total: " + factura.getTotal());
        if (factura.getItems() != null) {
            factura.getItems().forEach(item -> {
                System.out.println("  - Item: " + item.getDescripcion() + " | Cantidad: " + item.getCantidad() + " | Precio: " + item.getPrecioUnitario());
            });
        }

        // Validar cliente
        if (factura.getCliente() == null || factura.getCliente().getIdCliente() == null) {
            throw new IllegalArgumentException("El cliente es obligatorio");
        }

        Cliente cliente = clienteRepository.findById(factura.getCliente().getIdCliente())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        factura.setCliente(cliente);

        // Si hay orden de trabajo, validar y obtener
        if (factura.getOt() != null && factura.getOt().getIdOt() != null) {
            OrdenTrabajo ot = ordenTrabajoRepository.findById(factura.getOt().getIdOt())
                    .orElseThrow(() -> new RuntimeException("Orden de trabajo no encontrada"));
            factura.setOt(ot);

            // Asociar el pedido de la OT
            if (ot.getPedido() != null) {
                factura.setPedido(ot.getPedido());
            }
        }

        // Generar número de factura si no existe
        if (factura.getNumeroFactura() == null || factura.getNumeroFactura().trim().isEmpty()) {
            factura.setNumeroFactura(generarNumeroFactura());
        }

        // El pedido debe existir (viene de la OT o es requerido)
        if (factura.getPedido() == null) {
            throw new IllegalArgumentException("La factura debe estar asociada a un pedido (a través de una orden de trabajo)");
        }

        // Validar que subtotal no sea null
        if (factura.getSubtotal() == null) {
            factura.setSubtotal(java.math.BigDecimal.ZERO);
        }

        // CRÍTICO: Establecer la relación bidireccional con los items
        if (factura.getItems() != null && !factura.getItems().isEmpty()) {
            for (FacturaItem item : factura.getItems()) {
                item.setFactura(factura);
                // Si no tiene tipoItem, asignar SERVICIO por defecto
                if (item.getTipoItem() == null) {
                    item.setTipoItem(com.empresa.multiservices.model.enums.TipoItemFactura.SERVICIO);
                }

                // Cargar referencias a servicios y repuestos según el tipo de item
                if (item.getTipoItem() == TipoItemFactura.SERVICIO && item.getServicio() != null && item.getServicio().getIdServicio() != null) {
                    ServicioCatalogo servicio = servicioCatalogoRepository.findById(item.getServicio().getIdServicio())
                            .orElseThrow(() -> new RuntimeException("Servicio no encontrado con ID: " + item.getServicio().getIdServicio()));
                    item.setServicio(servicio);
                }

                if (item.getTipoItem() == TipoItemFactura.REPUESTO && item.getRepuesto() != null && item.getRepuesto().getIdRepuesto() != null) {
                    Repuesto repuesto = repuestoRepository.findById(item.getRepuesto().getIdRepuesto())
                            .orElseThrow(() -> new RuntimeException("Repuesto no encontrado con ID: " + item.getRepuesto().getIdRepuesto()));
                    item.setRepuesto(repuesto);
                }
            }
        }

        Factura saved = facturaRepository.save(factura);

        // ===================================================================
        // DESCUENTO AUTOMÁTICO DE STOCK Y REGISTRO DE MOVIMIENTOS
        // ===================================================================
        procesarDescuentoStockYMovimientos(saved);

        // Actualizar estado del pedido a FACTURADO
        if (saved.getPedido() != null) {
            Pedido pedido = saved.getPedido();
            pedido.setEstado(EstadoPedido.FACTURADO);
            pedidoRepository.save(pedido);
        }

        // Actualizar estado de la OT a FACTURADA
        if (saved.getOt() != null) {
            OrdenTrabajo ot = saved.getOt();
            ot.setEstado(com.empresa.multiservices.model.enums.EstadoOT.FACTURADA);
            ordenTrabajoRepository.save(ot);
        }

        return saved;
    }

    @Transactional
    public Factura actualizar(Long id, Factura facturaActualizada) {
        Factura factura = obtenerPorId(id);

        if (facturaActualizada.getCliente() != null && facturaActualizada.getCliente().getIdCliente() != null) {
            Cliente cliente = clienteRepository.findById(facturaActualizada.getCliente().getIdCliente())
                    .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
            factura.setCliente(cliente);
        }

        if (facturaActualizada.getOt() != null && facturaActualizada.getOt().getIdOt() != null) {
            OrdenTrabajo ot = ordenTrabajoRepository.findById(facturaActualizada.getOt().getIdOt())
                    .orElseThrow(() -> new RuntimeException("Orden de trabajo no encontrada"));
            factura.setOt(ot);
        }

        factura.setSubtotal(facturaActualizada.getSubtotal());
        factura.setDescuento(facturaActualizada.getDescuento());
        factura.setIva(facturaActualizada.getIva());
        factura.setTotal(facturaActualizada.getTotal());
        factura.setEstado(facturaActualizada.getEstado());
        factura.setFormaPago(facturaActualizada.getFormaPago());
        factura.setFechaVencimiento(facturaActualizada.getFechaVencimiento());
        factura.setObservaciones(facturaActualizada.getObservaciones());
        factura.setTimbrado(facturaActualizada.getTimbrado());

        return facturaRepository.save(factura);
    }

    @Transactional
    public void eliminar(Long id) {
        Factura factura = obtenerPorId(id);
        facturaRepository.delete(factura);
    }

    @Transactional(readOnly = true)
    public List<Factura> listarPorEstado(EstadoFactura estado) {
        return facturaRepository.findByEstado(estado);
    }

    @Transactional(readOnly = true)
    public List<Factura> listarPorCliente(Long idCliente) {
        return facturaRepository.findByClienteIdCliente(idCliente);
    }

    /**
     * Procesa el descuento automático de stock y registra movimientos para items de tipo REPUESTO
     * Este método se ejecuta automáticamente al crear una factura
     */
    private void procesarDescuentoStockYMovimientos(Factura factura) {
        if (factura.getItems() == null || factura.getItems().isEmpty()) {
            return;
        }

        System.out.println("===================================================");
        System.out.println("PROCESANDO DESCUENTO DE STOCK Y MOVIMIENTOS");
        System.out.println("Factura: " + factura.getNumeroFactura());
        System.out.println("Total items: " + factura.getItems().size());

        // Obtener usuario actual (para registro de movimiento)
        Usuario usuario = obtenerUsuarioActual();

        for (FacturaItem item : factura.getItems()) {
            // Solo procesar items de tipo REPUESTO que tengan referencia al repuesto
            if (item.getTipoItem() == TipoItemFactura.REPUESTO && item.getRepuesto() != null) {
                Repuesto repuesto = item.getRepuesto();
                int cantidadADescontar = item.getCantidad().intValue();

                System.out.println("---------------------------------------------------");
                System.out.println("Repuesto: " + repuesto.getNombre() + " (" + repuesto.getCodigo() + ")");
                System.out.println("Stock actual: " + repuesto.getStockActual());
                System.out.println("Cantidad a descontar: " + cantidadADescontar);

                // Validar que haya stock suficiente
                if (repuesto.getStockActual() < cantidadADescontar) {
                    throw new RuntimeException(
                        "ERROR: Stock insuficiente para el repuesto '" + repuesto.getNombre() + "'. " +
                        "Stock disponible: " + repuesto.getStockActual() + ", " +
                        "Cantidad requerida: " + cantidadADescontar
                    );
                }

                // Guardar stock anterior
                int stockAnterior = repuesto.getStockActual();

                // DESCONTAR STOCK
                repuesto.setStockActual(stockAnterior - cantidadADescontar);
                repuestoRepository.save(repuesto);

                System.out.println("✅ Stock descontado. Nuevo stock: " + repuesto.getStockActual());

                // REGISTRAR MOVIMIENTO DE STOCK
                MovimientoStock movimiento = MovimientoStock.builder()
                        .repuesto(repuesto)
                        .tipoMovimiento(MovimientoStock.TipoMovimiento.SALIDA)
                        .cantidad(cantidadADescontar)
                        .motivo(MovimientoStock.MotivoMovimiento.VENTA)
                        .referencia("FACTURA: " + factura.getNumeroFactura())
                        .stockAnterior(stockAnterior)
                        .stockNuevo(repuesto.getStockActual())
                        .usuario(usuario)
                        .factura(factura)
                        .fechaMovimiento(LocalDateTime.now())
                        .observaciones("Descuento automático por facturación")
                        .build();

                movimientoStockRepository.save(movimiento);

                System.out.println("✅ Movimiento de stock registrado (ID: " + movimiento.getIdMovimiento() + ")");
            }
        }

        System.out.println("===================================================");
        System.out.println("DESCUENTO DE STOCK COMPLETADO");
    }

    /**
     * Obtiene el usuario actual desde el contexto de seguridad
     * Si no hay usuario autenticado, retorna null
     */
    private Usuario obtenerUsuarioActual() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                org.springframework.security.core.userdetails.UserDetails userDetails =
                        (org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal();
                String username = userDetails.getUsername();
                // Aquí deberías tener un UsuarioRepository para buscar por username
                // Por ahora retornamos null, el campo usuario en MovimientoStock es opcional
                return null;
            }
        } catch (Exception e) {
            System.out.println("⚠️ No se pudo obtener usuario actual: " + e.getMessage());
        }
        return null;
    }

    private String generarNumeroFactura() {
        long count = facturaRepository.count() + 1;
        return String.format("FACT-%06d", count);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> obtenerDatosParaFacturar(Long idOt) {
        OrdenTrabajo ot = ordenTrabajoRepository.findById(idOt)
                .orElseThrow(() -> new RuntimeException("Orden de trabajo no encontrada"));

        // Validar que la OT esté terminada (lista para facturar)
        if (ot.getEstado() != com.empresa.multiservices.model.enums.EstadoOT.TERMINADA) {
            throw new IllegalArgumentException("La orden de trabajo debe estar terminada para facturar");
        }

        // Obtener datos básicos
        Pedido pedido = ot.getPedido();
        Cliente cliente = pedido.getCliente();
        Presupuesto presupuesto = ot.getPresupuesto();

        // Obtener items del presupuesto
        List<java.util.Map<String, Object>> itemsPresupuesto = new java.util.ArrayList<>();
        BigDecimal subtotalPresupuesto = BigDecimal.ZERO;

        if (presupuesto != null && presupuesto.getItems() != null) {
            for (var item : presupuesto.getItems()) {
                java.util.Map<String, Object> itemMap = new java.util.HashMap<>();
                itemMap.put("descripcion", item.getDescripcion());
                itemMap.put("cantidad", item.getCantidad());
                itemMap.put("precioUnitario", item.getPrecioUnitario());
                itemMap.put("subtotal", item.getSubtotal());
                itemsPresupuesto.add(itemMap);
                subtotalPresupuesto = subtotalPresupuesto.add(item.getSubtotal());
            }
        }

        // Obtener repuestos utilizados en la OT
        List<RepuestoUtilizado> repuestos = ot.getRepuestos() != null
            ? ot.getRepuestos()
            : new java.util.ArrayList<>();

        List<java.util.Map<String, Object>> itemsRepuestos = new java.util.ArrayList<>();
        BigDecimal subtotalRepuestos = BigDecimal.ZERO;

        for (RepuestoUtilizado repuesto : repuestos) {
            java.util.Map<String, Object> repuestoMap = new java.util.HashMap<>();
            repuestoMap.put("descripcion", repuesto.getDescripcion());
            repuestoMap.put("cantidad", repuesto.getCantidad());
            repuestoMap.put("precioUnitario", repuesto.getPrecioUnitario());
            repuestoMap.put("subtotal", repuesto.getSubtotal());
            itemsRepuestos.add(repuestoMap);
            subtotalRepuestos = subtotalRepuestos.add(repuesto.getSubtotal());
        }

        // Calcular totales
        BigDecimal subtotalTotal = subtotalPresupuesto.add(subtotalRepuestos);

        // Agregar mano de obra si existe
        if (ot.getCostoManoObra() != null && ot.getCostoManoObra().compareTo(BigDecimal.ZERO) > 0) {
            java.util.Map<String, Object> manoObraItem = new java.util.HashMap<>();
            manoObraItem.put("descripcion", "Mano de obra - " + ot.getHorasTrabajadas() + " horas");
            manoObraItem.put("cantidad", BigDecimal.ONE);
            manoObraItem.put("precioUnitario", ot.getCostoManoObra());
            manoObraItem.put("subtotal", ot.getCostoManoObra());
            itemsPresupuesto.add(manoObraItem);
            subtotalTotal = subtotalTotal.add(ot.getCostoManoObra());
        }

        // Calcular IVA (10%)
        BigDecimal tasaIVA = new BigDecimal("0.10");
        BigDecimal iva = subtotalTotal.multiply(tasaIVA).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal total = subtotalTotal.add(iva);

        // Construir respuesta
        java.util.Map<String, Object> datos = new java.util.HashMap<>();

        // Datos de la OT
        java.util.Map<String, Object> otData = new java.util.HashMap<>();
        otData.put("idOt", ot.getIdOt());
        otData.put("numeroOt", ot.getNumeroOt());
        otData.put("fechaFinalizacion", ot.getFechaFinalizacion());
        otData.put("descripcionTrabajo", ot.getDescripcionTrabajo());
        otData.put("informeFinal", ot.getInformeFinal());
        datos.put("ordenTrabajo", otData);

        // Datos del pedido
        java.util.Map<String, Object> pedidoData = new java.util.HashMap<>();
        pedidoData.put("idPedido", pedido.getIdPedido());
        pedidoData.put("numeroPedido", pedido.getNumeroPedido());
        pedidoData.put("descripcion", pedido.getDescripcion());
        datos.put("pedido", pedidoData);

        // Datos del cliente
        java.util.Map<String, Object> clienteData = new java.util.HashMap<>();
        clienteData.put("idCliente", cliente.getIdCliente());
        clienteData.put("nombre", cliente.getNombre());
        clienteData.put("apellido", cliente.getApellido());
        clienteData.put("documento", cliente.getRucCi());
        clienteData.put("telefono", cliente.getTelefono());
        clienteData.put("email", cliente.getEmail());
        clienteData.put("direccion", cliente.getDireccion());
        datos.put("cliente", clienteData);

        // Datos del presupuesto (si existe)
        if (presupuesto != null) {
            java.util.Map<String, Object> presupuestoData = new java.util.HashMap<>();
            presupuestoData.put("idPresupuesto", presupuesto.getIdPresupuesto());
            presupuestoData.put("numeroPresupuesto", presupuesto.getNumeroPresupuesto());
            datos.put("presupuesto", presupuestoData);
        }

        // Items para facturar
        datos.put("itemsPresupuesto", itemsPresupuesto);
        datos.put("itemsRepuestos", itemsRepuestos);

        // Totales
        datos.put("subtotal", subtotalTotal);
        datos.put("iva", iva);
        datos.put("total", total);
        datos.put("descuento", BigDecimal.ZERO);

        return datos;
    }
}
