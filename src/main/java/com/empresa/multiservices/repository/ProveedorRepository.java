package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProveedorRepository extends JpaRepository<Proveedor, Long> {

    List<Proveedor> findByActivoTrue();

    Optional<Proveedor> findByRuc(String ruc);

    List<Proveedor> findByNombreContainingIgnoreCaseOrRazonSocialContainingIgnoreCase(String nombre, String razonSocial);

    List<Proveedor> findByCiudad(String ciudad);

    boolean existsByRuc(String ruc);
}
