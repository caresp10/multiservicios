package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.Tecnico;
import com.empresa.multiservices.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TecnicoRepository extends JpaRepository<Tecnico, Long> {

    List<Tecnico> findByActivoTrue();

    Optional<Tecnico> findByCi(String ci);

    List<Tecnico> findByEspecialidadContaining(String especialidad);

    Optional<Tecnico> findByUsuario(Usuario usuario);

    Optional<Tecnico> findByUsuario_IdUsuario(Long idUsuario);

    // Buscar técnicos activos por categoría
    List<Tecnico> findByActivoTrueAndCategoria_IdCategoria(Long idCategoria);
}
