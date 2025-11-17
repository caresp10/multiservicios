package com.empresa.multiservices.service;

import com.empresa.multiservices.model.Repuesto;
import com.empresa.multiservices.model.RepuestoHistorialPrecio;
import com.empresa.multiservices.repository.RepuestoHistorialPrecioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class RepuestoHistorialPrecioService {
    @Autowired
    private RepuestoHistorialPrecioRepository historialPrecioRepository;

    public void registrarCambioPrecio(Repuesto repuesto, BigDecimal precioCompra, BigDecimal precioVenta) {
        RepuestoHistorialPrecio historial = new RepuestoHistorialPrecio();
        historial.setRepuesto(repuesto);
        historial.setPrecioCompra(precioCompra);
        historial.setPrecioVenta(precioVenta);
        historial.setFechaCambio(LocalDateTime.now());
        historialPrecioRepository.save(historial);
    }

    public List<RepuestoHistorialPrecio> obtenerHistorialPorRepuesto(Repuesto repuesto) {
        return historialPrecioRepository.findByRepuestoOrderByFechaCambioDesc(repuesto);
    }
}
