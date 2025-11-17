package com.empresa.multiservices.service;

import com.empresa.multiservices.exception.ResourceNotFoundException;
import com.empresa.multiservices.model.Repuesto;
import com.empresa.multiservices.repository.RepuestoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class RepuestoService {
    @Autowired
    private RepuestoHistorialPrecioService historialPrecioService;
    public void actualizarPrecioCompra(Long id, java.math.BigDecimal nuevoPrecioCompra) {
        Repuesto repuesto = obtenerPorId(id);
        java.math.BigDecimal precioAnterior = repuesto.getPrecioCompra();
        if (precioAnterior == null || precioAnterior.compareTo(nuevoPrecioCompra) != 0) {
            repuesto.setPrecioCompra(nuevoPrecioCompra);
            repuestoRepository.save(repuesto);
            // Guardar en historial
            historialPrecioService.registrarCambioPrecio(repuesto, nuevoPrecioCompra, repuesto.getPrecioVenta());
        }
    }

    @Autowired
    private RepuestoRepository repuestoRepository;

    public Repuesto crear(Repuesto repuesto) {
        if (repuestoRepository.existsByCodigo(repuesto.getCodigo())) {
            throw new IllegalArgumentException("Ya existe un repuesto con el código: " + repuesto.getCodigo());
        }
        repuesto.setActivo(true);
        if (repuesto.getStockActual() == null) {
            repuesto.setStockActual(0);
        }
        return repuestoRepository.save(repuesto);
    }

    public Repuesto actualizar(Long id, Repuesto repuestoActualizado) {
        Repuesto repuesto = repuestoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Repuesto no encontrado"));

        // Validar código único si se está modificando
        if (!repuestoActualizado.getCodigo().equals(repuesto.getCodigo()) &&
            repuestoRepository.existsByCodigo(repuestoActualizado.getCodigo())) {
            throw new IllegalArgumentException("Ya existe un repuesto con el código: " + repuestoActualizado.getCodigo());
        }

        repuesto.setCodigo(repuestoActualizado.getCodigo());
        repuesto.setNombre(repuestoActualizado.getNombre());
        repuesto.setDescripcion(repuestoActualizado.getDescripcion());
        repuesto.setMarca(repuestoActualizado.getMarca());
        repuesto.setModelo(repuestoActualizado.getModelo());
        repuesto.setCategoria(repuestoActualizado.getCategoria());
        repuesto.setUnidadMedida(repuestoActualizado.getUnidadMedida());
        repuesto.setPrecioCompra(repuestoActualizado.getPrecioCompra());
        repuesto.setPrecioVenta(repuestoActualizado.getPrecioVenta());
        repuesto.setStockMinimo(repuestoActualizado.getStockMinimo());
        repuesto.setStockMaximo(repuestoActualizado.getStockMaximo());
        repuesto.setUbicacion(repuestoActualizado.getUbicacion());

        return repuestoRepository.save(repuesto);
    }

    @Transactional(readOnly = true)
    public List<Repuesto> listarTodos() {
        return repuestoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Repuesto> listarActivos() {
        return repuestoRepository.findByActivoTrue();
    }

    @Transactional(readOnly = true)
    public Repuesto obtenerPorId(Long id) {
        return repuestoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Repuesto no encontrado"));
    }

    @Transactional(readOnly = true)
    public Repuesto obtenerPorCodigo(String codigo) {
        return repuestoRepository.findByCodigo(codigo)
                .orElseThrow(() -> new ResourceNotFoundException("Repuesto no encontrado con código: " + codigo));
    }

    @Transactional(readOnly = true)
    public List<Repuesto> buscar(String termino) {
        return repuestoRepository.findByNombreContainingIgnoreCaseOrCodigoContainingIgnoreCase(termino, termino);
    }

    @Transactional(readOnly = true)
    public List<Repuesto> listarPorCategoria(String categoria) {
        return repuestoRepository.findByCategoria(categoria);
    }

    @Transactional(readOnly = true)
    public List<Repuesto> listarConStockBajo() {
        return repuestoRepository.findRepuestosConStockBajo();
    }

    @Transactional(readOnly = true)
    public List<Repuesto> listarSinStock() {
        return repuestoRepository.findRepuestosSinStock();
    }

    // Control de stock
    public void incrementarStock(Long id, Integer cantidad) {
        Repuesto repuesto = obtenerPorId(id);
        repuesto.incrementarStock(cantidad);
        repuestoRepository.save(repuesto);
    }

    public void decrementarStock(Long id, Integer cantidad) {
        Repuesto repuesto = obtenerPorId(id);
        if (!repuesto.tieneStockDisponible(cantidad)) {
            throw new IllegalArgumentException(
                "Stock insuficiente. Stock actual: " + repuesto.getStockActual() +
                ", Solicitado: " + cantidad
            );
        }
        repuesto.decrementarStock(cantidad);
        repuestoRepository.save(repuesto);
    }

    public void ajustarStock(Long id, Integer nuevoStock) {
        Repuesto repuesto = obtenerPorId(id);
        repuesto.setStockActual(nuevoStock);
        repuestoRepository.save(repuesto);
    }

    @Transactional(readOnly = true)
    public boolean verificarStockDisponible(Long id, Integer cantidad) {
        return repuestoRepository.tieneStockDisponible(id, cantidad);
    }

    public void eliminar(Long id) {
        Repuesto repuesto = obtenerPorId(id);
        repuesto.setActivo(false);
        repuestoRepository.save(repuesto);
    }

    public void activar(Long id) {
        Repuesto repuesto = obtenerPorId(id);
        repuesto.setActivo(true);
        repuestoRepository.save(repuesto);
    }
}
