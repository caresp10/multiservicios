package com.empresa.multiservices.dto.request;

import com.empresa.multiservices.model.PresupuestoItem;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PresupuestoItemRequest {

    // Tipo de item (SERVICIO, REPUESTO, MANUAL)
    private PresupuestoItem.TipoItem tipoItem;

    // ID del servicio del catálogo (si tipoItem = SERVICIO)
    private Long idServicio;

    // ID del repuesto (si tipoItem = REPUESTO)
    private Long idRepuesto;

    @NotBlank(message = "La descripción es obligatoria")
    private String descripcion;

    @NotNull(message = "La cantidad es obligatoria")
    private BigDecimal cantidad;

    @NotNull(message = "El precio unitario es obligatorio")
    private BigDecimal precioUnitario;
}