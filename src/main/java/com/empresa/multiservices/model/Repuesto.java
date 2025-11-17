package com.empresa.multiservices.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "repuestos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Repuesto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_repuesto")
    private Long idRepuesto;

    @NotBlank(message = "El código es obligatorio")
    @Column(unique = true, nullable = false, length = 50)
    private String codigo;

    @NotBlank(message = "El nombre es obligatorio")
    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(length = 50)
    private String marca;

    @Column(length = 50)
    private String modelo;

    @Column(length = 50)
    private String categoria;

    @Column(name = "unidad_medida", length = 20)
    @Builder.Default
    private String unidadMedida = "Unidad";

    @DecimalMin(value = "0.0", message = "El precio de compra debe ser mayor o igual a 0")
    @Column(name = "precio_compra", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal precioCompra = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", message = "El precio de venta debe ser mayor o igual a 0")
    @Column(name = "precio_venta", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal precioVenta = BigDecimal.ZERO;

    @Min(value = 0, message = "El stock actual no puede ser negativo")
    @Column(name = "stock_actual", nullable = false)
    @Builder.Default
    private Integer stockActual = 0;

    @Column(name = "stock_minimo")
    @Builder.Default
    private Integer stockMinimo = 5;

    @Column(name = "stock_maximo")
    @Builder.Default
    private Integer stockMaximo = 100;

    @Column(length = 50)
    private String ubicacion;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @CreationTimestamp
    @Column(name = "fecha_registro", updatable = false)
    private LocalDateTime fechaRegistro;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Métodos auxiliares para control de stock
    public boolean necesitaReabastecimiento() {
        return stockActual <= stockMinimo;
    }

    public boolean tieneStockDisponible(int cantidad) {
        return stockActual >= cantidad;
    }

    public void incrementarStock(int cantidad) {
        this.stockActual += cantidad;
    }

    public void decrementarStock(int cantidad) {
        if (cantidad > stockActual) {
            throw new IllegalArgumentException("No hay suficiente stock disponible");
        }
        this.stockActual -= cantidad;
    }
}
