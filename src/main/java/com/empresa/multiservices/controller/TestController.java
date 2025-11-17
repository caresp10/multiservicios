package com.empresa.multiservices.controller;

import com.empresa.multiservices.model.Usuario;
import com.empresa.multiservices.model.enums.Rol;
import com.empresa.multiservices.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @GetMapping("/crear-admin")
    public Map<String, String> crearAdmin() {
        Map<String, String> response = new HashMap<>();
        
        try {
            // Eliminar si existe
            usuarioRepository.findByUsername("testadmin").ifPresent(u -> usuarioRepository.delete(u));
            
            // Crear nuevo
            Usuario admin = Usuario.builder()
                    .nombre("Test")
                    .apellido("Admin")
                    .email("testadmin@test.com")
                    .username("testadmin")
                    .password(passwordEncoder.encode("123456"))
                    .rol(Rol.ADMIN)
                    .activo(true)
                    .build();
            
            usuarioRepository.save(admin);
            
            response.put("status", "success");
            response.put("message", "Usuario creado: testadmin / 123456");
            response.put("passwordHash", admin.getPassword());
            
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
        }
        
        return response;
    }
    
    @GetMapping("/verificar-admin")
    public Map<String, Object> verificarAdmin() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Usuario usuario = usuarioRepository.findByUsername("admin")
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            response.put("existe", true);
            response.put("username", usuario.getUsername());
            response.put("activo", usuario.getActivo());
            response.put("rol", usuario.getRol());
            response.put("passwordLength", usuario.getPassword().length());
            response.put("passwordStart", usuario.getPassword().substring(0, 10));
            
        } catch (Exception e) {
            response.put("existe", false);
            response.put("error", e.getMessage());
        }
        
        return response;
    }
}