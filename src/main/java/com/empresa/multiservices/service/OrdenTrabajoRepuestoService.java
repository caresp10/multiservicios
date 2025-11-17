package com.empresa.multiservices.service;

import com.empresa.multiservices.exception.ResourceNotFoundException;
import com.empresa.multiservices.model.OrdenTrabajo;
import com.empresa.multiservices.model.OrdenTrabajoRepuesto;
import com.empresa.multiservices.model.Repuesto;
import com.empresa.multiservices.repository.OrdenTrabajoRepuestoRepository;
import com.empresa.multiservices.repository.OrdenTrabajoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class OrdenTrabajoRepuestoService {

    @Autowired
    private OrdenTrabajoRepuestoRepository otRepuestoRepository;

    @Autowired
    private OrdenTrabajoRepository ordenTrabajoRepository;

    @Autowired
    private RepuestoService repuestoService;

    public OrdenTrabajoRepuesto agregarRepuestoAOrden(Long idOrdenTrabajo, Long idRepuesto, Integer cantidad) {
        // Validar orden de trabajo
        OrdenTrabajo ordenTrabajo = ordenTrabajoRepository.findById(idOrdenTrabajo)
                .orElseThrow(() -> new ResourceNotFoundException("Orden de trabajo no encontrada"));

        // Validar repuesto y stock
        Repuesto repuesto = repuestoService.obtenerPorId(idRepuesto);

        if (!repuesto.tieneStockDisponible(cantidad)) {
            throw new IllegalArgumentException(
                "Stock insuficiente. Disponible: " + repuesto.getStockActual() +
                ", Solicitado: " + cantidad
            );
        }

        // Crear el registro de repuesto usado
        OrdenTrabajoRepuesto otRepuesto = OrdenTrabajoRepuesto.builder()
                .ordenTrabajo(ordenTrabajo)
                .repuesto(repuesto)
                .cantidad(cantidad)
                .precioUnitario(repuesto.getPrecioVenta())
                .subtotal(repuesto.getPrecioVenta().multiply(new BigDecimal(cantidad)))
                .build();

        // Decrementar stock
        repuestoService.decrementarStock(idRepuesto, cantidad);

        return otRepuestoRepository.save(otRepuesto);
    }

    public void eliminarRepuestoDeOrden(Long idOtRepuesto) {
        OrdenTrabajoRepuesto otRepuesto = otRepuestoRepository.findById(idOtRepuesto)
                .orElseThrow(() -> new ResourceNotFoundException("Registro de repuesto no encontrado"));

        // Devolver el stock
        repuestoService.incrementarStock(
            otRepuesto.getRepuesto().getIdRepuesto(),
            otRepuesto.getCantidad()
        );

        otRepuestoRepository.delete(otRepuesto);
    }

    @Transactional(readOnly = true)
    public List<OrdenTrabajoRepuesto> listarPorOrdenTrabajo(Long idOrdenTrabajo) {
        return otRepuestoRepository.findRepuestosByOrdenTrabajo(idOrdenTrabajo);
    }

    @Transactional(readOnly = true)
    public List<OrdenTrabajoRepuesto> listarHistorialRepuesto(Long idRepuesto) {
        return otRepuestoRepository.findHistorialUsoRepuesto(idRepuesto);
    }

    @Transactional(readOnly = true)
    public Double calcularTotalRepuestos(Long idOrdenTrabajo) {
        return otRepuestoRepository.calcularTotalRepuestos(idOrdenTrabajo);
    }
}
