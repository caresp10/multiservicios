package com.empresa.multiservices.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orden_trabajo_repuestos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrdenTrabajoRepuesto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_ot_repuesto")
    private Long idOtRepuesto;

    @NotNull(message = "La orden de trabajo es obligatoria")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_orden_trabajo", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private OrdenTrabajo ordenTrabajo;

    @NotNull(message = "El repuesto es obligatorio")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_repuesto", nullable = false)
    private Repuesto repuesto;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    @Column(nullable = false)
    private Integer cantidad;

    @NotNull(message = "El precio unitario es obligatorio")
    @DecimalMin(value = "0.0", message = "El precio unitario debe ser mayor o igual a 0")
    @Column(name = "precio_unitario", precision = 10, scale = 2, nullable = false)
    private BigDecimal precioUnitario;

    @NotNull(message = "El subtotal es obligatorio")
    @DecimalMin(value = "0.0", message = "El subtotal debe ser mayor o igual a 0")
    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal subtotal;

    @CreationTimestamp
    @Column(name = "fecha_registro", updatable = false)
    private LocalDateTime fechaRegistro;

    // Método para calcular subtotal automáticamente
    @PrePersist
    @PreUpdate
    public void calcularSubtotal() {
        if (cantidad != null && precioUnitario != null) {
            this.subtotal = precioUnitario.multiply(new BigDecimal(cantidad));
        }
    }

    // Método auxiliar para obtener el total usando el precio de venta del repuesto
    public static OrdenTrabajoRepuesto crear(OrdenTrabajo ordenTrabajo, Repuesto repuesto, Integer cantidad) {
        return OrdenTrabajoRepuesto.builder()
                .ordenTrabajo(ordenTrabajo)
                .repuesto(repuesto)
                .cantidad(cantidad)
                .precioUnitario(repuesto.getPrecioVenta())
                .subtotal(repuesto.getPrecioVenta().multiply(new BigDecimal(cantidad)))
                .build();
    }
}
