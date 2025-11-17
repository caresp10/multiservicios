package com.empresa.multiservices.controller;

import com.empresa.multiservices.dto.response.ApiResponse;
import com.empresa.multiservices.model.CategoriaServicio;
import com.empresa.multiservices.service.CategoriaServicioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categorias")
@CrossOrigin(origins = "*")
public class CategoriaServicioController {

    @Autowired
    private CategoriaServicioService categoriaService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> crear(@RequestBody Map<String, String> request) {
        CategoriaServicio categoria = categoriaService.crear(
                request.get("nombre"),
                request.get("descripcion")
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Categoría creada exitosamente", categoria));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> listarTodas() {
        List<CategoriaServicio> categorias = categoriaService.listarTodas();
        return ResponseEntity.ok(ApiResponse.success("Lista de categorías", categorias));
    }

    @GetMapping("/activas")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> listarActivas() {
        List<CategoriaServicio> categorias = categoriaService.listarActivas();
        return ResponseEntity.ok(ApiResponse.success("Categorías activas", categorias));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> obtenerPorId(@PathVariable Long id) {
        CategoriaServicio categoria = categoriaService.obtenerPorId(id);
        return ResponseEntity.ok(ApiResponse.success("Categoría encontrada", categoria));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> actualizar(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        CategoriaServicio categoria = categoriaService.actualizar(
                id,
                (String) request.get("nombre"),
                (String) request.get("descripcion"),
                (Boolean) request.get("activo")
        );
        return ResponseEntity.ok(ApiResponse.success("Categoría actualizada exitosamente", categoria));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> eliminar(@PathVariable Long id) {
        categoriaService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.success("Categoría eliminada exitosamente", null));
    }
}
