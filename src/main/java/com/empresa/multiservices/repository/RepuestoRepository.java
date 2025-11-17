package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.Repuesto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RepuestoRepository extends JpaRepository<Repuesto, Long> {

    List<Repuesto> findByActivoTrue();

    Optional<Repuesto> findByCodigo(String codigo);

    List<Repuesto> findByNombreContainingIgnoreCaseOrCodigoContainingIgnoreCase(String nombre, String codigo);

    List<Repuesto> findByCategoria(String categoria);

    List<Repuesto> findByMarca(String marca);

    boolean existsByCodigo(String codigo);

    // Repuestos con stock bajo (menor o igual al stock mínimo)
    @Query("SELECT r FROM Repuesto r WHERE r.stockActual <= r.stockMinimo AND r.activo = true")
    List<Repuesto> findRepuestosConStockBajo();

    // Repuestos sin stock
    @Query("SELECT r FROM Repuesto r WHERE r.stockActual = 0 AND r.activo = true")
    List<Repuesto> findRepuestosSinStock();

    // Verificar si hay stock disponible
    @Query("SELECT CASE WHEN r.stockActual >= :cantidad THEN true ELSE false END FROM Repuesto r WHERE r.idRepuesto = :idRepuesto")
    boolean tieneStockDisponible(Long idRepuesto, Integer cantidad);
}
