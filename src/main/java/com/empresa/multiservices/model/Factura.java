package com.empresa.multiservices.model;

import com.empresa.multiservices.model.enums.EstadoFactura;
import com.empresa.multiservices.model.enums.FormaPago;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "facturas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Factura {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_factura")
    private Long idFactura;
    
    @Column(name = "numero_factura", unique = true, nullable = false, length = 20)
    private String numeroFactura;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_pedido", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "facturas", "ordenesTrabajo", "presupuestos"})
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ot")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "pedido", "presupuesto", "repuestos", "tecnico"})
    private OrdenTrabajo ot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_presupuesto")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "pedido", "items"})
    private Presupuesto presupuesto;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_cliente", nullable = false)
    @JsonIgnoreProperties({"facturas", "pedidos"})
    private Cliente cliente;
    
    @CreationTimestamp
    @Column(name = "fecha_emision", updatable = false)
    private LocalDateTime fechaEmision;
    
    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento;
    
    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal descuento = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal iva = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal total = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20)")
    @Builder.Default
    private EstadoFactura estado = EstadoFactura.PENDIENTE;

    @Enumerated(EnumType.STRING)
    @Column(name = "forma_pago", columnDefinition = "VARCHAR(20)")
    @Builder.Default
    private FormaPago formaPago = FormaPago.EFECTIVO;
    
    @Column(name = "fecha_pago")
    private LocalDateTime fechaPago;
    
    @Column(columnDefinition = "TEXT")
    private String observaciones;
    
    @Column(length = 20)
    private String timbrado;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_timbrado")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Timbrado timbradoObj;

    @OneToMany(mappedBy = "factura", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FacturaItem> items = new ArrayList<>();
}