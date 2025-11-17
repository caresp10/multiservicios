package com.empresa.multiservices.controller;

import com.empresa.multiservices.dto.request.PresupuestoRequest;
import com.empresa.multiservices.dto.response.ApiResponse;
import com.empresa.multiservices.model.Presupuesto;
import com.empresa.multiservices.service.PresupuestoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/presupuestos")
@CrossOrigin(origins = "*")
public class PresupuestoController {

    @Autowired
    private PresupuestoService presupuestoService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> crear(@Valid @RequestBody PresupuestoRequest request) {
        Presupuesto presupuesto = presupuestoService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Presupuesto creado exitosamente", presupuesto));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> listar() {
        List<Presupuesto> presupuestos = presupuestoService.listar();
        return ResponseEntity.ok(ApiResponse.success("Lista de presupuestos", presupuestos));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> obtenerPorId(@PathVariable Long id) {
        Presupuesto presupuesto = presupuestoService.obtenerPorId(id);
        return ResponseEntity.ok(ApiResponse.success("Presupuesto encontrado", presupuesto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> actualizar(@PathVariable Long id,
                                                   @Valid @RequestBody PresupuestoRequest request) {
        Presupuesto presupuesto = presupuestoService.actualizar(id, request);
        return ResponseEntity.ok(ApiResponse.success("Presupuesto actualizado exitosamente", presupuesto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> eliminar(@PathVariable Long id) {
        presupuestoService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.success("Presupuesto eliminado exitosamente", null));
    }

    @GetMapping("/pedido/{idPedido}/aceptados")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> obtenerPresupuestosAceptadosPorPedido(@PathVariable Long idPedido) {
        List<Presupuesto> presupuestos = presupuestoService.obtenerPresupuestosAceptadosPorPedido(idPedido);
        return ResponseEntity.ok(ApiResponse.success("Presupuestos aceptados del pedido", presupuestos));
    }
}
