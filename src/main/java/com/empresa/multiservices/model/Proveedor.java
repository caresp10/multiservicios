package com.empresa.multiservices.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "proveedores")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Proveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_proveedor")
    private Long idProveedor;

    @NotBlank(message = "El nombre es obligatorio")
    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(name = "razon_social", length = 150)
    private String razonSocial;

    @Column(unique = true, length = 20)
    private String ruc;

    @Column(length = 20)
    private String telefono;

    @Email
    @Column(length = 100)
    private String email;

    @Column(length = 200)
    private String direccion;

    @Column(length = 50)
    private String ciudad;

    @Column(length = 50)
    @Builder.Default
    private String pais = "Paraguay";

    @Column(name = "persona_contacto", length = 100)
    private String personaContacto;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @CreationTimestamp
    @Column(name = "fecha_registro", updatable = false)
    private LocalDateTime fechaRegistro;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
}
