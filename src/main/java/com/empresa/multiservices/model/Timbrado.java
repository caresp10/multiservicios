package com.empresa.multiservices.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "timbrados")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Timbrado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_timbrado")
    private Long idTimbrado;

    @Column(nullable = false, length = 20)
    private String numero;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String establecimiento = "001";

    @Column(name = "punto_expedicion", nullable = false, length = 3)
    @Builder.Default
    private String puntoExpedicion = "001";

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_vencimiento", nullable = false)
    private LocalDate fechaVencimiento;

    @Column(name = "numero_inicio", nullable = false, length = 20)
    private String numeroInicio;

    @Column(name = "numero_fin", nullable = false, length = 20)
    private String numeroFin;

    @Column(name = "numero_actual", nullable = false, length = 20)
    private String numeroActual;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    /**
     * Verifica si el timbrado está vencido
     */
    public boolean isVencido() {
        return LocalDate.now().isAfter(fechaVencimiento);
    }

    /**
     * Verifica si el timbrado está vigente
     */
    public boolean isVigente() {
        LocalDate hoy = LocalDate.now();
        return !hoy.isBefore(fechaInicio) && !hoy.isAfter(fechaVencimiento) && activo;
    }

    /**
     * Obtiene el siguiente número de factura y actualiza el contador
     * Retorna el número en formato: 001-001-0000001 (establecimiento-punto-numero)
     */
    public String obtenerSiguienteNumero() {
        String resultado = numeroActual;

        // Incrementar el número actual para la próxima factura
        try {
            long numActual = Long.parseLong(numeroActual);
            long numFin = Long.parseLong(numeroFin);

            if (numActual >= numFin) {
                throw new RuntimeException("Se alcanzó el límite de numeración del timbrado");
            }

            numActual++;
            this.numeroActual = String.format("%0" + numeroActual.length() + "d", numActual);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Error al generar número de factura", e);
        }

        // Formatear el resultado como: establecimiento-punto-numero
        return establecimiento + "-" + puntoExpedicion + "-" + resultado;
    }
}
