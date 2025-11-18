package com.empresa.multiservices.model;

import com.empresa.multiservices.model.enums.TipoItemFactura;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "factura_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacturaItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_item")
    private Long idItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_factura", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Factura factura;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_item", nullable = false)
    private TipoItemFactura tipoItem;

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
}