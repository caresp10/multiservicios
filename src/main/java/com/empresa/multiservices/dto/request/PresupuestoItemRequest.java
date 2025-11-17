package com.empresa.multiservices.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PresupuestoItemRequest {
    @NotBlank(message = "La descripción es obligatoria")
    private String descripcion;
    
    @NotNull(message = "La cantidad es obligatoria")
    private BigDecimal cantidad;
    
    @NotNull(message = "El precio unitario es obligatorio")
    private BigDecimal precioUnitario;
}