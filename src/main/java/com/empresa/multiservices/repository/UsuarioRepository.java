package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.Usuario;
import com.empresa.multiservices.model.enums.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUsername(String username);
    Optional<Usuario> findByEmail(String email);
    List<Usuario> findByRol(Rol rol);
    List<Usuario> findByActivoTrue();
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}