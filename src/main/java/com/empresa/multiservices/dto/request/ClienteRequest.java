package com.empresa.multiservices.dto.request;

import com.empresa.multiservices.model.enums.TipoCliente;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClienteRequest {
    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;
    
    private String apellido;
    private TipoCliente tipoCliente;
    private String razonSocial;
    private String rucCi;
    private String email;
    
    @NotBlank(message = "El teléfono es obligatorio")
    private String telefono;
    
    private String celular;
    private String direccion;
    private String ciudad;
    private String observaciones;
    private Boolean activo;
}