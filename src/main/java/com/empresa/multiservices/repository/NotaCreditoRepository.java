package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.NotaCredito;
import com.empresa.multiservices.model.enums.EstadoNotaCredito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotaCreditoRepository extends JpaRepository<NotaCredito, Long> {

    // Buscar por número de nota de crédito
    Optional<NotaCredito> findByNumeroNotaCredito(String numeroNotaCredito);

    // Buscar todas las NC de una factura
    List<NotaCredito> findByFacturaIdFactura(Long idFactura);

    // Buscar por estado
    List<NotaCredito> findByEstado(EstadoNotaCredito estado);

    // Buscar por rango de fechas
    List<NotaCredito> findByFechaEmisionBetween(LocalDateTime inicio, LocalDateTime fin);

    // Verificar si existe una NC con ese número
    boolean existsByNumeroNotaCredito(String numeroNotaCredito);
}
