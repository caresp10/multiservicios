package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.RepuestoUtilizado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepuestoUtilizadoRepository extends JpaRepository<RepuestoUtilizado, Long> {
    List<RepuestoUtilizado> findByOrdenTrabajoIdOt(Long idOt);
}