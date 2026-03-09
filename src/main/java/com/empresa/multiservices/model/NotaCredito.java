package com.empresa.multiservices.model;

import com.empresa.multiservices.model.enums.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "notas_credito")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class NotaCredito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_nota_credito")
    private Long idNotaCredito;

    @Column(name = "numero_nota_credito", unique = true, nullable = false, length = 20)
    private String numeroNotaCredito;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_factura", nullable = false)
    @JsonIgnoreProperties({"items", "hibernateLazyInitializer", "handler"})
    private Factura factura;

    @Column(name = "fecha_emision", nullable = false)
    @Builder.Default
    private LocalDateTime fechaEmision = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoNotaCredito tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MotivoNotaCredito motivo;

    @Column(name = "descripcion_motivo", columnDefinition = "TEXT")
    private String descripcionMotivo;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal iva = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal total = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoNotaCredito estado = EstadoNotaCredito.PENDIENTE;

    @Column(name = "fecha_aplicacion")
    private LocalDateTime fechaAplicacion;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "notaCredito", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DetalleNotaCredito> detalles = new ArrayList<>();

    // Método para recalcular totales
    public void recalcularTotales() {
        this.subtotal = detalles.stream()
                .map(DetalleNotaCredito::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calcular IVA (10% en Paraguay, ajustar según corresponda)
        this.iva = this.subtotal.multiply(new BigDecimal("0.10"));

        this.total = this.subtotal.add(this.iva);
    }

    // Método helper para agregar detalle
    public void agregarDetalle(DetalleNotaCredito detalle) {
        detalles.add(detalle);
        detalle.setNotaCredito(this);
    }
}
