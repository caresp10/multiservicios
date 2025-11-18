package com.empresa.multiservices.controller;

import com.empresa.multiservices.dto.response.ApiResponse;
import com.empresa.multiservices.model.HistoricoPreciosServicio;
import com.empresa.multiservices.model.ServicioCatalogo;
import com.empresa.multiservices.service.ServicioCatalogoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/servicios-catalogo")
@CrossOrigin(origins = "*")
public class ServicioCatalogoController {

    @Autowired
    private ServicioCatalogoService servicioCatalogoService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> crear(@RequestBody ServicioCatalogo servicio) {
        try {
            ServicioCatalogo nuevoServicio = servicioCatalogoService.crear(servicio);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Servicio creado exitosamente", nuevoServicio));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> listarTodos() {
        List<ServicioCatalogo> servicios = servicioCatalogoService.listarTodos();
        return ResponseEntity.ok(ApiResponse.success("Lista de servicios", servicios));
    }

    @GetMapping("/activos")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> listarActivos() {
        List<ServicioCatalogo> servicios = servicioCatalogoService.listarActivos();
        return ResponseEntity.ok(ApiResponse.success("Servicios activos", servicios));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> obtenerPorId(@PathVariable Long id) {
        try {
            ServicioCatalogo servicio = servicioCatalogoService.obtenerPorId(id);
            return ResponseEntity.ok(ApiResponse.success("Servicio encontrado", servicio));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Servicio no encontrado"));
        }
    }

    @GetMapping("/categoria/{idCategoria}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> listarPorCategoria(@PathVariable Long idCategoria) {
        List<ServicioCatalogo> servicios = servicioCatalogoService.listarPorCategoria(idCategoria);
        return ResponseEntity.ok(ApiResponse.success("Servicios de la categoría", servicios));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> actualizar(@PathVariable Long id,
                                                  @RequestBody ServicioCatalogo servicio) {
        try {
            ServicioCatalogo servicioActualizado = servicioCatalogoService.actualizar(id, servicio);
            return ResponseEntity.ok(ApiResponse.success("Servicio actualizado exitosamente", servicioActualizado));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Servicio no encontrado"));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> eliminar(@PathVariable Long id) {
        try {
            servicioCatalogoService.eliminar(id);
            return ResponseEntity.ok(ApiResponse.success("Servicio eliminado exitosamente", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Servicio no encontrado"));
        }
    }

    @GetMapping("/{id}/historico-precios")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> obtenerHistoricoPrecios(@PathVariable Long id) {
        List<HistoricoPreciosServicio> historico = servicioCatalogoService.obtenerHistoricoPrecios(id);
        return ResponseEntity.ok(ApiResponse.success("Histórico de precios", historico));
    }
}
