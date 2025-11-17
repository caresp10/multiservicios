package com.empresa.multiservices.dto.response;

import com.empresa.multiservices.model.enums.Rol;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    @Builder.Default
    private String tipo = "Bearer";
    private Long idUsuario;
    private String username;
    private String nombre;
    private String apellido;
    private Rol rol;
}