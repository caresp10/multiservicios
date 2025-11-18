package com.empresa.multiservices.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "historico_precios_repuestos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistoricoPreciosRepuesto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_historico")
    private Long idHistorico;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_repuesto", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Repuesto repuesto;

    @Column(name = "precio_costo_anterior", precision = 12, scale = 2)
    private BigDecimal precioCostoAnterior;

    @Column(name = "precio_costo_nuevo", precision = 12, scale = 2)
    private BigDecimal precioCostoNuevo;

    @Column(name = "precio_venta_anterior", precision = 12, scale = 2)
    private BigDecimal precioVentaAnterior;

    @Column(name = "precio_venta_nuevo", precision = 12, scale = 2)
    private BigDecimal precioVentaNuevo;

    @Column(name = "fecha_cambio", nullable = false)
    private LocalDateTime fechaCambio;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_usuario")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private Usuario usuario;

    @Column(length = 255)
    private String motivo;

    @PrePersist
    protected void onCreate() {
        if (fechaCambio == null) {
            fechaCambio = LocalDateTime.now();
        }
    }
}
