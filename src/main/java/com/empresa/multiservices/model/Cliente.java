package com.empresa.multiservices.model;

import com.empresa.multiservices.model.enums.TipoCliente;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "clientes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Cliente {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cliente")
    private Long idCliente;
    
    @NotBlank(message = "El nombre es obligatorio")
    @Column(nullable = false, length = 100)
    private String nombre;
    
    @Column(length = 100)
    private String apellido;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_cliente", nullable = false)
    @Builder.Default
    private TipoCliente tipoCliente = TipoCliente.PERSONA;
    
    @Column(name = "razon_social", length = 200)
    private String razonSocial;
    
    @Column(name = "ruc_ci", unique = true, length = 20)
    private String rucCi;
    
    @Column(length = 150)
    private String email;
    
    @NotBlank(message = "El teléfono es obligatorio")
    @Column(nullable = false, length = 20)
    private String telefono;
    
    @Column(length = 20)
    private String celular;
    
    @Column(columnDefinition = "TEXT")
    private String direccion;
    
    @Column(length = 100)
    private String ciudad;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;
    
    @CreationTimestamp
    @Column(name = "fecha_registro", updatable = false)
    private LocalDateTime fechaRegistro;
    
    @Column(columnDefinition = "TEXT")
    private String observaciones;
}