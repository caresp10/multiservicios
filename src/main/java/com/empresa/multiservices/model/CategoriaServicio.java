package com.empresa.multiservices.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categorias_servicio")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoriaServicio {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_categoria")
    private Long idCategoria;
    
    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(unique = true, length = 10)
    private String prefijo;  // Ej: "ELEC", "MECAN", "PINTU"

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;
}