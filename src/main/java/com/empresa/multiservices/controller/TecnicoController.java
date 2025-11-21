package com.empresa.multiservices.controller;

import com.empresa.multiservices.dto.request.TecnicoRequest;
import com.empresa.multiservices.dto.response.ApiResponse;
import com.empresa.multiservices.model.Tecnico;
import com.empresa.multiservices.service.TecnicoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tecnicos")
@CrossOrigin(origins = "*")
public class TecnicoController {

    @Autowired
    private TecnicoService tecnicoService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<ApiResponse> crear(@Valid @RequestBody TecnicoRequest request) {
        Tecnico tecnico = tecnicoService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Técnico creado exitosamente", tecnico));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> listar() {
        List<Tecnico> tecnicos = tecnicoService.listar();
        return ResponseEntity.ok(ApiResponse.success("Lista de técnicos", tecnicos));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> obtenerPorId(@PathVariable Long id) {
        Tecnico tecnico = tecnicoService.obtenerPorId(id);
        return ResponseEntity.ok(ApiResponse.success("Técnico encontrado", tecnico));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<ApiResponse> actualizar(@PathVariable Long id,
                                                   @Valid @RequestBody TecnicoRequest request) {
        Tecnico tecnico = tecnicoService.actualizar(id, request);
        return ResponseEntity.ok(ApiResponse.success("Técnico actualizado exitosamente", tecnico));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<ApiResponse> eliminar(@PathVariable Long id) {
        tecnicoService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.success("Técnico eliminado exitosamente", null));
    }

    @GetMapping("/activos")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> listarActivos() {
        List<Tecnico> tecnicos = tecnicoService.listarActivos();
        return ResponseEntity.ok(ApiResponse.success("Técnicos activos", tecnicos));
    }

    @GetMapping("/por-usuario/{idUsuario}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECNICO')")
    public ResponseEntity<ApiResponse> obtenerPorIdUsuario(@PathVariable Long idUsuario) {
        Tecnico tecnico = tecnicoService.obtenerPorIdUsuario(idUsuario);
        return ResponseEntity.ok(ApiResponse.success("Técnico encontrado", tecnico));
    }

    @GetMapping("/por-categoria/{idCategoria}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> listarPorCategoria(@PathVariable Long idCategoria) {
        List<Tecnico> tecnicos = tecnicoService.listarPorCategoria(idCategoria);
        return ResponseEntity.ok(ApiResponse.success("Técnicos por categoría", tecnicos));
    }
}
