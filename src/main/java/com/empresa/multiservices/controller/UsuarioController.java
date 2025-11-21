package com.empresa.multiservices.controller;

import com.empresa.multiservices.dto.request.UsuarioRequest;
import com.empresa.multiservices.dto.response.ApiResponse;
import com.empresa.multiservices.model.Usuario;
import com.empresa.multiservices.model.enums.Rol;
import com.empresa.multiservices.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {
    
    @Autowired
    private UsuarioService usuarioService;
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> crear(@Valid @RequestBody UsuarioRequest request) {
        Usuario usuario = usuarioService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Usuario creado exitosamente", usuario));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> actualizar(@PathVariable Long id, 
                                                   @Valid @RequestBody UsuarioRequest request) {
        Usuario usuario = usuarioService.actualizar(id, request);
        return ResponseEntity.ok(ApiResponse.success("Usuario actualizado exitosamente", usuario));
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'SUPERVISOR')")
    public ResponseEntity<ApiResponse> obtenerPorId(@PathVariable Long id) {
        Usuario usuario = usuarioService.obtenerPorId(id);
        return ResponseEntity.ok(ApiResponse.success("Usuario encontrado", usuario));
    }
    
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'SUPERVISOR')")
    public ResponseEntity<ApiResponse> listarTodos() {
        List<Usuario> usuarios = usuarioService.listarTodos();
        return ResponseEntity.ok(ApiResponse.success("Lista de usuarios", usuarios));
    }
    
    @GetMapping("/activos")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'SUPERVISOR')")
    public ResponseEntity<ApiResponse> listarActivos() {
        List<Usuario> usuarios = usuarioService.listarActivos();
        return ResponseEntity.ok(ApiResponse.success("Usuarios activos", usuarios));
    }
    
    @GetMapping("/rol/{rol}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'SUPERVISOR')")
    public ResponseEntity<ApiResponse> listarPorRol(@PathVariable Rol rol) {
        List<Usuario> usuarios = usuarioService.listarPorRol(rol);
        return ResponseEntity.ok(ApiResponse.success("Usuarios por rol", usuarios));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> eliminar(@PathVariable Long id) {
        usuarioService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.success("Usuario eliminado exitosamente", null));
    }

    @GetMapping("/roles")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'SUPERVISOR')")
    public ResponseEntity<ApiResponse> obtenerRoles() {
        List<Map<String, String>> roles = Arrays.stream(Rol.values())
                .map(rol -> Map.of(
                        "valor", rol.name(),
                        "nombre", formatRolNombre(rol)
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Lista de roles", roles));
    }

    private String formatRolNombre(Rol rol) {
        return switch (rol) {
            case ADMIN -> "Administrador";
            case TECNICO -> "Técnico";
            case SUPERVISOR -> "Supervisor";
            case DUENO -> "Dueño";
            case RECEPCION -> "Recepción";
        };
    }
}