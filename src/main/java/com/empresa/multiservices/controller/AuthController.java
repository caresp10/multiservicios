package com.empresa.multiservices.controller;

import com.empresa.multiservices.dto.request.LoginRequest;
import com.empresa.multiservices.dto.response.ApiResponse;
import com.empresa.multiservices.dto.response.AuthResponse;
import com.empresa.multiservices.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authResponse = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login exitoso", authResponse));
    }
}