package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.OrdenTrabajo;
import com.empresa.multiservices.model.enums.EstadoOT;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrdenTrabajoRepository extends JpaRepository<OrdenTrabajo, Long> {
    List<OrdenTrabajo> findByTecnicoIdTecnico(Long idTecnico);
    List<OrdenTrabajo> findByEstado(EstadoOT estado);
    List<OrdenTrabajo> findBySupervisorIdUsuario(Long idSupervisor);

    @Query("SELECT o FROM OrdenTrabajo o WHERE o.tecnico.idTecnico = :idTecnico " +
           "AND o.fechaCreacion BETWEEN :inicio AND :fin")
    List<OrdenTrabajo> findByTecnicoYFecha(@Param("idTecnico") Long idTecnico,
                                           @Param("inicio") LocalDateTime inicio,
                                           @Param("fin") LocalDateTime fin);
}