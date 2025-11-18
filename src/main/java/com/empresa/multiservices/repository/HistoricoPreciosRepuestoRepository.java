package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.HistoricoPreciosRepuesto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoricoPreciosRepuestoRepository extends JpaRepository<HistoricoPreciosRepuesto, Long> {

    List<HistoricoPreciosRepuesto> findByRepuestoIdRepuestoOrderByFechaCambioDesc(Long idRepuesto);
}
