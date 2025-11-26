package com.empresa.multiservices.dto.request;

import com.empresa.multiservices.model.enums.Rol;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UsuarioRequest {
    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;
    
    @NotBlank(message = "El apellido es obligatorio")
    private String apellido;
    
    @Email(message = "Email inválido")
    @NotBlank(message = "El email es obligatorio")
    private String email;
    
    private String telefono;
    
    @NotBlank(message = "El username es obligatorio")
    private String username;
    
    private String password;
    
    @NotNull(message = "El rol es obligatorio")
    private Rol rol;

    private Boolean activo;
}