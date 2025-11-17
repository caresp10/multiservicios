package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.Presupuesto;
import com.empresa.multiservices.model.enums.EstadoPresupuesto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PresupuestoRepository extends JpaRepository<Presupuesto, Long> {
    Optional<Presupuesto> findByPedidoIdPedido(Long idPedido);
    List<Presupuesto> findByEstado(EstadoPresupuesto estado);
    List<Presupuesto> findByPedidoIdPedidoAndEstado(Long idPedido, EstadoPresupuesto estado);
}