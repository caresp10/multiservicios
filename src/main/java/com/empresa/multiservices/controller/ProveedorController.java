package com.empresa.multiservices.controller;

import com.empresa.multiservices.dto.response.ApiResponse;
import com.empresa.multiservices.model.Proveedor;
import com.empresa.multiservices.service.ProveedorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/proveedores")
@CrossOrigin(origins = "*")
public class ProveedorController {

    @Autowired
    private ProveedorService proveedorService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> crear(@Valid @RequestBody Proveedor proveedor) {
        Proveedor nuevoProveedor = proveedorService.crear(proveedor);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Proveedor creado exitosamente", nuevoProveedor));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> actualizar(@PathVariable Long id,
                                                   @Valid @RequestBody Proveedor proveedor) {
        Proveedor proveedorActualizado = proveedorService.actualizar(id, proveedor);
        return ResponseEntity.ok(ApiResponse.success("Proveedor actualizado exitosamente", proveedorActualizado));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'TECNICO')")
    public ResponseEntity<ApiResponse> obtenerPorId(@PathVariable Long id) {
        Proveedor proveedor = proveedorService.obtenerPorId(id);
        return ResponseEntity.ok(ApiResponse.success("Proveedor encontrado", proveedor));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'TECNICO')")
    public ResponseEntity<ApiResponse> listarTodos() {
        List<Proveedor> proveedores = proveedorService.listarTodos();
        return ResponseEntity.ok(ApiResponse.success("Lista de proveedores", proveedores));
    }

    @GetMapping("/activos")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'TECNICO')")
    public ResponseEntity<ApiResponse> listarActivos() {
        List<Proveedor> proveedores = proveedorService.listarActivos();
        return ResponseEntity.ok(ApiResponse.success("Proveedores activos", proveedores));
    }

    @GetMapping("/buscar")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'TECNICO')")
    public ResponseEntity<ApiResponse> buscar(@RequestParam String q) {
        List<Proveedor> proveedores = proveedorService.buscar(q);
        return ResponseEntity.ok(ApiResponse.success("Resultados de búsqueda", proveedores));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> eliminar(@PathVariable Long id) {
        proveedorService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.success("Proveedor eliminado exitosamente", null));
    }

    @PatchMapping("/{id}/activar")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> activar(@PathVariable Long id) {
        proveedorService.activar(id);
        return ResponseEntity.ok(ApiResponse.success("Proveedor activado exitosamente", null));
    }
}
