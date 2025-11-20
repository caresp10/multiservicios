package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.ServicioCatalogo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServicioCatalogoRepository extends JpaRepository<ServicioCatalogo, Long> {

    List<ServicioCatalogo> findByActivoTrue();

    List<ServicioCatalogo> findByCategoriaIdCategoria(Long idCategoria);

    Optional<ServicioCatalogo> findByCodigo(String codigo);

    boolean existsByCodigo(String codigo);

    boolean existsByCodigoAndIdServicioNot(String codigo, Long idServicio);
}
