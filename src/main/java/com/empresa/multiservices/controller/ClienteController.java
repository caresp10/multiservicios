package com.empresa.multiservices.controller;

import com.empresa.multiservices.dto.request.ClienteRequest;
import com.empresa.multiservices.dto.response.ApiResponse;
import com.empresa.multiservices.model.Cliente;
import com.empresa.multiservices.service.ClienteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@CrossOrigin(origins = "*")
public class ClienteController {
    
    @Autowired
    private ClienteService clienteService;
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> crear(@Valid @RequestBody ClienteRequest request) {
        Cliente cliente = clienteService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Cliente creado exitosamente", cliente));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> actualizar(@PathVariable Long id, 
                                                   @Valid @RequestBody ClienteRequest request) {
        Cliente cliente = clienteService.actualizar(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cliente actualizado exitosamente", cliente));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> obtenerPorId(@PathVariable Long id) {
        Cliente cliente = clienteService.obtenerPorId(id);
        return ResponseEntity.ok(ApiResponse.success("Cliente encontrado", cliente));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse> listarTodos() {
        List<Cliente> clientes = clienteService.listarTodos();
        return ResponseEntity.ok(ApiResponse.success("Lista de clientes", clientes));
    }
    
    @GetMapping("/activos")
    public ResponseEntity<ApiResponse> listarActivos() {
        List<Cliente> clientes = clienteService.listarActivos();
        return ResponseEntity.ok(ApiResponse.success("Clientes activos", clientes));
    }
    
    @GetMapping("/buscar")
    public ResponseEntity<ApiResponse> buscar(@RequestParam String q) {
        List<Cliente> clientes = clienteService.buscar(q);
        return ResponseEntity.ok(ApiResponse.success("Resultados de búsqueda", clientes));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> eliminar(@PathVariable Long id) {
        clienteService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.success("Cliente eliminado exitosamente", null));
    }
}