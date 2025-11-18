package com.empresa.multiservices.model;

import com.empresa.multiservices.model.enums.UnidadMedida;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_categoria")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private CategoriaServicio categoria;

    @DecimalMin(value = "0.0", message = "El precio de costo debe ser mayor o igual a 0")
    @Column(name = "precio_costo", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal precioCosto = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", message = "El precio de venta debe ser mayor o igual a 0")
    @Column(name = "precio_venta", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal precioVenta = BigDecimal.ZERO;

    // Margen calculado automáticamente por la BD
    @Column(name = "margen_ganancia", precision = 5, scale = 2, insertable = false, updatable = false)
    private BigDecimal margenGanancia;

    @Min(value = 0, message = "El stock actual no puede ser negativo")
    @Column(name = "stock_actual", nullable = false)
    @Builder.Default
    private Integer stockActual = 0;

    @Column(name = "stock_minimo")
    @Builder.Default
    private Integer stockMinimo = 10;

    @Column(name = "stock_maximo")
    @Builder.Default
    private Integer stockMaximo = 100;

    @Column(name = "punto_reorden")
    private Integer puntoReorden;

    @Column(length = 100)
    private String ubicacion;

    @Column(length = 100)
    private String proveedor;

    @Column(name = "telefono_proveedor", length = 20)
    private String telefonoProveedor;

    @Enumerated(EnumType.STRING)
    @Column(name = "unidad_medida", length = 20)
    @Builder.Default
    private UnidadMedida unidadMedida = UnidadMedida.UNIDAD;

    @Column(length = 50)
    private String marca;

    @Column(length = 50)
    private String modelo;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Métodos auxiliares para control de stock
    public boolean necesitaReabastecimiento() {
        if (puntoReorden != null) {
            return stockActual <= puntoReorden;
        }
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

    public boolean esStockBajo() {
        return stockActual < stockMinimo;
    }
}
