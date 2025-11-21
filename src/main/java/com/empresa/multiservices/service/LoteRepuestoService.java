package com.empresa.multiservices.service;

import com.empresa.multiservices.exception.ResourceNotFoundException;
import com.empresa.multiservices.model.*;
import com.empresa.multiservices.repository.LoteRepuestoRepository;
import com.empresa.multiservices.repository.RepuestoRepository;
import com.empresa.multiservices.repository.MovimientoStockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class LoteRepuestoService {

    @Autowired
    private LoteRepuestoRepository loteRepository;

    @Autowired
    private RepuestoRepository repuestoRepository;

    @Autowired
    private MovimientoStockRepository movimientoStockRepository;

    /**
     * Crea un nuevo lote de repuesto (usado al registrar una compra)
     */
    public LoteRepuesto crearLote(LoteRepuesto lote) {
        // Validaciones
        if (lote.getRepuesto() == null) {
            throw new IllegalArgumentException("El repuesto es obligatorio");
        }
        if (lote.getProveedor() == null) {
            throw new IllegalArgumentException("El proveedor es obligatorio");
        }
        if (lote.getCantidadInicial() == null || lote.getCantidadInicial() <= 0) {
            throw new IllegalArgumentException("La cantidad inicial debe ser mayor a 0");
        }

        // Establecer cantidad disponible igual a inicial
        lote.setCantidadDisponible(lote.getCantidadInicial());
        lote.setActivo(true);

        LoteRepuesto saved = loteRepository.save(lote);

        // Actualizar stock total del repuesto
        actualizarStockRepuesto(lote.getRepuesto().getIdRepuesto());

        System.out.println("Lote creado - Repuesto: " + lote.getRepuesto().getCodigo() +
                          ", Cantidad: " + lote.getCantidadInicial() +
                          ", Proveedor: " + lote.getProveedor().getNombre());

        return saved;
    }

    /**
     * Descuenta stock de los lotes usando método FIFO (primero en entrar, primero en salir)
     * Retorna la lista de lotes afectados con las cantidades descontadas
     */
    public List<LoteDescuento> descontarStockFIFO(Long idRepuesto, int cantidadRequerida,
                                                   String referencia, Usuario usuario, Factura factura) {
        List<LoteRepuesto> lotesDisponibles = loteRepository.findLotesDisponiblesFIFO(idRepuesto);

        if (lotesDisponibles.isEmpty()) {
            throw new RuntimeException("No hay lotes disponibles para el repuesto ID: " + idRepuesto);
        }

        // Verificar stock total
        int stockTotal = lotesDisponibles.stream()
                .mapToInt(LoteRepuesto::getCantidadDisponible)
                .sum();

        if (stockTotal < cantidadRequerida) {
            throw new RuntimeException("Stock insuficiente. Disponible: " + stockTotal +
                                      ", Requerido: " + cantidadRequerida);
        }

        List<LoteDescuento> lotesAfectados = new ArrayList<>();
        int cantidadPendiente = cantidadRequerida;

        for (LoteRepuesto lote : lotesDisponibles) {
            if (cantidadPendiente <= 0) break;

            int cantidadADescontar = Math.min(lote.getCantidadDisponible(), cantidadPendiente);
            int stockAnterior = lote.getCantidadDisponible();

            lote.descontarStock(cantidadADescontar);
            loteRepository.save(lote);

            // Registrar movimiento de stock
            MovimientoStock movimiento = MovimientoStock.builder()
                    .repuesto(lote.getRepuesto())
                    .tipoMovimiento(MovimientoStock.TipoMovimiento.SALIDA)
                    .cantidad(cantidadADescontar)
                    .motivo(MovimientoStock.MotivoMovimiento.VENTA)
                    .referencia(referencia + " - Lote: " + lote.getIdLote())
                    .stockAnterior(stockAnterior)
                    .stockNuevo(lote.getCantidadDisponible())
                    .usuario(usuario)
                    .factura(factura)
                    .fechaMovimiento(LocalDateTime.now())
                    .observaciones("Descuento FIFO del lote " + lote.getIdLote() +
                                  " (Proveedor: " + lote.getProveedor().getNombre() + ")")
                    .build();

            movimientoStockRepository.save(movimiento);

            lotesAfectados.add(new LoteDescuento(lote, cantidadADescontar, lote.getPrecioCostoUnitario()));
            cantidadPendiente -= cantidadADescontar;

            System.out.println("  - Lote " + lote.getIdLote() + ": descontado " + cantidadADescontar +
                             " unidades (quedan " + lote.getCantidadDisponible() + ")");
        }

        // Actualizar stock total del repuesto
        actualizarStockRepuesto(idRepuesto);

        return lotesAfectados;
    }

    /**
     * Devuelve stock a los lotes (usado al anular factura)
     * Intenta devolver al lote original o al más reciente si no es posible
     */
    public void devolverStockALotes(Long idRepuesto, int cantidad, String referencia,
                                     Usuario usuario, Factura factura) {
        // Buscar lotes del repuesto ordenados por fecha desc (más reciente primero)
        List<LoteRepuesto> lotes = loteRepository.findByRepuestoIdRepuestoOrderByFechaIngresoDesc(idRepuesto);

        if (lotes.isEmpty()) {
            throw new RuntimeException("No hay lotes registrados para el repuesto ID: " + idRepuesto);
        }

        // Devolver al lote más reciente que tenga espacio
        int cantidadPendiente = cantidad;
        for (LoteRepuesto lote : lotes) {
            if (cantidadPendiente <= 0) break;

            int espacioDisponible = lote.getCantidadInicial() - lote.getCantidadDisponible();
            if (espacioDisponible > 0) {
                int cantidadADevolver = Math.min(espacioDisponible, cantidadPendiente);
                int stockAnterior = lote.getCantidadDisponible();

                lote.devolverStock(cantidadADevolver);
                loteRepository.save(lote);

                // Registrar movimiento
                MovimientoStock movimiento = MovimientoStock.builder()
                        .repuesto(lote.getRepuesto())
                        .tipoMovimiento(MovimientoStock.TipoMovimiento.ENTRADA)
                        .cantidad(cantidadADevolver)
                        .motivo(MovimientoStock.MotivoMovimiento.DEVOLUCION)
                        .referencia(referencia + " - Lote: " + lote.getIdLote())
                        .stockAnterior(stockAnterior)
                        .stockNuevo(lote.getCantidadDisponible())
                        .usuario(usuario)
                        .factura(factura)
                        .fechaMovimiento(LocalDateTime.now())
                        .observaciones("Devolución al lote " + lote.getIdLote())
                        .build();

                movimientoStockRepository.save(movimiento);
                cantidadPendiente -= cantidadADevolver;
            }
        }

        // Si queda cantidad pendiente, crear un lote de ajuste
        if (cantidadPendiente > 0) {
            System.out.println("ADVERTENCIA: Quedaron " + cantidadPendiente +
                             " unidades sin poder devolver a lotes existentes");
        }

        // Actualizar stock total del repuesto
        actualizarStockRepuesto(idRepuesto);
    }

    /**
     * Actualiza el stock_actual del repuesto basado en la suma de todos los lotes
     */
    public void actualizarStockRepuesto(Long idRepuesto) {
        Integer stockTotal = loteRepository.calcularStockTotalDisponible(idRepuesto);
        Repuesto repuesto = repuestoRepository.findById(idRepuesto)
                .orElseThrow(() -> new ResourceNotFoundException("Repuesto no encontrado"));

        repuesto.setStockActual(stockTotal != null ? stockTotal : 0);
        repuestoRepository.save(repuesto);

        System.out.println("Stock actualizado para " + repuesto.getCodigo() + ": " + repuesto.getStockActual());
    }

    /**
     * Obtiene el stock disponible total de un repuesto
     */
    @Transactional(readOnly = true)
    public int obtenerStockDisponible(Long idRepuesto) {
        Integer stock = loteRepository.calcularStockTotalDisponible(idRepuesto);
        return stock != null ? stock : 0;
    }

    /**
     * Verifica si hay stock suficiente en los lotes
     */
    @Transactional(readOnly = true)
    public boolean hayStockSuficiente(Long idRepuesto, int cantidad) {
        return loteRepository.hayStockSuficiente(idRepuesto, cantidad);
    }

    /**
     * Obtiene los lotes de un repuesto con stock disponible
     */
    @Transactional(readOnly = true)
    public List<LoteRepuesto> obtenerLotesDisponibles(Long idRepuesto) {
        return loteRepository.findLotesDisponiblesFIFO(idRepuesto);
    }

    /**
     * Obtiene todos los lotes de un repuesto
     */
    @Transactional(readOnly = true)
    public List<LoteRepuesto> obtenerLotesPorRepuesto(Long idRepuesto) {
        return loteRepository.findByRepuestoIdRepuestoOrderByFechaIngresoDesc(idRepuesto);
    }

    /**
     * Obtiene lotes próximos a vencer (por defecto 30 días)
     */
    @Transactional(readOnly = true)
    public List<LoteRepuesto> obtenerLotesProximosAVencer(int dias) {
        LocalDate fechaLimite = LocalDate.now().plusDays(dias);
        return loteRepository.findLotesProximosAVencer(fechaLimite);
    }

    /**
     * Obtiene lotes ya vencidos que aún tienen stock
     */
    @Transactional(readOnly = true)
    public List<LoteRepuesto> obtenerLotesVencidos() {
        return loteRepository.findLotesVencidosConStock();
    }

    /**
     * Obtiene los proveedores de un repuesto (basado en lotes)
     */
    @Transactional(readOnly = true)
    public List<Proveedor> obtenerProveedoresPorRepuesto(Long idRepuesto) {
        return loteRepository.findProveedoresPorRepuesto(idRepuesto);
    }

    /**
     * Obtiene el último precio de costo de un repuesto
     */
    @Transactional(readOnly = true)
    public BigDecimal obtenerUltimoPrecioCosto(Long idRepuesto) {
        return loteRepository.findUltimoPrecioCosto(idRepuesto);
    }

    /**
     * Clase auxiliar para representar el descuento de un lote
     */
    public static class LoteDescuento {
        private final LoteRepuesto lote;
        private final int cantidadDescontada;
        private final BigDecimal precioCosto;

        public LoteDescuento(LoteRepuesto lote, int cantidadDescontada, BigDecimal precioCosto) {
            this.lote = lote;
            this.cantidadDescontada = cantidadDescontada;
            this.precioCosto = precioCosto;
        }

        public LoteRepuesto getLote() { return lote; }
        public int getCantidadDescontada() { return cantidadDescontada; }
        public BigDecimal getPrecioCosto() { return precioCosto; }
    }
}
