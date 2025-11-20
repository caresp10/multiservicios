package com.empresa.multiservices.controller;

import com.empresa.multiservices.dto.request.PedidoRequest;
import com.empresa.multiservices.dto.response.ApiResponse;
import com.empresa.multiservices.model.Pedido;
import com.empresa.multiservices.model.enums.EstadoPedido;
import com.empresa.multiservices.service.PedidoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
@CrossOrigin(origins = "*")
public class PedidoController {
    
    @Autowired
    private PedidoService pedidoService;
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> crear(@Valid @RequestBody PedidoRequest request) {
        Pedido pedido = pedidoService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Pedido creado exitosamente", pedido));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> actualizar(@PathVariable Long id, 
                                                   @Valid @RequestBody PedidoRequest request) {
        Pedido pedido = pedidoService.actualizar(id, request);
        return ResponseEntity.ok(ApiResponse.success("Pedido actualizado exitosamente", pedido));
    }
    
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION', 'SUPERVISOR', 'DUENO')")
    public ResponseEntity<ApiResponse> cambiarEstado(@PathVariable Long id, 
                                                      @RequestParam EstadoPedido estado) {
        Pedido pedido = pedidoService.cambiarEstado(id, estado);
        return ResponseEntity.ok(ApiResponse.success("Estado actualizado exitosamente", pedido));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> obtenerPorId(@PathVariable Long id) {
        Pedido pedido = pedidoService.obtenerPorId(id);
        return ResponseEntity.ok(ApiResponse.success("Pedido encontrado", pedido));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse> listarTodos() {
        List<Pedido> pedidos = pedidoService.listarTodos();
        return ResponseEntity.ok(ApiResponse.success("Lista de pedidos", pedidos));
    }
    
    @GetMapping("/estado/{estado}")
    public ResponseEntity<ApiResponse> listarPorEstado(@PathVariable EstadoPedido estado) {
        List<Pedido> pedidos = pedidoService.listarPorEstado(estado);
        return ResponseEntity.ok(ApiResponse.success("Pedidos por estado", pedidos));
    }
    
    @GetMapping("/cliente/{idCliente}")
    public ResponseEntity<ApiResponse> listarPorCliente(@PathVariable Long idCliente) {
        List<Pedido> pedidos = pedidoService.listarPorCliente(idCliente);
        return ResponseEntity.ok(ApiResponse.success("Pedidos del cliente", pedidos));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> eliminar(@PathVariable Long id) {
        try {
            pedidoService.eliminar(id);
            return ResponseEntity.ok(ApiResponse.success("Pedido eliminado exitosamente", null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}