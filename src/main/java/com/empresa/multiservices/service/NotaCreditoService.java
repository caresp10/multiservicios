package com.empresa.multiservices.service;

import com.empresa.multiservices.exception.ResourceNotFoundException;
import com.empresa.multiservices.model.*;
import com.empresa.multiservices.model.enums.*;
import com.empresa.multiservices.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Transactional
public class NotaCreditoService {

    @Autowired
    private NotaCreditoRepository notaCreditoRepository;

    @Autowired
    private FacturaRepository facturaRepository;

    @Autowired
    private FacturaItemRepository facturaItemRepository;

    @Autowired
    private LoteRepuestoRepository loteRepository;

    @Autowired
    private RepuestoRepository repuestoRepository;

    @Autowired
    private LoteRepuestoService loteRepuestoService;

    /**
     * Crear una Nota de Crédito
     * - Valida la factura
     * - Crea la NC con sus detalles
     * - Devuelve el stock si hay repuestos
     * - Actualiza la factura
     */
    public NotaCredito crear(NotaCredito notaCredito) {
        // 1. Validar que la factura exista
        Factura factura = facturaRepository.findById(notaCredito.getFactura().getIdFactura())
                .orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada"));

        // 2. Validar que la factura NO esté anulada
        if (factura.getEstado() == EstadoFactura.ANULADA) {
            throw new IllegalArgumentException("No se puede crear una nota de crédito para una factura anulada");
        }

        // 3. Validar que no se exceda el monto de la factura
        BigDecimal totalNotasCredito = factura.getMontoNotasCredito() != null
            ? factura.getMontoNotasCredito()
            : BigDecimal.ZERO;
        BigDecimal nuevoTotal = totalNotasCredito.add(notaCredito.getTotal());

        if (nuevoTotal.compareTo(factura.getTotal()) > 0) {
            throw new IllegalArgumentException(
                "El monto total de notas de crédito no puede exceder el monto de la factura original");
        }

        // 4. Generar número de NC
        if (notaCredito.getNumeroNotaCredito() == null || notaCredito.getNumeroNotaCredito().isEmpty()) {
            notaCredito.setNumeroNotaCredito(generarNumeroNC());
        }

        // 5. Asociar la NC a cada detalle y cargar FacturaItems completos
        if (notaCredito.getDetalles() != null) {
            for (DetalleNotaCredito detalle : notaCredito.getDetalles()) {
                detalle.setNotaCredito(notaCredito);

                // Cargar el FacturaItem completo desde la BD
                FacturaItem item = facturaItemRepository.findById(detalle.getFacturaItem().getIdItem())
                    .orElseThrow(() -> new ResourceNotFoundException("Item de factura no encontrado"));

                // Asignar el item completo al detalle
                detalle.setFacturaItem(item);

                // Validar que la cantidad devuelta no exceda la cantidad facturada
                // Como cantidadDevuelta es Integer y cantidad es BigDecimal, convertimos a BigDecimal para comparar
                BigDecimal cantidadDevuelta = BigDecimal.valueOf(detalle.getCantidadDevuelta());
                BigDecimal cantidadFacturada = item.getCantidad();

                // Usamos setScale para normalizar antes de comparar
                if (cantidadDevuelta.compareTo(cantidadFacturada.setScale(0, java.math.RoundingMode.FLOOR)) > 0) {
                    throw new IllegalArgumentException(
                        String.format("La cantidad devuelta (%s) no puede ser mayor que la cantidad facturada (%s) para el item: %s",
                            cantidadDevuelta, cantidadFacturada, item.getDescripcion()));
                }
            }
        }

        // 6. Recalcular totales
        notaCredito.recalcularTotales();

        // 7. Guardar la NC
        NotaCredito ncGuardada = notaCreditoRepository.save(notaCredito);

        // 8. Devolver stock de repuestos
        devolverStock(ncGuardada);

        // 9. Actualizar factura
        actualizarFactura(factura, ncGuardada.getTotal());

        return ncGuardada;
    }

    /**
     * Aplicar una Nota de Crédito
     * Cambia el estado de PENDIENTE a APLICADA
     */
    public NotaCredito aplicar(Long idNotaCredito) {
        NotaCredito nc = notaCreditoRepository.findById(idNotaCredito)
                .orElseThrow(() -> new ResourceNotFoundException("Nota de crédito no encontrada"));

        if (nc.getEstado() != EstadoNotaCredito.PENDIENTE) {
            throw new IllegalArgumentException("Solo se pueden aplicar notas de crédito en estado PENDIENTE");
        }

        nc.setEstado(EstadoNotaCredito.APLICADA);
        nc.setFechaAplicacion(LocalDateTime.now());

        return notaCreditoRepository.save(nc);
    }

    /**
     * Anular una Nota de Crédito
     * Al anular, se revierte el stock que fue devuelto al inventario
     */
    public NotaCredito anular(Long idNotaCredito, String motivo) {
        NotaCredito nc = notaCreditoRepository.findById(idNotaCredito)
                .orElseThrow(() -> new ResourceNotFoundException("Nota de crédito no encontrada"));

        if (nc.getEstado() == EstadoNotaCredito.ANULADA) {
            throw new IllegalArgumentException("La nota de crédito ya está anulada");
        }

        if (nc.getEstado() == EstadoNotaCredito.APLICADA) {
            throw new IllegalArgumentException(
                "No se puede anular una nota de crédito ya aplicada. Contacte al administrador.");
        }

        nc.setEstado(EstadoNotaCredito.ANULADA);
        nc.setObservaciones((nc.getObservaciones() != null ? nc.getObservaciones() + "\n" : "")
            + "ANULADA: " + motivo);

        // Revertir el stock que fue devuelto (descontarlo nuevamente)
        revertirStockDevuelto(nc);

        // Revertir el monto en la factura
        Factura factura = nc.getFactura();
        BigDecimal montoActual = factura.getMontoNotasCredito() != null
            ? factura.getMontoNotasCredito()
            : BigDecimal.ZERO;
        factura.setMontoNotasCredito(montoActual.subtract(nc.getTotal()));

        if (factura.getMontoNotasCredito().compareTo(BigDecimal.ZERO) == 0) {
            factura.setTieneNotaCredito(false);
        }

        facturaRepository.save(factura);

        return notaCreditoRepository.save(nc);
    }

    /**
     * Revertir el stock que fue devuelto al anular una NC
     * Descuenta del inventario las unidades que fueron devueltas
     */
    private void revertirStockDevuelto(NotaCredito notaCredito) {
        for (DetalleNotaCredito detalle : notaCredito.getDetalles()) {
            FacturaItem item = detalle.getFacturaItem();

            // Solo procesar si es un repuesto (no un servicio)
            if (item.getRepuesto() != null) {
                Repuesto repuesto = item.getRepuesto();
                Integer cantidadADescontar = detalle.getCantidadDevuelta();

                // Buscar lotes del repuesto con stock disponible (FIFO para descontar)
                List<LoteRepuesto> lotes = loteRepository.findLotesDisponiblesFIFO(repuesto.getIdRepuesto());

                int restante = cantidadADescontar;
                for (LoteRepuesto lote : lotes) {
                    if (restante <= 0) break;

                    // Descontar del lote
                    int cantidadAQuitar = Math.min(restante, lote.getCantidadDisponible());
                    lote.setCantidadDisponible(lote.getCantidadDisponible() - cantidadAQuitar);
                    loteRepository.save(lote);

                    restante -= cantidadAQuitar;

                    System.out.println("Stock revertido del lote " + lote.getIdLote() +
                                     ": -" + cantidadAQuitar + " unidades (anulación NC)");
                }

                if (restante > 0) {
                    // Si no alcanzó el stock para descontar, lanzar advertencia
                    System.err.println("ADVERTENCIA: No hay suficiente stock para revertir completamente la NC. " +
                                     "Faltaron " + restante + " unidades del repuesto: " + repuesto.getNombre());
                }

                // Actualizar stock total del repuesto
                loteRepuestoService.actualizarStockRepuesto(repuesto.getIdRepuesto());
            }
        }
    }

    /**
     * Devolver stock a los lotes (FIFO inverso)
     * Solo para repuestos, los servicios no tienen stock
     */
    private void devolverStock(NotaCredito notaCredito) {
        for (DetalleNotaCredito detalle : notaCredito.getDetalles()) {
            FacturaItem item = detalle.getFacturaItem();

            // Solo procesar si es un repuesto (no un servicio)
            if (item.getRepuesto() != null) {
                Repuesto repuesto = item.getRepuesto();
                Integer cantidadADevolver = detalle.getCantidadDevuelta();

                // Buscar lotes del repuesto ordenados por fecha de ingreso (más recientes primero)
                // Ya que se descontaron con FIFO, devolvemos a los más recientes
                List<LoteRepuesto> lotes = loteRepository.findByRepuestoIdRepuestoAndActivoOrderByFechaIngresoDesc(
                    repuesto.getIdRepuesto(), true);

                int restante = cantidadADevolver;
                for (LoteRepuesto lote : lotes) {
                    if (restante <= 0) break;

                    // Devolver al lote
                    int cantidadAgregar = Math.min(restante, cantidadADevolver);
                    lote.setCantidadDisponible(lote.getCantidadDisponible() + cantidadAgregar);
                    loteRepository.save(lote);

                    restante -= cantidadAgregar;

                    System.out.println("Stock devuelto al lote " + lote.getIdLote() +
                                     ": +" + cantidadAgregar + " unidades");
                }

                // Actualizar stock total del repuesto
                loteRepuestoService.actualizarStockRepuesto(repuesto.getIdRepuesto());
            }
        }
    }

    /**
     * Actualizar datos de la factura cuando se crea una NC
     */
    private void actualizarFactura(Factura factura, BigDecimal montoNC) {
        factura.setTieneNotaCredito(true);

        BigDecimal montoActual = factura.getMontoNotasCredito() != null
            ? factura.getMontoNotasCredito()
            : BigDecimal.ZERO;

        factura.setMontoNotasCredito(montoActual.add(montoNC));

        facturaRepository.save(factura);
    }

    /**
     * Generar número automático de NC
     * Formato: NC-YYYYMMDD-####
     */
    public String generarNumeroNC() {
        LocalDate hoy = LocalDate.now();
        String prefijo = String.format("NC-%04d%02d%02d-",
            hoy.getYear(), hoy.getMonthValue(), hoy.getDayOfMonth());

        // Buscar el último número del día
        LocalDateTime iniciodia = hoy.atStartOfDay();
        LocalDateTime finDia = hoy.plusDays(1).atStartOfDay();

        List<NotaCredito> ncsDelDia = notaCreditoRepository.findByFechaEmisionBetween(iniciodia, finDia);

        int siguienteNumero = ncsDelDia.size() + 1;
        return prefijo + String.format("%04d", siguienteNumero);
    }

    // Métodos de consulta
    @Transactional(readOnly = true)
    public List<NotaCredito> listarTodas() {
        return notaCreditoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public NotaCredito obtenerPorId(Long id) {
        return notaCreditoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nota de crédito no encontrada"));
    }

    @Transactional(readOnly = true)
    public List<NotaCredito> listarPorFactura(Long idFactura) {
        return notaCreditoRepository.findByFacturaIdFactura(idFactura);
    }

    @Transactional(readOnly = true)
    public List<NotaCredito> listarPorEstado(EstadoNotaCredito estado) {
        return notaCreditoRepository.findByEstado(estado);
    }

    @Transactional(readOnly = true)
    public NotaCredito obtenerPorNumero(String numeroNC) {
        return notaCreditoRepository.findByNumeroNotaCredito(numeroNC)
                .orElseThrow(() -> new ResourceNotFoundException("Nota de crédito no encontrada"));
    }
}
