package com.empresa.multiservices.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
public class PresupuestoRequest {
    @NotNull(message = "El ID del pedido es obligatorio")
    private Long idPedido;

    @NotNull(message = "El estado es obligatorio")
    private String estado;

    @NotNull(message = "El subtotal es obligatorio")
    private BigDecimal subtotal;

    private BigDecimal descuento = BigDecimal.ZERO;

    @NotNull(message = "El IVA es obligatorio")
    private BigDecimal iva;

    @NotNull(message = "El total es obligatorio")
    private BigDecimal total;

    private Integer validezDias = 15;

    private LocalDate fechaVencimiento;

    private String condicionesPago;

    private String observaciones;

    @Valid
    @NotNull(message = "Debe incluir al menos un item")
    private List<PresupuestoItemRequest> items = new ArrayList<>();
}
