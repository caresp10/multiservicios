package com.empresa.multiservices.controller;

import com.empresa.multiservices.dto.response.ApiResponse;
import com.empresa.multiservices.model.OrdenTrabajo;
import com.empresa.multiservices.model.enums.EstadoOT;
import com.empresa.multiservices.service.OrdenTrabajoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ordenes-trabajo")
@CrossOrigin(origins = "*")
public class OrdenTrabajoController {
    
    @Autowired
    private OrdenTrabajoService otService;
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> crear(@RequestBody Map<String, Long> request) {
        Long idPedido = request.get("idPedido");
        Long idPresupuesto = request.get("idPresupuesto");
        Long idTecnico = request.get("idTecnico");

        OrdenTrabajo ot = otService.crear(idPedido, idPresupuesto, idTecnico);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Orden de trabajo creada exitosamente", ot));
    }
    
    @PatchMapping("/{id}/asignar")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> asignarTecnico(@PathVariable Long id,
                                                       @RequestBody Map<String, Long> request) {
        Long idTecnico = request.get("idTecnico");
        OrdenTrabajo ot = otService.asignarTecnico(id, idTecnico);
        return ResponseEntity.ok(ApiResponse.success("Técnico asignado exitosamente", ot));
    }

    @PatchMapping("/{id}/reasignar")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> reasignarTecnico(@PathVariable Long id,
                                                         @RequestBody Map<String, Object> request) {
        Long idNuevoTecnico = ((Number) request.get("idTecnico")).longValue();
        String motivo = (String) request.get("motivo");
        OrdenTrabajo ot = otService.reasignarTecnico(id, idNuevoTecnico, motivo);
        return ResponseEntity.ok(ApiResponse.success("Técnico reasignado exitosamente", ot));
    }
    
    @PatchMapping("/{id}/iniciar")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECNICO', 'SUPERVISOR')")
    public ResponseEntity<ApiResponse> iniciarTrabajo(@PathVariable Long id) {
        OrdenTrabajo ot = otService.iniciarTrabajo(id);
        return ResponseEntity.ok(ApiResponse.success("Trabajo iniciado", ot));
    }
    
    @PatchMapping("/{id}/diagnostico")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECNICO')")
    public ResponseEntity<ApiResponse> cargarDiagnostico(@PathVariable Long id, 
                                                          @RequestBody Map<String, String> request) {
        String diagnostico = request.get("diagnostico");
        OrdenTrabajo ot = otService.cargarDiagnostico(id, diagnostico);
        return ResponseEntity.ok(ApiResponse.success("Diagnóstico cargado", ot));
    }
    
    @PatchMapping("/{id}/finalizar")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECNICO')")
    public ResponseEntity<ApiResponse> finalizarTrabajo(@PathVariable Long id, 
                                                         @RequestBody Map<String, Object> request) {
        String informeFinal = (String) request.get("informeFinal");
        Double horasTrabajadas = ((Number) request.get("horasTrabajadas")).doubleValue();
        
        OrdenTrabajo ot = otService.finalizarTrabajo(id, informeFinal, horasTrabajadas);
        return ResponseEntity.ok(ApiResponse.success("Trabajo finalizado", ot));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> obtenerPorId(@PathVariable Long id) {
        OrdenTrabajo ot = otService.obtenerPorId(id);
        return ResponseEntity.ok(ApiResponse.success("Orden de trabajo encontrada", ot));
    }
    
    @GetMapping("/tecnico/{idTecnico}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECNICO', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> listarPorTecnico(@PathVariable Long idTecnico) {
        List<OrdenTrabajo> ordenes = otService.listarPorTecnico(idTecnico);
        return ResponseEntity.ok(ApiResponse.success("Órdenes del técnico", ordenes));
    }
    
    @GetMapping("/estado/{estado}")
    public ResponseEntity<ApiResponse> listarPorEstado(@PathVariable EstadoOT estado) {
        List<OrdenTrabajo> ordenes = otService.listarPorEstado(estado);
        return ResponseEntity.ok(ApiResponse.success("Órdenes por estado", ordenes));
    }

    @GetMapping
    public ResponseEntity<ApiResponse> listar() {
        List<OrdenTrabajo> ordenes = otService.listar();
        return ResponseEntity.ok(ApiResponse.success("Lista de órdenes de trabajo", ordenes));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'DUENO', 'TECNICO')")
    public ResponseEntity<ApiResponse> actualizar(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        OrdenTrabajo ot = otService.actualizar(id, request);
        return ResponseEntity.ok(ApiResponse.success("Orden de trabajo actualizada exitosamente", ot));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> eliminar(@PathVariable Long id) {
        // Las órdenes de trabajo no se pueden eliminar por regla de negocio
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Las órdenes de trabajo no se pueden eliminar. Forman parte del historial del pedido."));
    }
}