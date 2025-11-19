package com.empresa.multiservices.repository;

import com.empresa.multiservices.model.Timbrado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TimbradoRepository extends JpaRepository<Timbrado, Long> {

    // Buscar timbrados activos
    List<Timbrado> findByActivoTrue();

    // Buscar por número de timbrado
    Optional<Timbrado> findByNumero(String numero);

    // Buscar timbrados vigentes (activos y dentro del rango de fechas)
    @Query("SELECT t FROM Timbrado t WHERE t.activo = true " +
           "AND t.fechaInicio <= :fecha " +
           "AND t.fechaVencimiento >= :fecha")
    List<Timbrado> findTimbradosVigentes(LocalDate fecha);

    // Buscar timbrados próximos a vencer (en los próximos N días)
    @Query("SELECT t FROM Timbrado t WHERE t.activo = true " +
           "AND t.fechaVencimiento BETWEEN :fechaActual AND :fechaLimite")
    List<Timbrado> findTimbradosProximosAVencer(LocalDate fechaActual, LocalDate fechaLimite);

    // Buscar timbrados vencidos
    @Query("SELECT t FROM Timbrado t WHERE t.activo = true " +
           "AND t.fechaVencimiento < :fecha")
    List<Timbrado> findTimbradosVencidos(LocalDate fecha);

    // Buscar timbrado activo por establecimiento y punto de expedición
    @Query("SELECT t FROM Timbrado t WHERE t.activo = true " +
           "AND t.establecimiento = :establecimiento " +
           "AND t.puntoExpedicion = :puntoExpedicion " +
           "AND t.fechaInicio <= :fecha " +
           "AND t.fechaVencimiento >= :fecha")
    Optional<Timbrado> findTimbradoActivoByPunto(String establecimiento, String puntoExpedicion, LocalDate fecha);
}
