package com.empresa.multiservices.controller;

import com.empresa.multiservices.dto.response.ApiResponse;
import com.empresa.multiservices.model.Compra;
import com.empresa.multiservices.model.DetalleCompra;
import com.empresa.multiservices.service.CompraService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/compras")
@CrossOrigin(origins = "*")
public class CompraController {
    @Autowired
    private com.empresa.multiservices.repository.ProveedorRepository proveedorRepository;

    @Autowired
    private CompraService compraService;

        @PostMapping
        @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
        public ResponseEntity<ApiResponse> crear(@RequestBody com.empresa.multiservices.dto.CompraDTO compraDTO) {
            // Map DTO to entity
            Compra compra = new Compra();
            compra.setNumeroCompra(compraDTO.getNumero());
            // La fecha viene como String yyyy-MM-dd, convertir a LocalDate
            if (compraDTO.getFecha() != null && !compraDTO.getFecha().isEmpty()) {
                compra.setFechaCompra(java.time.LocalDate.parse(compraDTO.getFecha()));
            }
            // Set proveedor
            if (compraDTO.getProveedorId() != null) {
                com.empresa.multiservices.model.Proveedor proveedor = proveedorRepository.findById(compraDTO.getProveedorId())
                    .orElseThrow(() -> new IllegalArgumentException("Proveedor no encontrado"));
                compra.setProveedor(proveedor);
            }
            compra.setNumeroFactura(compraDTO.getNumeroFactura());
            compra.setFormaPago(compraDTO.getFormaPago());
            compra.setObservaciones(compraDTO.getObservaciones());
            // Map detalles
            if (compraDTO.getDetalles() != null) {
                java.util.List<com.empresa.multiservices.model.DetalleCompra> detalles = new java.util.ArrayList<>();
                for (com.empresa.multiservices.dto.DetalleCompraDTO d : compraDTO.getDetalles()) {
                    com.empresa.multiservices.model.DetalleCompra detalle = new com.empresa.multiservices.model.DetalleCompra();
                    if (d.getRepuestoId() != null) {
                        com.empresa.multiservices.model.Repuesto repuesto = new com.empresa.multiservices.model.Repuesto();
                        repuesto.setIdRepuesto(d.getRepuestoId());
                        detalle.setRepuesto(repuesto);
                    }
                    detalle.setCantidad(d.getCantidad());
                    if (d.getPrecioUnitario() != null) {
                        detalle.setPrecioUnitario(java.math.BigDecimal.valueOf(d.getPrecioUnitario()));
                    }
                    if (d.getSubtotal() != null) {
                        detalle.setSubtotal(java.math.BigDecimal.valueOf(d.getSubtotal()));
                    }
                    detalles.add(detalle);
                }
                compra.setDetalles(detalles);
            }

            // Crear y completar automáticamente (actualizar stock)
            Compra nuevaCompra = compraService.crearYCompletar(compra);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Compra registrada exitosamente. Stock actualizado.", nuevaCompra));
        }


    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> obtenerPorId(@PathVariable Long id) {
        Compra compra = compraService.obtenerPorId(id);
        return ResponseEntity.ok(ApiResponse.success("Compra encontrada", compra));
    }

    @GetMapping("/numero/{numeroCompra}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> obtenerPorNumero(@PathVariable String numeroCompra) {
        Compra compra = compraService.obtenerPorNumero(numeroCompra);
        return ResponseEntity.ok(ApiResponse.success("Compra encontrada", compra));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> listarTodas() {
        List<Compra> compras = compraService.listarTodas();
        return ResponseEntity.ok(ApiResponse.success("Lista de compras", compras));
    }

    @GetMapping("/proveedor/{idProveedor}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> listarPorProveedor(@PathVariable Long idProveedor) {
        List<Compra> compras = compraService.listarPorProveedor(idProveedor);
        return ResponseEntity.ok(ApiResponse.success("Compras del proveedor", compras));
    }

    @GetMapping("/por-fechas")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> listarPorFechas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        List<Compra> compras = compraService.listarPorFechas(fechaInicio, fechaFin);
        return ResponseEntity.ok(ApiResponse.success("Compras en el rango de fechas", compras));
    }

    @GetMapping("/generar-numero")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> generarNumeroCompra() {
        String numeroCompra = compraService.generarNumeroCompra();
        return ResponseEntity.ok(ApiResponse.success("Número de compra generado", numeroCompra));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> eliminar(@PathVariable Long id) {
        compraService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.success("Compra eliminada exitosamente", null));
    }
}
