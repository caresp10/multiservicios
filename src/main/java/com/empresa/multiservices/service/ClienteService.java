package com.empresa.multiservices.service;

import com.empresa.multiservices.dto.request.ClienteRequest;
import com.empresa.multiservices.exception.ResourceNotFoundException;
import com.empresa.multiservices.model.Cliente;
import com.empresa.multiservices.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ClienteService {
    
    @Autowired
    private ClienteRepository clienteRepository;
    
    public Cliente crear(ClienteRequest request) {
        Cliente cliente = Cliente.builder()
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .tipoCliente(request.getTipoCliente())
                .razonSocial(request.getRazonSocial())
                .rucCi(request.getRucCi())
                .email(request.getEmail())
                .telefono(request.getTelefono())
                .celular(request.getCelular())
                .direccion(request.getDireccion())
                .ciudad(request.getCiudad())
                .observaciones(request.getObservaciones())
                .activo(true)
                .build();
        
        return clienteRepository.save(cliente);
    }
    
    public Cliente actualizar(Long id, ClienteRequest request) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        
        cliente.setNombre(request.getNombre());
        cliente.setApellido(request.getApellido());
        cliente.setTipoCliente(request.getTipoCliente());
        cliente.setRazonSocial(request.getRazonSocial());
        cliente.setRucCi(request.getRucCi());
        cliente.setEmail(request.getEmail());
        cliente.setTelefono(request.getTelefono());
        cliente.setCelular(request.getCelular());
        cliente.setDireccion(request.getDireccion());
        cliente.setCiudad(request.getCiudad());
        cliente.setObservaciones(request.getObservaciones());

        if (request.getActivo() != null) {
            cliente.setActivo(request.getActivo());
        }

        return clienteRepository.save(cliente);
    }
    
    public Cliente obtenerPorId(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
    }
    
    public List<Cliente> listarTodos() {
        return clienteRepository.findAll();
    }
    
    public List<Cliente> listarActivos() {
        return clienteRepository.findByActivoTrue();
    }
    
    public List<Cliente> buscar(String busqueda) {
        return clienteRepository.buscarClientes(busqueda);
    }
    
    public void eliminar(Long id) {
        Cliente cliente = obtenerPorId(id);
        cliente.setActivo(false);
        clienteRepository.save(cliente);
    }
}