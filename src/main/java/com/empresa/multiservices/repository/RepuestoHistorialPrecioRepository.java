package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.RepuestoHistorialPrecio;
import com.empresa.multiservices.model.Repuesto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepuestoHistorialPrecioRepository extends JpaRepository<RepuestoHistorialPrecio, Long> {
    List<RepuestoHistorialPrecio> findByRepuestoOrderByFechaCambioDesc(Repuesto repuesto);
}
