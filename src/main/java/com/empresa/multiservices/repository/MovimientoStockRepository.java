package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.MovimientoStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MovimientoStockRepository extends JpaRepository<MovimientoStock, Long> {

    List<MovimientoStock> findByRepuestoIdRepuestoOrderByFechaMovimientoDesc(Long idRepuesto);

    List<MovimientoStock> findByTipoMovimientoOrderByFechaMovimientoDesc(MovimientoStock.TipoMovimiento tipo);

    List<MovimientoStock> findByMotivoOrderByFechaMovimientoDesc(MovimientoStock.MotivoMovimiento motivo);

    @Query("SELECT m FROM MovimientoStock m WHERE m.fechaMovimiento BETWEEN :fechaInicio AND :fechaFin ORDER BY m.fechaMovimiento DESC")
    List<MovimientoStock> findByFechaMovimientoBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    List<MovimientoStock> findByFacturaIdFacturaOrderByFechaMovimientoDesc(Long idFactura);
}
