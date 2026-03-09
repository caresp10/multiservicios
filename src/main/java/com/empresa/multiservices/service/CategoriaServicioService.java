package com.empresa.multiservices.service;

import com.empresa.multiservices.exception.ResourceNotFoundException;
import com.empresa.multiservices.model.CategoriaServicio;
import com.empresa.multiservices.repository.CategoriaServicioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CategoriaServicioService {

    @Autowired
    private CategoriaServicioRepository categoriaRepository;

    public CategoriaServicio crear(String nombre, String descripcion) {
        // Generar prefijo automáticamente a partir del nombre
        String prefijo = generarPrefijo(nombre);

        CategoriaServicio categoria = CategoriaServicio.builder()
                .nombre(nombre)
                .descripcion(descripcion)
                .prefijo(prefijo)
                .activo(true)
                .build();
        return categoriaRepository.save(categoria);
    }

    /**
     * Genera un prefijo automático a partir del nombre de la categoría
     * Toma las primeras 3-5 letras consonantes del nombre en mayúsculas
     * Ejemplos:
     * - "Electricidad" -> "ELEC"
     * - "Mecánica" -> "MECAN"
     * - "Plomería" -> "PLOM"
     */
    private String generarPrefijo(String nombre) {
        if (nombre == null || nombre.trim().isEmpty()) {
            return "SRV";
        }

        // Limpiar el nombre: eliminar acentos, espacios y caracteres especiales
        String nombreLimpio = nombre.trim()
                .toUpperCase()
                .replaceAll("[ÁÀÄÂ]", "A")
                .replaceAll("[ÉÈËÊ]", "E")
                .replaceAll("[ÍÌÏÎ]", "I")
                .replaceAll("[ÓÒÖÔ]", "O")
                .replaceAll("[ÚÙÜÛ]", "U")
                .replaceAll("[^A-Z]", "");

        if (nombreLimpio.isEmpty()) {
            return "SRV";
        }

        // Extraer consonantes (priorizando consonantes sobre vocales)
        StringBuilder prefijo = new StringBuilder();
        String vocales = "AEIOU";

        // Primero agregar consonantes
        for (char c : nombreLimpio.toCharArray()) {
            if (!vocales.contains(String.valueOf(c))) {
                prefijo.append(c);
                if (prefijo.length() >= 5) break;
            }
        }

        // Si no hay suficientes consonantes, agregar vocales
        if (prefijo.length() < 3) {
            for (char c : nombreLimpio.toCharArray()) {
                if (vocales.contains(String.valueOf(c))) {
                    prefijo.append(c);
                    if (prefijo.length() >= 4) break;
                }
            }
        }

        // Asegurar un mínimo de 3 caracteres
        if (prefijo.length() < 3) {
            prefijo.append("SRV");
        }

        // Limitar a máximo 5 caracteres
        return prefijo.substring(0, Math.min(prefijo.length(), 5));
    }

    public CategoriaServicio actualizar(Long id, String nombre, String descripcion, Boolean activo) {
        CategoriaServicio categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada"));

        categoria.setNombre(nombre);
        categoria.setDescripcion(descripcion);
        if (activo != null) {
            categoria.setActivo(activo);
        }

        return categoriaRepository.save(categoria);
    }

    @Transactional(readOnly = true)
    public CategoriaServicio obtenerPorId(Long id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada"));
    }

    @Transactional(readOnly = true)
    public List<CategoriaServicio> listarTodas() {
        return categoriaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<CategoriaServicio> listarActivas() {
        return categoriaRepository.findByActivoTrue();
    }

    public void eliminar(Long id) {
        CategoriaServicio categoria = obtenerPorId(id);
        categoria.setActivo(false);
        categoriaRepository.save(categoria);
    }
}
