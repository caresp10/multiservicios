package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.HistoricoPreciosServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoricoPreciosServicioRepository extends JpaRepository<HistoricoPreciosServicio, Long> {

    List<HistoricoPreciosServicio> findByServicioIdServicioOrderByFechaCambioDesc(Long idServicio);
}
