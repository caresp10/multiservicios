package com.empresa.multiservices.service;

import com.empresa.multiservices.dto.request.PresupuestoItemRequest;
import com.empresa.multiservices.dto.request.PresupuestoRequest;
import com.empresa.multiservices.exception.ResourceNotFoundException;
import com.empresa.multiservices.model.*;
import com.empresa.multiservices.model.enums.EstadoPresupuesto;
import com.empresa.multiservices.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class PresupuestoService {

    @Autowired
    private PresupuestoRepository presupuestoRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private ServicioCatalogoRepository servicioCatalogoRepository;

    @Autowired
    private RepuestoRepository repuestoRepository;

    public Presupuesto crear(PresupuestoRequest request) {
        // Validar que existe el pedido
        Pedido pedido = pedidoRepository.findById(request.getIdPedido())
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado"));

        // Validar que el pedido no esté ya en proceso (con OT o facturado)
        if (pedido.getTieneOt() != null && pedido.getTieneOt()) {
            throw new RuntimeException("No se puede crear un presupuesto para un pedido que ya tiene una Orden de Trabajo");
        }

        // Validar que el pedido esté en un estado válido para crear presupuesto
        if (pedido.getEstado() == com.empresa.multiservices.model.enums.EstadoPedido.OT_GENERADA ||
            pedido.getEstado() == com.empresa.multiservices.model.enums.EstadoPedido.OT_EN_PROCESO ||
            pedido.getEstado() == com.empresa.multiservices.model.enums.EstadoPedido.OT_TERMINADA ||
            pedido.getEstado() == com.empresa.multiservices.model.enums.EstadoPedido.FACTURADO ||
            pedido.getEstado() == com.empresa.multiservices.model.enums.EstadoPedido.CANCELADO) {
            throw new RuntimeException("No se puede crear un presupuesto para un pedido en estado: " + pedido.getEstado());
        }

        // Generar número de presupuesto
        String numeroPresupuesto = generarNumeroPresupuesto();

        // Crear el presupuesto
        Presupuesto presupuesto = Presupuesto.builder()
                .numeroPresupuesto(numeroPresupuesto)
                .pedido(pedido)
                .fechaVencimiento(request.getFechaVencimiento())
                .descuento(request.getDescuento() != null ? request.getDescuento() : BigDecimal.ZERO)
                .iva(request.getIva())
                .total(request.getTotal())
                .estado(EstadoPresupuesto.valueOf(request.getEstado()))
                .observaciones(request.getObservaciones())
                .condicionesPago(request.getCondicionesPago())
                .validezDias(request.getValidezDias() != null ? request.getValidezDias() : 15)
                .items(new ArrayList<>())
                .build();

        // Crear los items y calcular el subtotal
        BigDecimal subtotalCalculado = BigDecimal.ZERO;
        for (PresupuestoItemRequest itemRequest : request.getItems()) {
            BigDecimal subtotalItem = itemRequest.getCantidad().multiply(itemRequest.getPrecioUnitario());

            // Construir el item con los campos básicos
            PresupuestoItem.PresupuestoItemBuilder itemBuilder = PresupuestoItem.builder()
                    .presupuesto(presupuesto)
                    .tipoItem(itemRequest.getTipoItem() != null ? itemRequest.getTipoItem() : PresupuestoItem.TipoItem.MANUAL)
                    .descripcion(itemRequest.getDescripcion())
                    .cantidad(itemRequest.getCantidad())
                    .precioUnitario(itemRequest.getPrecioUnitario())
                    .subtotal(subtotalItem);

            // Si es un servicio del catálogo, cargar la referencia
            if (itemRequest.getIdServicio() != null) {
                ServicioCatalogo servicio = servicioCatalogoRepository.findById(itemRequest.getIdServicio())
                        .orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado con ID: " + itemRequest.getIdServicio()));
                itemBuilder.servicio(servicio);
            }

            // Si es un repuesto, cargar la referencia
            if (itemRequest.getIdRepuesto() != null) {
                Repuesto repuesto = repuestoRepository.findById(itemRequest.getIdRepuesto())
                        .orElseThrow(() -> new ResourceNotFoundException("Repuesto no encontrado con ID: " + itemRequest.getIdRepuesto()));
                itemBuilder.repuesto(repuesto);
            }

            PresupuestoItem item = itemBuilder.build();
            presupuesto.getItems().add(item);
            subtotalCalculado = subtotalCalculado.add(subtotalItem);
        }

        // Establecer el subtotal calculado
        presupuesto.setSubtotal(subtotalCalculado);

        // Actualizar el pedido para indicar que tiene presupuesto
        pedido.setTienePresupuesto(true);
        // Cambiar el estado del pedido a PRESUPUESTO_GENERADO cuando se crea el presupuesto
        pedido.setEstado(com.empresa.multiservices.model.enums.EstadoPedido.PRESUPUESTO_GENERADO);
        System.out.println("✅ Presupuesto creado - Pedido actualizado a PRESUPUESTO_GENERADO");
        pedidoRepository.save(pedido);

        return presupuestoRepository.save(presupuesto);
    }

    @Transactional(readOnly = true)
    public List<Presupuesto> listar() {
        // Obtener todos los presupuestos con eager fetch de pedido y cliente
        return presupuestoRepository.findAll().stream()
                .peek(presupuesto -> {
                    // Forzar la carga de pedido y cliente
                    presupuesto.getPedido().getCliente().getNombre();
                    // Forzar la carga de items
                    presupuesto.getItems().size();
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public Presupuesto obtenerPorId(Long id) {
        Presupuesto presupuesto = presupuestoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Presupuesto no encontrado"));

        // Forzar la carga de relaciones LAZY
        presupuesto.getPedido().getCliente().getNombre();
        presupuesto.getItems().size();

        return presupuesto;
    }

    public Presupuesto actualizar(Long id, PresupuestoRequest request) {
        Presupuesto presupuesto = presupuestoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Presupuesto no encontrado"));

        // Guardar el estado anterior
        EstadoPresupuesto estadoAnterior = presupuesto.getEstado();

        // Actualizar datos del presupuesto
        presupuesto.setFechaVencimiento(request.getFechaVencimiento());
        presupuesto.setDescuento(request.getDescuento() != null ? request.getDescuento() : BigDecimal.ZERO);
        presupuesto.setIva(request.getIva());
        presupuesto.setTotal(request.getTotal());
        presupuesto.setEstado(EstadoPresupuesto.valueOf(request.getEstado()));
        presupuesto.setObservaciones(request.getObservaciones());
        presupuesto.setCondicionesPago(request.getCondicionesPago());
        presupuesto.setValidezDias(request.getValidezDias() != null ? request.getValidezDias() : 15);

        // Si el estado es ACEPTADO o RECHAZADO, guardar la fecha de respuesta
        if (presupuesto.getEstado() == EstadoPresupuesto.ACEPTADO ||
            presupuesto.getEstado() == EstadoPresupuesto.RECHAZADO) {
            presupuesto.setFechaRespuesta(LocalDateTime.now());
        }

        // Actualizar el estado del pedido según el cambio de estado del presupuesto
        Pedido pedido = presupuesto.getPedido();
        EstadoPresupuesto nuevoEstado = presupuesto.getEstado();

        // Solo actualizar si hay un cambio real de estado
        if (estadoAnterior != nuevoEstado) {
            System.out.println("🔄 Cambio de estado de presupuesto: " + estadoAnterior + " -> " + nuevoEstado);
            System.out.println("📋 Estado actual del pedido antes del cambio: " + pedido.getEstado());

            switch (nuevoEstado) {
                case ACEPTADO:
                    // El pedido pasa a PRESUPUESTO_ACEPTADO cuando el presupuesto es aceptado
                    pedido.setEstado(com.empresa.multiservices.model.enums.EstadoPedido.PRESUPUESTO_ACEPTADO);
                    pedidoRepository.save(pedido);
                    System.out.println("✅ Pedido actualizado a PRESUPUESTO_ACEPTADO");
                    break;

                case RECHAZADO:
                    // El pedido pasa a PRESUPUESTO_RECHAZADO cuando el presupuesto es rechazado
                    pedido.setEstado(com.empresa.multiservices.model.enums.EstadoPedido.PRESUPUESTO_RECHAZADO);
                    pedidoRepository.save(pedido);
                    System.out.println("✅ Pedido actualizado a PRESUPUESTO_RECHAZADO");
                    break;

                case PENDIENTE:
                    // Si vuelve a PENDIENTE, el pedido vuelve a PRESUPUESTO_GENERADO
                    pedido.setEstado(com.empresa.multiservices.model.enums.EstadoPedido.PRESUPUESTO_GENERADO);
                    pedidoRepository.save(pedido);
                    System.out.println("✅ Pedido actualizado a PRESUPUESTO_GENERADO");
                    break;

                case VENCIDO:
                    // El presupuesto venció, el pedido pasa a CANCELADO
                    pedido.setEstado(com.empresa.multiservices.model.enums.EstadoPedido.CANCELADO);
                    pedidoRepository.save(pedido);
                    System.out.println("✅ Pedido actualizado a CANCELADO");
                    break;
            }

            System.out.println("📋 Estado del pedido después del cambio: " + pedido.getEstado());
        } else {
            System.out.println("⚠️ No hay cambio de estado (anterior: " + estadoAnterior + ", nuevo: " + nuevoEstado + ")");
        }

        // Eliminar los items antiguos y crear nuevos
        presupuesto.getItems().clear();

        // Crear los nuevos items y calcular el subtotal
        BigDecimal subtotalCalculado = BigDecimal.ZERO;
        for (PresupuestoItemRequest itemRequest : request.getItems()) {
            BigDecimal subtotalItem = itemRequest.getCantidad().multiply(itemRequest.getPrecioUnitario());

            // Construir el item con los campos básicos
            PresupuestoItem.PresupuestoItemBuilder itemBuilder = PresupuestoItem.builder()
                    .presupuesto(presupuesto)
                    .tipoItem(itemRequest.getTipoItem() != null ? itemRequest.getTipoItem() : PresupuestoItem.TipoItem.MANUAL)
                    .descripcion(itemRequest.getDescripcion())
                    .cantidad(itemRequest.getCantidad())
                    .precioUnitario(itemRequest.getPrecioUnitario())
                    .subtotal(subtotalItem);

            // Si es un servicio del catálogo, cargar la referencia
            if (itemRequest.getIdServicio() != null) {
                ServicioCatalogo servicio = servicioCatalogoRepository.findById(itemRequest.getIdServicio())
                        .orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado con ID: " + itemRequest.getIdServicio()));
                itemBuilder.servicio(servicio);
            }

            // Si es un repuesto, cargar la referencia
            if (itemRequest.getIdRepuesto() != null) {
                Repuesto repuesto = repuestoRepository.findById(itemRequest.getIdRepuesto())
                        .orElseThrow(() -> new ResourceNotFoundException("Repuesto no encontrado con ID: " + itemRequest.getIdRepuesto()));
                itemBuilder.repuesto(repuesto);
            }

            PresupuestoItem item = itemBuilder.build();
            presupuesto.getItems().add(item);
            subtotalCalculado = subtotalCalculado.add(subtotalItem);
        }

        // Establecer el subtotal calculado
        presupuesto.setSubtotal(subtotalCalculado);

        return presupuestoRepository.save(presupuesto);
    }

    public void eliminar(Long id) {
        Presupuesto presupuesto = presupuestoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Presupuesto no encontrado"));

        // Actualizar el pedido para indicar que ya no tiene presupuesto
        Pedido pedido = presupuesto.getPedido();
        pedido.setTienePresupuesto(false);
        pedidoRepository.save(pedido);

        // Eliminar el presupuesto (los items se eliminan automáticamente por CascadeType.ALL)
        presupuestoRepository.delete(presupuesto);
    }

    @Transactional(readOnly = true)
    public List<Presupuesto> obtenerPresupuestosAceptadosPorPedido(Long idPedido) {
        return presupuestoRepository.findByPedidoIdPedidoAndEstado(idPedido, EstadoPresupuesto.ACEPTADO);
    }

    private String generarNumeroPresupuesto() {
        String fecha = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = presupuestoRepository.count() + 1;
        return String.format("PRES-%s-%04d", fecha, count);
    }
}
