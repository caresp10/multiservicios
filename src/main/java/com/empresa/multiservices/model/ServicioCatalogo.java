package com.empresa.multiservices.model;

import com.empresa.multiservices.model.enums.UnidadMedida;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "servicios_catalogo")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServicioCatalogo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_servicio")
    private Long idServicio;

    @Column(name = "codigo", unique = true, nullable = false, length = 50)
    private String codigo;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_categoria")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private CategoriaServicio categoria;

    @Column(name = "precio_base", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioBase;

    @Enumerated(EnumType.STRING)
    @Column(name = "unidad_medida", nullable = false, length = 20)
    private UnidadMedida unidadMedida;

    @Column(name = "tiempo_estimado_horas", precision = 5, scale = 2)
    private BigDecimal tiempoEstimadoHoras;

    @Column(name = "incluye_materiales", nullable = false)
    private Boolean incluyeMateriales = false;

    @Column(name = "notas_adicionales", columnDefinition = "TEXT")
    private String notasAdicionales;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (activo == null) {
            activo = true;
        }
        if (incluyeMateriales == null) {
            incluyeMateriales = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
