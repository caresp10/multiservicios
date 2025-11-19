package com.empresa.multiservices.service;

import com.empresa.multiservices.dto.request.TimbradoRequest;
import com.empresa.multiservices.exception.ResourceNotFoundException;
import com.empresa.multiservices.model.Timbrado;
import com.empresa.multiservices.repository.TimbradoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class TimbradoService {

    @Autowired
    private TimbradoRepository timbradoRepository;

    public Timbrado crear(TimbradoRequest request) {
        // Validar que las fechas sean coherentes
        if (request.getFechaInicio().isAfter(request.getFechaVencimiento())) {
            throw new IllegalArgumentException("La fecha de inicio no puede ser posterior a la fecha de vencimiento");
        }

        // Validar que los números sean coherentes
        try {
            long numInicio = Long.parseLong(request.getNumeroInicio());
            long numFin = Long.parseLong(request.getNumeroFin());

            if (numInicio > numFin) {
                throw new IllegalArgumentException("El número de inicio no puede ser mayor al número de fin");
            }
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Los números de inicio y fin deben ser numéricos");
        }

        LocalDate hoy = LocalDate.now();
        boolean activar = false;

        // Determinar si el timbrado debe estar activo
        // Solo se activa si la fecha de inicio es hoy o anterior Y la fecha de fin es hoy o posterior
        if (!request.getFechaInicio().isAfter(hoy) && !request.getFechaVencimiento().isBefore(hoy)) {
            // Desactivar solo los timbrados del MISMO establecimiento y punto de expedición
            List<Timbrado> timbradosActivos = timbradoRepository.findByActivoTrue();
            for (Timbrado t : timbradosActivos) {
                if (t.getEstablecimiento().equals(request.getEstablecimiento()) &&
                    t.getPuntoExpedicion().equals(request.getPuntoExpedicion())) {
                    t.setActivo(false);
                    timbradoRepository.save(t);
                }
            }
            activar = true;
        }

        Timbrado timbrado = Timbrado.builder()
                .numero(request.getNumero())
                .establecimiento(request.getEstablecimiento())
                .puntoExpedicion(request.getPuntoExpedicion())
                .fechaInicio(request.getFechaInicio())
                .fechaVencimiento(request.getFechaVencimiento())
                .numeroInicio(request.getNumeroInicio())
                .numeroFin(request.getNumeroFin())
                .numeroActual(request.getNumeroInicio()) // Iniciar en el número de inicio
                .activo(activar)
                .observaciones(request.getObservaciones())
                .build();

        return timbradoRepository.save(timbrado);
    }

    public Timbrado actualizar(Long id, TimbradoRequest request) {
        Timbrado timbrado = timbradoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timbrado no encontrado"));

        // Validar fechas
        if (request.getFechaInicio().isAfter(request.getFechaVencimiento())) {
            throw new IllegalArgumentException("La fecha de inicio no puede ser posterior a la fecha de vencimiento");
        }

        timbrado.setNumero(request.getNumero());
        timbrado.setEstablecimiento(request.getEstablecimiento());
        timbrado.setPuntoExpedicion(request.getPuntoExpedicion());
        timbrado.setFechaInicio(request.getFechaInicio());
        timbrado.setFechaVencimiento(request.getFechaVencimiento());
        timbrado.setNumeroInicio(request.getNumeroInicio());
        timbrado.setNumeroFin(request.getNumeroFin());
        timbrado.setObservaciones(request.getObservaciones());

        return timbradoRepository.save(timbrado);
    }

    public void eliminar(Long id) {
        Timbrado timbrado = timbradoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timbrado no encontrado"));

        // Desactivar en lugar de eliminar
        timbrado.setActivo(false);
        timbradoRepository.save(timbrado);
    }

    public Timbrado obtenerPorId(Long id) {
        return timbradoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timbrado no encontrado"));
    }

    public List<Timbrado> obtenerTodos() {
        return timbradoRepository.findAll();
    }

    public List<Timbrado> obtenerActivos() {
        return timbradoRepository.findByActivoTrue();
    }

    public List<Timbrado> obtenerVigentes() {
        return timbradoRepository.findTimbradosVigentes(LocalDate.now());
    }

    public List<Timbrado> obtenerProximosAVencer(int dias) {
        LocalDate fechaActual = LocalDate.now();
        LocalDate fechaLimite = fechaActual.plusDays(dias);
        return timbradoRepository.findTimbradosProximosAVencer(fechaActual, fechaLimite);
    }

    public List<Timbrado> obtenerVencidos() {
        return timbradoRepository.findTimbradosVencidos(LocalDate.now());
    }

    /**
     * Obtiene el timbrado vigente más apropiado para crear una nueva factura
     * Retorna el timbrado activo con mayor espacio disponible
     */
    public Timbrado obtenerTimbradoParaFacturar() {
        List<Timbrado> timbradosVigentes = obtenerVigentes();

        if (timbradosVigentes.isEmpty()) {
            throw new IllegalStateException("No hay timbrados vigentes disponibles");
        }

        // Retornar el primero vigente
        // En el futuro se podría mejorar para elegir el que tiene más espacio disponible
        return timbradosVigentes.get(0);
    }

    /**
     * Obtiene el siguiente número de factura y actualiza el timbrado
     */
    public String obtenerSiguienteNumeroFactura(Long idTimbrado) {
        Timbrado timbrado = obtenerPorId(idTimbrado);

        if (!timbrado.isVigente()) {
            throw new IllegalStateException("El timbrado no está vigente");
        }

        String siguienteNumero = timbrado.obtenerSiguienteNumero();
        timbradoRepository.save(timbrado);

        return siguienteNumero;
    }

    /**
     * Activa un timbrado y desactiva todos los demás del MISMO punto de expedición
     */
    public Timbrado activar(Long id) {
        Timbrado timbrado = obtenerPorId(id);

        // Verificar que el timbrado pueda estar vigente
        LocalDate hoy = LocalDate.now();
        if (timbrado.getFechaInicio().isAfter(hoy)) {
            throw new IllegalStateException("No se puede activar un timbrado cuya fecha de inicio es futura");
        }

        if (timbrado.getFechaVencimiento().isBefore(hoy)) {
            throw new IllegalStateException("No se puede activar un timbrado vencido");
        }

        // Desactivar solo los timbrados del MISMO establecimiento y punto de expedición
        List<Timbrado> timbradosActivos = timbradoRepository.findByActivoTrue();
        for (Timbrado t : timbradosActivos) {
            if (t.getEstablecimiento().equals(timbrado.getEstablecimiento()) &&
                t.getPuntoExpedicion().equals(timbrado.getPuntoExpedicion())) {
                t.setActivo(false);
                timbradoRepository.save(t);
            }
        }

        // Activar el timbrado seleccionado
        timbrado.setActivo(true);
        return timbradoRepository.save(timbrado);
    }
}
