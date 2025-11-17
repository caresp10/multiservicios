package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.OrdenTrabajoRepuesto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrdenTrabajoRepuestoRepository extends JpaRepository<OrdenTrabajoRepuesto, Long> {

    List<OrdenTrabajoRepuesto> findByOrdenTrabajo_IdOt(Long idOt);

    List<OrdenTrabajoRepuesto> findByRepuesto_IdRepuesto(Long idRepuesto);

    @Query("SELECT otr FROM OrdenTrabajoRepuesto otr WHERE otr.ordenTrabajo.idOt = :idOrdenTrabajo ORDER BY otr.idOtRepuesto")
    List<OrdenTrabajoRepuesto> findRepuestosByOrdenTrabajo(Long idOrdenTrabajo);

    // Obtener el historial de uso de un repuesto en órdenes de trabajo
    @Query("SELECT otr FROM OrdenTrabajoRepuesto otr WHERE otr.repuesto.idRepuesto = :idRepuesto ORDER BY otr.fechaRegistro DESC")
    List<OrdenTrabajoRepuesto> findHistorialUsoRepuesto(Long idRepuesto);

    // Calcular total de repuestos usados en una orden de trabajo
    @Query("SELECT COALESCE(SUM(otr.subtotal), 0) FROM OrdenTrabajoRepuesto otr WHERE otr.ordenTrabajo.idOt = :idOrdenTrabajo")
    Double calcularTotalRepuestos(Long idOrdenTrabajo);
}
