package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.FacturaItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacturaItemRepository extends JpaRepository<FacturaItem, Long> {
    List<FacturaItem> findByFacturaIdFactura(Long idFactura);
}