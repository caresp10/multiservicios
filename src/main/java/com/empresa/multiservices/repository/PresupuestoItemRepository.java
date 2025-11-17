package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.PresupuestoItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PresupuestoItemRepository extends JpaRepository<PresupuestoItem, Long> {
    List<PresupuestoItem> findByPresupuestoIdPresupuesto(Long idPresupuesto);
}