package com.empresa.multiservices.service;

import com.empresa.multiservices.exception.ResourceNotFoundException;
import com.empresa.multiservices.model.Compra;
import com.empresa.multiservices.model.DetalleCompra;
import com.empresa.multiservices.model.Proveedor;
import com.empresa.multiservices.model.Repuesto;
import com.empresa.multiservices.repository.CompraRepository;
import com.empresa.multiservices.repository.ProveedorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class CompraService {

    @Autowired
    private CompraRepository compraRepository;

    @Autowired
    private ProveedorRepository proveedorRepository;

    @Autowired
    private RepuestoService repuestoService;

    public Compra crear(Compra compra) {
        // Validar que el número de compra sea único
        if (compraRepository.existsByNumeroCompra(compra.getNumeroCompra())) {
            throw new IllegalArgumentException("Ya existe una compra con el número: " + compra.getNumeroCompra());
        }

        // Validar que haya detalles
        if (compra.getDetalles() == null || compra.getDetalles().isEmpty()) {
            throw new IllegalArgumentException("La compra debe tener al menos un detalle");
        }

        // Validar proveedor
        if (compra.getProveedor() == null || compra.getProveedor().getIdProveedor() == null) {
            throw new IllegalArgumentException("Debe especificar un proveedor");
        }

        Proveedor proveedor = proveedorRepository.findById(compra.getProveedor().getIdProveedor())
                .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado"));
        compra.setProveedor(proveedor);

        // Establecer fecha si no se especificó
        if (compra.getFechaCompra() == null) {
            compra.setFechaCompra(LocalDate.now());
        }

        // Asociar la compra a cada detalle antes de persistir
        if (compra.getDetalles() != null) {
            for (DetalleCompra detalle : compra.getDetalles()) {
                detalle.setCompra(compra);
            }
        }

        // Recalcular totales antes de guardar
        compra.recalcularTotales();

        // Guardar compra
        Compra nuevaCompra = compraRepository.save(compra);

        // Actualizar stock y precios de todos los repuestos automáticamente
        for (DetalleCompra detalle : nuevaCompra.getDetalles()) {
            // Incrementar stock
            repuestoService.incrementarStock(
                detalle.getRepuesto().getIdRepuesto(),
                detalle.getCantidad()
            );

            // Actualizar precio de compra si cambió
            repuestoService.actualizarPrecioCompra(
                detalle.getRepuesto().getIdRepuesto(),
                detalle.getPrecioUnitario()
            );
        }

        return nuevaCompra;
    }


    @Transactional(readOnly = true)
    public List<Compra> listarTodas() {
        return compraRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Compra> listarPorProveedor(Long idProveedor) {
        return compraRepository.findByProveedor_IdProveedor(idProveedor);
    }

    @Transactional(readOnly = true)
    public List<Compra> listarPorFechas(LocalDate fechaInicio, LocalDate fechaFin) {
        return compraRepository.findByFechaCompraBetween(fechaInicio, fechaFin);
    }

    @Transactional(readOnly = true)
    public Compra obtenerPorId(Long id) {
        return compraRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Compra no encontrada"));
    }

    @Transactional(readOnly = true)
    public Compra obtenerPorNumero(String numeroCompra) {
        return compraRepository.findByNumeroCompra(numeroCompra)
                .orElseThrow(() -> new ResourceNotFoundException("Compra no encontrada con número: " + numeroCompra));
    }

    public void eliminar(Long id) {
        Compra compra = obtenerPorId(id);
        // IMPORTANTE: Al eliminar una compra, NO se revierte el stock automáticamente
        // Si necesita revertir, debe ajustar el stock manualmente
        compraRepository.delete(compra);
    }

    // Generar número de compra automático
    public String generarNumeroCompra() {
        LocalDate hoy = LocalDate.now();
        String prefijo = String.format("COM-%04d%02d-", hoy.getYear(), hoy.getMonthValue());

        // Buscar el último número del mes
        List<Compra> comprasDelMes = compraRepository.findByFechaCompraBetween(
            hoy.withDayOfMonth(1),
            hoy.withDayOfMonth(hoy.lengthOfMonth())
        );

        int siguienteNumero = comprasDelMes.size() + 1;
        return prefijo + String.format("%04d", siguienteNumero);
    }
}
