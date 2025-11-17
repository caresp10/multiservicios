package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.DetalleCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetalleCompraRepository extends JpaRepository<DetalleCompra, Long> {

    List<DetalleCompra> findByCompra_IdCompra(Long idCompra);

    List<DetalleCompra> findByRepuesto_IdRepuesto(Long idRepuesto);

    @Query("SELECT dc FROM DetalleCompra dc WHERE dc.compra.idCompra = :idCompra ORDER BY dc.idDetalleCompra")
    List<DetalleCompra> findDetallesByCompra(Long idCompra);

    // Obtener el historial de compras de un repuesto específico
    @Query("SELECT dc FROM DetalleCompra dc WHERE dc.repuesto.idRepuesto = :idRepuesto ORDER BY dc.compra.fechaCompra DESC")
    List<DetalleCompra> findHistorialComprasRepuesto(Long idRepuesto);
}
