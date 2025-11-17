package com.empresa.multiservices.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TecnicoRequest {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @NotBlank(message = "El apellido es obligatorio")
    private String apellido;

    private String ci;

    private String telefono;

    private String celular;

    @Email(message = "Email inválido")
    private String email;

    private String direccion;

    private String especialidad;

    private String nivelExperiencia;

    private String observaciones;

    private Boolean activo = true;

    private Long idUsuario; // Usuario asociado para login (rol TECNICO)
}
