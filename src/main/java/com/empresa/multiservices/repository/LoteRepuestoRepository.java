package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.LoteRepuesto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LoteRepuestoRepository extends JpaRepository<LoteRepuesto, Long> {

    // Obtener lotes con stock disponible de un repuesto, ordenados por fecha (FIFO)
    @Query("SELECT l FROM LoteRepuesto l WHERE l.repuesto.idRepuesto = :idRepuesto " +
           "AND l.cantidadDisponible > 0 AND l.activo = true " +
           "ORDER BY l.fechaIngreso ASC")
    List<LoteRepuesto> findLotesDisponiblesFIFO(@Param("idRepuesto") Long idRepuesto);

    // Obtener todos los lotes de un repuesto
    List<LoteRepuesto> findByRepuestoIdRepuestoOrderByFechaIngresoDesc(Long idRepuesto);

    // Obtener lotes por proveedor
    List<LoteRepuesto> findByProveedorIdProveedorOrderByFechaIngresoDesc(Long idProveedor);

    // Obtener lotes de una compra
    List<LoteRepuesto> findByCompraIdCompraOrderByFechaIngresoDesc(Long idCompra);

    // Obtener stock total disponible de un repuesto (suma de todos los lotes)
    @Query("SELECT COALESCE(SUM(l.cantidadDisponible), 0) FROM LoteRepuesto l " +
           "WHERE l.repuesto.idRepuesto = :idRepuesto AND l.activo = true")
    Integer calcularStockTotalDisponible(@Param("idRepuesto") Long idRepuesto);

    // Obtener lotes próximos a vencer
    @Query("SELECT l FROM LoteRepuesto l WHERE l.fechaVencimiento IS NOT NULL " +
           "AND l.fechaVencimiento <= :fechaLimite AND l.cantidadDisponible > 0 " +
           "AND l.activo = true ORDER BY l.fechaVencimiento ASC")
    List<LoteRepuesto> findLotesProximosAVencer(@Param("fechaLimite") LocalDate fechaLimite);

    // Obtener lotes vencidos con stock
    @Query("SELECT l FROM LoteRepuesto l WHERE l.fechaVencimiento IS NOT NULL " +
           "AND l.fechaVencimiento < CURRENT_DATE AND l.cantidadDisponible > 0 " +
           "AND l.activo = true ORDER BY l.fechaVencimiento ASC")
    List<LoteRepuesto> findLotesVencidosConStock();

    // Obtener lotes agotados
    @Query("SELECT l FROM LoteRepuesto l WHERE l.cantidadDisponible = 0 AND l.activo = true")
    List<LoteRepuesto> findLotesAgotados();

    // Verificar si hay stock suficiente en lotes para un repuesto
    @Query("SELECT CASE WHEN COALESCE(SUM(l.cantidadDisponible), 0) >= :cantidad THEN true ELSE false END " +
           "FROM LoteRepuesto l WHERE l.repuesto.idRepuesto = :idRepuesto AND l.activo = true")
    boolean hayStockSuficiente(@Param("idRepuesto") Long idRepuesto, @Param("cantidad") Integer cantidad);

    // Obtener proveedores de un repuesto (a través de lotes)
    @Query("SELECT DISTINCT l.proveedor FROM LoteRepuesto l " +
           "WHERE l.repuesto.idRepuesto = :idRepuesto AND l.activo = true")
    List<com.empresa.multiservices.model.Proveedor> findProveedoresPorRepuesto(@Param("idRepuesto") Long idRepuesto);

    // Obtener último precio de costo de un repuesto
    @Query("SELECT l.precioCostoUnitario FROM LoteRepuesto l " +
           "WHERE l.repuesto.idRepuesto = :idRepuesto AND l.activo = true " +
           "ORDER BY l.fechaIngreso DESC LIMIT 1")
    java.math.BigDecimal findUltimoPrecioCosto(@Param("idRepuesto") Long idRepuesto);
}
