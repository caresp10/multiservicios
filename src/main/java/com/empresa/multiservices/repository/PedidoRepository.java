package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.Pedido;
import com.empresa.multiservices.model.enums.EstadoPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByEstado(EstadoPedido estado);
    List<Pedido> findByClienteIdCliente(Long idCliente);
    List<Pedido> findByEstadoIn(List<EstadoPedido> estados);
    
    @Query("SELECT p FROM Pedido p WHERE p.fechaPedido BETWEEN :inicio AND :fin")
    List<Pedido> findByFechaPedidoBetween(@Param("inicio") LocalDateTime inicio, 
                                          @Param("fin") LocalDateTime fin);
}