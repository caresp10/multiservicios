package com.empresa.multiservices.service;

import com.empresa.multiservices.dto.request.PedidoRequest;
import com.empresa.multiservices.exception.ResourceNotFoundException;
import com.empresa.multiservices.model.*;
import com.empresa.multiservices.model.enums.EstadoPedido;
import com.empresa.multiservices.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Transactional
public class PedidoService {
    
    @Autowired
    private PedidoRepository pedidoRepository;
    
    @Autowired
    private ClienteRepository clienteRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private CategoriaServicioRepository categoriaRepository;
    
    public Pedido crear(PedidoRequest request) {
        Cliente cliente = clienteRepository.findById(request.getIdCliente())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuarioRecepcion = usuarioRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        CategoriaServicio categoria = null;
        if (request.getIdCategoria() != null) {
            categoria = categoriaRepository.findById(request.getIdCategoria())
                    .orElse(null);
        }
        
        String numeroPedido = generarNumeroPedido();
        
        Pedido pedido = Pedido.builder()
                .numeroPedido(numeroPedido)
                .cliente(cliente)
                .usuarioRecepcion(usuarioRecepcion)
                .categoria(categoria)
                .canal(request.getCanal())
                .descripcion(request.getDescripcion())
                .prioridad(request.getPrioridad())
                .estado(EstadoPedido.NUEVO)
                .observaciones(request.getObservaciones())
                .build();
        
        return pedidoRepository.save(pedido);
    }
    
    public Pedido actualizar(Long id, PedidoRequest request) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado"));
        
        Cliente cliente = clienteRepository.findById(request.getIdCliente())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        
        pedido.setCliente(cliente);
        pedido.setCanal(request.getCanal());
        pedido.setDescripcion(request.getDescripcion());
        pedido.setPrioridad(request.getPrioridad());
        pedido.setObservaciones(request.getObservaciones());
        
        if (request.getIdCategoria() != null) {
            CategoriaServicio categoria = categoriaRepository.findById(request.getIdCategoria())
                    .orElse(null);
            pedido.setCategoria(categoria);
        }
        
        return pedidoRepository.save(pedido);
    }
    
    public Pedido cambiarEstado(Long id, EstadoPedido nuevoEstado) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado"));
        
        pedido.setEstado(nuevoEstado);
        pedido.setFechaEstado(LocalDateTime.now());
        
        return pedidoRepository.save(pedido);
    }
    
    public Pedido obtenerPorId(Long id) {
        return pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado"));
    }
    
    public List<Pedido> listarTodos() {
        return pedidoRepository.findAll();
    }
    
    public List<Pedido> listarPorEstado(EstadoPedido estado) {
        return pedidoRepository.findByEstado(estado);
    }
    
    public List<Pedido> listarPorCliente(Long idCliente) {
        return pedidoRepository.findByClienteIdCliente(idCliente);
    }
    
    public void eliminar(Long id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado"));

        // Validar que el pedido no tenga presupuesto
        if (pedido.getTienePresupuesto() != null && pedido.getTienePresupuesto()) {
            throw new RuntimeException("No se puede eliminar un pedido que tiene presupuesto asociado");
        }

        // Validar que el pedido no tenga OT
        if (pedido.getTieneOt() != null && pedido.getTieneOt()) {
            throw new RuntimeException("No se puede eliminar un pedido que tiene Orden de Trabajo asociada");
        }

        pedidoRepository.delete(pedido);
    }

    private String generarNumeroPedido() {
        String fecha = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = pedidoRepository.count() + 1;
        return String.format("PED-%s-%04d", fecha, count);
    }
}