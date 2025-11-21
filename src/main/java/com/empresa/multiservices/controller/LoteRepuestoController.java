package com.empresa.multiservices.controller;

import com.empresa.multiservices.dto.response.ApiResponse;
import com.empresa.multiservices.model.LoteRepuesto;
import com.empresa.multiservices.model.Proveedor;
import com.empresa.multiservices.service.LoteRepuestoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lotes")
@CrossOrigin(origins = "*")
public class LoteRepuestoController {

    @Autowired
    private LoteRepuestoService loteRepuestoService;

    @GetMapping("/repuesto/{idRepuesto}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> obtenerLotesPorRepuesto(@PathVariable Long idRepuesto) {
        List<LoteRepuesto> lotes = loteRepuestoService.obtenerLotesPorRepuesto(idRepuesto);
        return ResponseEntity.ok(ApiResponse.success("Lotes del repuesto", lotes));
    }

    @GetMapping("/repuesto/{idRepuesto}/disponibles")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'TECNICO')")
    public ResponseEntity<ApiResponse> obtenerLotesDisponibles(@PathVariable Long idRepuesto) {
        List<LoteRepuesto> lotes = loteRepuestoService.obtenerLotesDisponibles(idRepuesto);
        return ResponseEntity.ok(ApiResponse.success("Lotes disponibles", lotes));
    }

    @GetMapping("/repuesto/{idRepuesto}/stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'TECNICO')")
    public ResponseEntity<ApiResponse> obtenerStockDisponible(@PathVariable Long idRepuesto) {
        int stock = loteRepuestoService.obtenerStockDisponible(idRepuesto);
        return ResponseEntity.ok(ApiResponse.success("Stock disponible", stock));
    }

    @GetMapping("/repuesto/{idRepuesto}/proveedores")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> obtenerProveedoresPorRepuesto(@PathVariable Long idRepuesto) {
        List<Proveedor> proveedores = loteRepuestoService.obtenerProveedoresPorRepuesto(idRepuesto);
        return ResponseEntity.ok(ApiResponse.success("Proveedores del repuesto", proveedores));
    }

    @GetMapping("/proximos-vencer")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> obtenerLotesProximosAVencer(
            @RequestParam(defaultValue = "30") int dias) {
        List<LoteRepuesto> lotes = loteRepuestoService.obtenerLotesProximosAVencer(dias);
        return ResponseEntity.ok(ApiResponse.success("Lotes próximos a vencer", lotes));
    }

    @GetMapping("/vencidos")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> obtenerLotesVencidos() {
        List<LoteRepuesto> lotes = loteRepuestoService.obtenerLotesVencidos();
        return ResponseEntity.ok(ApiResponse.success("Lotes vencidos con stock", lotes));
    }

    @PostMapping("/ajuste-inventario")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> ajustarInventario(@RequestBody Map<String, Object> request) {
        try {
            Long idRepuesto = Long.valueOf(request.get("idRepuesto").toString());
            String tipoMovimiento = (String) request.get("tipoMovimiento");
            Integer cantidad = Integer.valueOf(request.get("cantidad").toString());
            String motivo = (String) request.get("motivo");

            Long idProveedor = null;
            if (request.get("idProveedor") != null && !request.get("idProveedor").toString().isEmpty()) {
                idProveedor = Long.valueOf(request.get("idProveedor").toString());
            }

            BigDecimal precioCosto = null;
            if (request.get("precioCosto") != null && !request.get("precioCosto").toString().isEmpty()) {
                precioCosto = new BigDecimal(request.get("precioCosto").toString());
            }

            String observaciones = (String) request.get("observaciones");

            LoteRepuesto resultado = loteRepuestoService.ajustarInventario(
                idRepuesto, tipoMovimiento, cantidad, motivo, idProveedor, precioCosto, observaciones
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Ajuste de inventario realizado exitosamente", resultado));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al realizar ajuste: " + e.getMessage()));
        }
    }

    @GetMapping("/repuesto/{idRepuesto}/ultimo-precio")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> obtenerUltimoPrecioCosto(@PathVariable Long idRepuesto) {
        BigDecimal precio = loteRepuestoService.obtenerUltimoPrecioCosto(idRepuesto);
        return ResponseEntity.ok(ApiResponse.success("Último precio de costo", precio));
    }
}
