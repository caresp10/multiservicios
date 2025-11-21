package com.empresa.multiservices.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "lotes_repuestos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoteRepuesto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_lote")
    private Long idLote;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_repuesto", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Repuesto repuesto;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_compra")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "detalles"})
    private Compra compra;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_proveedor", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Proveedor proveedor;

    @Column(name = "numero_lote", length = 50)
    private String numeroLote;

    @NotNull
    @Min(value = 1, message = "La cantidad inicial debe ser mayor a 0")
    @Column(name = "cantidad_inicial", nullable = false)
    private Integer cantidadInicial;

    @NotNull
    @Min(value = 0, message = "La cantidad disponible no puede ser negativa")
    @Column(name = "cantidad_disponible", nullable = false)
    private Integer cantidadDisponible;

    @NotNull
    @Column(name = "precio_costo_unitario", precision = 12, scale = 2, nullable = false)
    private BigDecimal precioCostoUnitario;

    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento;

    @CreationTimestamp
    @Column(name = "fecha_ingreso", nullable = false, updatable = false)
    private LocalDateTime fechaIngreso;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    // Métodos auxiliares
    public boolean tieneStockDisponible(int cantidad) {
        return cantidadDisponible >= cantidad;
    }

    public void descontarStock(int cantidad) {
        if (cantidad > cantidadDisponible) {
            throw new IllegalArgumentException("No hay suficiente stock en el lote");
        }
        this.cantidadDisponible -= cantidad;
    }

    public void devolverStock(int cantidad) {
        this.cantidadDisponible += cantidad;
        // No puede superar la cantidad inicial
        if (this.cantidadDisponible > this.cantidadInicial) {
            this.cantidadDisponible = this.cantidadInicial;
        }
    }

    public boolean estaVencido() {
        if (fechaVencimiento == null) {
            return false;
        }
        return LocalDate.now().isAfter(fechaVencimiento);
    }

    public boolean estaAgotado() {
        return cantidadDisponible <= 0;
    }
}
