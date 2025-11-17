package com.empresa.multiservices.dto.request;

import com.empresa.multiservices.model.enums.CanalPedido;
import com.empresa.multiservices.model.enums.Prioridad;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PedidoRequest {
    @NotNull(message = "El cliente es obligatorio")
    private Long idCliente;
    
    private Long idCategoria;
    
    @NotNull(message = "El canal es obligatorio")
    private CanalPedido canal;
    
    @NotBlank(message = "La descripción es obligatoria")
    private String descripcion;
    
    private Prioridad prioridad;
    private String observaciones;
}