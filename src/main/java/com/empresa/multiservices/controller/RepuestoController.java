package com.empresa.multiservices.controller;

import com.empresa.multiservices.dto.response.ApiResponse;
import com.empresa.multiservices.model.Repuesto;
import com.empresa.multiservices.service.RepuestoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repuestos")
@CrossOrigin(origins = "*")
public class RepuestoController {

    @Autowired
    private RepuestoService repuestoService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> crear(@Valid @RequestBody Repuesto repuesto) {
        Repuesto nuevoRepuesto = repuestoService.crear(repuesto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Repuesto creado exitosamente", nuevoRepuesto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> actualizar(@PathVariable Long id,
                                                   @Valid @RequestBody Repuesto repuesto) {
        Repuesto repuestoActualizado = repuestoService.actualizar(id, repuesto);
        return ResponseEntity.ok(ApiResponse.success("Repuesto actualizado exitosamente", repuestoActualizado));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'TECNICO')")
    public ResponseEntity<ApiResponse> obtenerPorId(@PathVariable Long id) {
        Repuesto repuesto = repuestoService.obtenerPorId(id);
        return ResponseEntity.ok(ApiResponse.success("Repuesto encontrado", repuesto));
    }

    @GetMapping("/codigo/{codigo}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'TECNICO')")
    public ResponseEntity<ApiResponse> obtenerPorCodigo(@PathVariable String codigo) {
        Repuesto repuesto = repuestoService.obtenerPorCodigo(codigo);
        return ResponseEntity.ok(ApiResponse.success("Repuesto encontrado", repuesto));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'TECNICO')")
    public ResponseEntity<ApiResponse> listarTodos() {
        List<Repuesto> repuestos = repuestoService.listarTodos();
        return ResponseEntity.ok(ApiResponse.success("Lista de repuestos", repuestos));
    }

    @GetMapping("/activos")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'TECNICO')")
    public ResponseEntity<ApiResponse> listarActivos() {
        List<Repuesto> repuestos = repuestoService.listarActivos();
        return ResponseEntity.ok(ApiResponse.success("Repuestos activos", repuestos));
    }

    @GetMapping("/buscar")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'TECNICO')")
    public ResponseEntity<ApiResponse> buscar(@RequestParam String q) {
        List<Repuesto> repuestos = repuestoService.buscar(q);
        return ResponseEntity.ok(ApiResponse.success("Resultados de búsqueda", repuestos));
    }

    @GetMapping("/categoria/{categoria}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'TECNICO')")
    public ResponseEntity<ApiResponse> listarPorCategoria(@PathVariable String categoria) {
        List<Repuesto> repuestos = repuestoService.listarPorCategoria(categoria);
        return ResponseEntity.ok(ApiResponse.success("Repuestos de la categoría", repuestos));
    }

    @GetMapping("/stock-bajo")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> listarConStockBajo() {
        List<Repuesto> repuestos = repuestoService.listarConStockBajo();
        return ResponseEntity.ok(ApiResponse.success("Repuestos con stock bajo", repuestos));
    }

    @GetMapping("/sin-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> listarSinStock() {
        List<Repuesto> repuestos = repuestoService.listarSinStock();
        return ResponseEntity.ok(ApiResponse.success("Repuestos sin stock", repuestos));
    }

    @PatchMapping("/{id}/stock/incrementar")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> incrementarStock(@PathVariable Long id,
                                                         @RequestParam Integer cantidad) {
        repuestoService.incrementarStock(id, cantidad);
        return ResponseEntity.ok(ApiResponse.success("Stock incrementado exitosamente", null));
    }

    @PatchMapping("/{id}/stock/decrementar")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> decrementarStock(@PathVariable Long id,
                                                         @RequestParam Integer cantidad) {
        repuestoService.decrementarStock(id, cantidad);
        return ResponseEntity.ok(ApiResponse.success("Stock decrementado exitosamente", null));
    }

    @PatchMapping("/{id}/stock/ajustar")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> ajustarStock(@PathVariable Long id,
                                                     @RequestParam Integer nuevoStock) {
        repuestoService.ajustarStock(id, nuevoStock);
        return ResponseEntity.ok(ApiResponse.success("Stock ajustado exitosamente", null));
    }

    @GetMapping("/{id}/stock/verificar")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'TECNICO')")
    public ResponseEntity<ApiResponse> verificarStock(@PathVariable Long id,
                                                       @RequestParam Integer cantidad) {
        boolean disponible = repuestoService.verificarStockDisponible(id, cantidad);
        return ResponseEntity.ok(ApiResponse.success("Verificación de stock", disponible));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> eliminar(@PathVariable Long id) {
        repuestoService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.success("Repuesto eliminado exitosamente", null));
    }

    @PatchMapping("/{id}/activar")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> activar(@PathVariable Long id) {
        repuestoService.activar(id);
        return ResponseEntity.ok(ApiResponse.success("Repuesto activado exitosamente", null));
    }
}
