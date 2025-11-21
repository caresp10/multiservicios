package com.empresa.multiservices.model;

import com.empresa.multiservices.model.enums.EstadoOT;
import com.empresa.multiservices.model.enums.Prioridad;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ordenes_trabajo")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class OrdenTrabajo {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_ot")
    private Long idOt;
    
    @Column(name = "numero_ot", unique = true, nullable = false, length = 20)
    private String numeroOt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_pedido", nullable = false)
    private Pedido pedido;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_presupuesto")
    private Presupuesto presupuesto;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tecnico_asignado")
    private Tecnico tecnico;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_supervisor")
    private Usuario supervisor;
    
    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;
    
    @Column(name = "fecha_asignacion")
    private LocalDateTime fechaAsignacion;
    
    @Column(name = "fecha_inicio")
    private LocalDateTime fechaInicio;
    
    @Column(name = "fecha_finalizacion")
    private LocalDateTime fechaFinalizacion;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20)")
    @Builder.Default
    private EstadoOT estado = EstadoOT.ABIERTA;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(20)")
    @Builder.Default
    private Prioridad prioridad = Prioridad.MEDIA;
    
    @Column(name = "descripcion_trabajo", nullable = false, columnDefinition = "TEXT")
    private String descripcionTrabajo;
    
    @Column(name = "diagnostico_tecnico", columnDefinition = "TEXT")
    private String diagnosticoTecnico;
    
    @Column(name = "informe_final", columnDefinition = "TEXT")
    private String informeFinal;
    
    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "observaciones_devolucion", columnDefinition = "TEXT")
    private String observacionesDevolucion;

    @Column(name = "justificacion_ajuste", columnDefinition = "TEXT")
    private String justificacionAjuste;

    // CORREGIDO: Sin precision/scale para Double
    @Column(name = "horas_trabajadas")
    private Double horasTrabajadas;

    @Column(name = "costo_mano_obra", precision = 12, scale = 2)
    private BigDecimal costoManoObra;

    @Column(name = "presupuesto_final", precision = 12, scale = 2)
    private BigDecimal presupuestoFinal;

    @OneToMany(mappedBy = "ordenTrabajo", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RepuestoUtilizado> repuestos = new ArrayList<>();
}