package com.empresa.multiservices.service;

import com.empresa.multiservices.model.*;
import com.empresa.multiservices.model.enums.EstadoFactura;
import com.empresa.multiservices.model.enums.EstadoPedido;
import com.empresa.multiservices.repository.ClienteRepository;
import com.empresa.multiservices.repository.FacturaRepository;
import com.empresa.multiservices.repository.OrdenTrabajoRepository;
import com.empresa.multiservices.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
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

    @Transactional(readOnly = true)
    public List<Factura> listarTodas() {
        List<Factura> facturas = facturaRepository.findAll();
        // Forzar la carga de los items para cada factura (evitar lazy loading)
        for (Factura f : facturas) {
            f.getItems().size();
        }
        return facturas;
    }

    @Transactional(readOnly = true)
    public Factura obtenerPorId(Long id) {
        return facturaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Factura no encontrada"));
    }

    @Transactional
    public Factura crear(Factura factura) {
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

        Factura saved = facturaRepository.save(factura);

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
