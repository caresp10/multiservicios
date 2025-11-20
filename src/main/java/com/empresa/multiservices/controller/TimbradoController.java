package com.empresa.multiservices.controller;

import com.empresa.multiservices.dto.request.TimbradoRequest;
import com.empresa.multiservices.dto.response.ApiResponse;
import com.empresa.multiservices.model.Timbrado;
import com.empresa.multiservices.service.TimbradoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/timbrados")
@CrossOrigin(origins = "*")
public class TimbradoController {

    @Autowired
    private TimbradoService timbradoService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> crear(@Valid @RequestBody TimbradoRequest request) {
        Timbrado timbrado = timbradoService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Timbrado creado exitosamente", timbrado));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> actualizar(@PathVariable Long id,
                                                   @Valid @RequestBody TimbradoRequest request) {
        Timbrado timbrado = timbradoService.actualizar(id, request);
        return ResponseEntity.ok(ApiResponse.success("Timbrado actualizado exitosamente", timbrado));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> obtenerPorId(@PathVariable Long id) {
        Timbrado timbrado = timbradoService.obtenerPorId(id);
        return ResponseEntity.ok(ApiResponse.success("Timbrado encontrado", timbrado));
    }

    @GetMapping
    public ResponseEntity<ApiResponse> listarTodos() {
        List<Timbrado> timbrados = timbradoService.obtenerTodos();
        return ResponseEntity.ok(ApiResponse.success("Lista de timbrados", timbrados));
    }

    @GetMapping("/activos")
    public ResponseEntity<ApiResponse> listarActivos() {
        List<Timbrado> timbrados = timbradoService.obtenerActivos();
        return ResponseEntity.ok(ApiResponse.success("Timbrados activos", timbrados));
    }

    @GetMapping("/vigentes")
    public ResponseEntity<ApiResponse> listarVigentes() {
        List<Timbrado> timbrados = timbradoService.obtenerVigentes();
        return ResponseEntity.ok(ApiResponse.success("Timbrados vigentes", timbrados));
    }

    @GetMapping("/proximos-vencer")
    public ResponseEntity<ApiResponse> listarProximosAVencer(@RequestParam(defaultValue = "30") int dias) {
        List<Timbrado> timbrados = timbradoService.obtenerProximosAVencer(dias);
        return ResponseEntity.ok(ApiResponse.success("Timbrados próximos a vencer", timbrados));
    }

    @GetMapping("/vencidos")
    public ResponseEntity<ApiResponse> listarVencidos() {
        List<Timbrado> timbrados = timbradoService.obtenerVencidos();
        return ResponseEntity.ok(ApiResponse.success("Timbrados vencidos", timbrados));
    }

    @GetMapping("/para-facturar")
    public ResponseEntity<ApiResponse> obtenerParaFacturar() {
        Timbrado timbrado = timbradoService.obtenerTimbradoParaFacturar();
        return ResponseEntity.ok(ApiResponse.success("Timbrado para facturar", timbrado));
    }

    @PutMapping("/{id}/activar")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> activar(@PathVariable Long id) {
        Timbrado timbrado = timbradoService.activar(id);
        return ResponseEntity.ok(ApiResponse.success("Timbrado activado exitosamente", timbrado));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> eliminar(@PathVariable Long id) {
        timbradoService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.success("Timbrado desactivado exitosamente", null));
    }
}
