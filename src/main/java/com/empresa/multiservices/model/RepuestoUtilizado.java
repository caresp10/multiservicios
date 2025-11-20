package com.empresa.multiservices.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "repuestos_utilizados")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepuestoUtilizado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_repuesto_utilizado")
    private Long idRepuestoUtilizado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ot", nullable = false)
    private OrdenTrabajo ordenTrabajo;

    // Tipo de item: SERVICIO, REPUESTO o MANUAL
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
    private BigDecimal cantidad;

    @Column(name = "precio_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @CreationTimestamp
    @Column(name = "fecha_registro", updatable = false)
    private LocalDateTime fechaRegistro;

    public enum TipoItem {
        SERVICIO,
        REPUESTO,
        MANUAL
    }
}