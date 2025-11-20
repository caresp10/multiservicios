package com.empresa.multiservices.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "presupuesto_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PresupuestoItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_item")
    private Long idItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_presupuesto", nullable = false)
    @JsonIgnore
    private Presupuesto presupuesto;

    // Tipo de item: SERVICIO o REPUESTO
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_item", length = 20)
    private TipoItem tipoItem;

    // Referencia al servicio del catálogo (si es de tipo SERVICIO)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_servicio")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ServicioCatalogo servicio;

    // Referencia al repuesto (si es de tipo REPUESTO)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_repuesto")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Repuesto repuesto;

    @Column(nullable = false, length = 255)
    private String descripcion;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal cantidad = BigDecimal.ONE;

    @Column(name = "precio_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    // Enum para tipo de item
    public enum TipoItem {
        SERVICIO,
        REPUESTO,
        MANUAL  // Para items ingresados manualmente sin referencia al catálogo
    }
}