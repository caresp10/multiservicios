package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.Compra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CompraRepository extends JpaRepository<Compra, Long> {

    Optional<Compra> findByNumeroCompra(String numeroCompra);

    List<Compra> findByProveedor_IdProveedor(Long idProveedor);

    List<Compra> findByFechaCompraBetween(LocalDate fechaInicio, LocalDate fechaFin);

    boolean existsByNumeroCompra(String numeroCompra);

    // Últimas compras
    @Query("SELECT c FROM Compra c ORDER BY c.fechaCompra DESC, c.idCompra DESC")
    List<Compra> findUltimasCompras();

    // Compras por proveedor en un rango de fechas
    @Query("SELECT c FROM Compra c WHERE c.proveedor.idProveedor = :idProveedor AND c.fechaCompra BETWEEN :fechaInicio AND :fechaFin")
    List<Compra> findByProveedorAndFechaRange(Long idProveedor, LocalDate fechaInicio, LocalDate fechaFin);
}
