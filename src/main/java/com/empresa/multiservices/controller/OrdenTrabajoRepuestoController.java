package com.empresa.multiservices.controller;

import com.empresa.multiservices.dto.response.ApiResponse;
import com.empresa.multiservices.model.OrdenTrabajoRepuesto;
import com.empresa.multiservices.service.OrdenTrabajoRepuestoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ordenes-trabajo")
@CrossOrigin(origins = "*")
public class OrdenTrabajoRepuestoController {

    @Autowired
    private OrdenTrabajoRepuestoService otRepuestoService;

    @PostMapping("/{idOrdenTrabajo}/repuestos")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'TECNICO')")
    public ResponseEntity<ApiResponse> agregarRepuesto(@PathVariable Long idOrdenTrabajo,
                                                        @RequestParam Long idRepuesto,
                                                        @RequestParam Integer cantidad) {
        OrdenTrabajoRepuesto otRepuesto = otRepuestoService.agregarRepuestoAOrden(idOrdenTrabajo, idRepuesto, cantidad);
        return ResponseEntity.ok(ApiResponse.success("Repuesto agregado a la orden de trabajo", otRepuesto));
    }

    @DeleteMapping("/repuestos/{idOtRepuesto}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'TECNICO')")
    public ResponseEntity<ApiResponse> eliminarRepuesto(@PathVariable Long idOtRepuesto) {
        otRepuestoService.eliminarRepuestoDeOrden(idOtRepuesto);
        return ResponseEntity.ok(ApiResponse.success("Repuesto eliminado de la orden de trabajo", null));
    }

    @GetMapping("/{idOrdenTrabajo}/repuestos")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'TECNICO')")
    public ResponseEntity<ApiResponse> listarRepuestosPorOrden(@PathVariable Long idOrdenTrabajo) {
        List<OrdenTrabajoRepuesto> repuestos = otRepuestoService.listarPorOrdenTrabajo(idOrdenTrabajo);
        return ResponseEntity.ok(ApiResponse.success("Repuestos de la orden de trabajo", repuestos));
    }

    @GetMapping("/{idOrdenTrabajo}/repuestos/total")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'TECNICO')")
    public ResponseEntity<ApiResponse> calcularTotalRepuestos(@PathVariable Long idOrdenTrabajo) {
        Double total = otRepuestoService.calcularTotalRepuestos(idOrdenTrabajo);
        return ResponseEntity.ok(ApiResponse.success("Total de repuestos", total));
    }

    @GetMapping("/repuestos/historial/{idRepuesto}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> listarHistorialRepuesto(@PathVariable Long idRepuesto) {
        List<OrdenTrabajoRepuesto> historial = otRepuestoService.listarHistorialRepuesto(idRepuesto);
        return ResponseEntity.ok(ApiResponse.success("Historial de uso del repuesto", historial));
    }
}
