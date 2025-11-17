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
        CategoriaServicio categoria = CategoriaServicio.builder()
                .nombre(nombre)
                .descripcion(descripcion)
                .activo(true)
                .build();
        return categoriaRepository.save(categoria);
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
