package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.Factura;
import com.empresa.multiservices.model.enums.EstadoFactura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FacturaRepository extends JpaRepository<Factura, Long> {
    List<Factura> findByClienteIdCliente(Long idCliente);
    List<Factura> findByEstado(EstadoFactura estado);
    
    @Query("SELECT f FROM Factura f WHERE f.fechaEmision BETWEEN :inicio AND :fin")
    List<Factura> findByFechaEmisionBetween(@Param("inicio") LocalDateTime inicio,
                                            @Param("fin") LocalDateTime fin);
}