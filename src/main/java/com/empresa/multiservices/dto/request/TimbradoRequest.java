package com.empresa.multiservices.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TimbradoRequest {

    @NotBlank(message = "El número de timbrado es obligatorio")
    private String numero;

    @NotBlank(message = "El establecimiento es obligatorio")
    private String establecimiento;

    @NotBlank(message = "El punto de expedición es obligatorio")
    private String puntoExpedicion;

    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate fechaInicio;

    @NotNull(message = "La fecha de vencimiento es obligatoria")
    private LocalDate fechaVencimiento;

    @NotBlank(message = "El número de inicio es obligatorio")
    private String numeroInicio;

    @NotBlank(message = "El número de fin es obligatorio")
    private String numeroFin;

    private String observaciones;
}
