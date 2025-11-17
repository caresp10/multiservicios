package com.empresa.multiservices.service;

import com.empresa.multiservices.exception.ResourceNotFoundException;
import com.empresa.multiservices.model.Proveedor;
import com.empresa.multiservices.repository.ProveedorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ProveedorService {

    @Autowired
    private ProveedorRepository proveedorRepository;

    public Proveedor crear(Proveedor proveedor) {
        if (proveedor.getRuc() != null && proveedorRepository.existsByRuc(proveedor.getRuc())) {
            throw new IllegalArgumentException("Ya existe un proveedor con el RUC: " + proveedor.getRuc());
        }
        proveedor.setActivo(true);
        return proveedorRepository.save(proveedor);
    }

    public Proveedor actualizar(Long id, Proveedor proveedorActualizado) {
        Proveedor proveedor = proveedorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado"));

        // Validar RUC único si se está modificando
        if (proveedorActualizado.getRuc() != null &&
            !proveedorActualizado.getRuc().equals(proveedor.getRuc()) &&
            proveedorRepository.existsByRuc(proveedorActualizado.getRuc())) {
            throw new IllegalArgumentException("Ya existe un proveedor con el RUC: " + proveedorActualizado.getRuc());
        }

        proveedor.setNombre(proveedorActualizado.getNombre());
        proveedor.setRazonSocial(proveedorActualizado.getRazonSocial());
        proveedor.setRuc(proveedorActualizado.getRuc());
        proveedor.setTelefono(proveedorActualizado.getTelefono());
        proveedor.setEmail(proveedorActualizado.getEmail());
        proveedor.setDireccion(proveedorActualizado.getDireccion());
        proveedor.setCiudad(proveedorActualizado.getCiudad());
        proveedor.setPais(proveedorActualizado.getPais());
        proveedor.setPersonaContacto(proveedorActualizado.getPersonaContacto());
        proveedor.setObservaciones(proveedorActualizado.getObservaciones());

        return proveedorRepository.save(proveedor);
    }

    @Transactional(readOnly = true)
    public List<Proveedor> listarTodos() {
        return proveedorRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Proveedor> listarActivos() {
        return proveedorRepository.findByActivoTrue();
    }

    @Transactional(readOnly = true)
    public Proveedor obtenerPorId(Long id) {
        return proveedorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado"));
    }

    @Transactional(readOnly = true)
    public List<Proveedor> buscar(String termino) {
        return proveedorRepository.findByNombreContainingIgnoreCaseOrRazonSocialContainingIgnoreCase(termino, termino);
    }

    public void eliminar(Long id) {
        Proveedor proveedor = obtenerPorId(id);
        proveedor.setActivo(false);
        proveedorRepository.save(proveedor);
    }

    public void activar(Long id) {
        Proveedor proveedor = obtenerPorId(id);
        proveedor.setActivo(true);
        proveedorRepository.save(proveedor);
    }
}
