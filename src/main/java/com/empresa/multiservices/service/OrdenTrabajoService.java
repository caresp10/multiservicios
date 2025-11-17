package com.empresa.multiservices.service;

import com.empresa.multiservices.exception.ResourceNotFoundException;
import com.empresa.multiservices.model.*;
import com.empresa.multiservices.model.enums.*;
import com.empresa.multiservices.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class OrdenTrabajoService {
    
    @Autowired
    private OrdenTrabajoRepository otRepository;
    
    @Autowired
    private PedidoRepository pedidoRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PresupuestoRepository presupuestoRepository;

    @Autowired
    private TecnicoRepository tecnicoRepository;

    public OrdenTrabajo crear(Long idPedido, Long idPresupuesto, Long idTecnico) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado"));

        // Validar que el pedido tenga un presupuesto ACEPTADO
        Presupuesto presupuesto = null;
        if (idPresupuesto != null) {
            presupuesto = presupuestoRepository.findById(idPresupuesto)
                    .orElseThrow(() -> new ResourceNotFoundException("Presupuesto no encontrado"));

            if (presupuesto.getEstado() != EstadoPresupuesto.ACEPTADO) {
                throw new RuntimeException("Solo se puede crear una Orden de Trabajo si el presupuesto está ACEPTADO");
            }
        } else {
            // Si no se proporciona presupuesto, verificar que el pedido tenga un presupuesto aceptado
            throw new RuntimeException("Debe seleccionar un presupuesto ACEPTADO para crear la Orden de Trabajo");
        }

        Tecnico tecnico = null;
        if (idTecnico != null) {
            tecnico = tecnicoRepository.findById(idTecnico)
                    .orElseThrow(() -> new ResourceNotFoundException("Técnico no encontrado"));
        }

        String numeroOt = generarNumeroOT();

        OrdenTrabajo ot = OrdenTrabajo.builder()
                .numeroOt(numeroOt)
                .pedido(pedido)
                .presupuesto(presupuesto)
                .tecnico(tecnico)
                .descripcionTrabajo(pedido.getDescripcion())
                .estado(tecnico != null ? EstadoOT.ASIGNADA : EstadoOT.ABIERTA)
                .prioridad(pedido.getPrioridad())
                .build();
        
        if (tecnico != null) {
            ot.setFechaAsignacion(LocalDateTime.now());
        }
        
        ot = otRepository.save(ot);
        
        // Actualizar estado del pedido
        pedido.setTieneOt(true);
        pedido.setEstado(EstadoPedido.OT_GENERADA);
        pedidoRepository.save(pedido);
        
        return ot;
    }
    
    public OrdenTrabajo asignarTecnico(Long idOt, Long idTecnico) {
        OrdenTrabajo ot = otRepository.findById(idOt)
                .orElseThrow(() -> new ResourceNotFoundException("Orden de trabajo no encontrada"));

        Tecnico tecnico = tecnicoRepository.findById(idTecnico)
                .orElseThrow(() -> new ResourceNotFoundException("Técnico no encontrado"));

        ot.setTecnico(tecnico);
        ot.setFechaAsignacion(LocalDateTime.now());
        ot.setEstado(EstadoOT.ASIGNADA);

        return otRepository.save(ot);
    }
    
    public OrdenTrabajo iniciarTrabajo(Long idOt) {
        OrdenTrabajo ot = otRepository.findById(idOt)
                .orElseThrow(() -> new ResourceNotFoundException("Orden de trabajo no encontrada"));
        
        ot.setEstado(EstadoOT.EN_PROCESO);
        ot.setFechaInicio(LocalDateTime.now());
        
        // Actualizar estado del pedido
        Pedido pedido = ot.getPedido();
        pedido.setEstado(EstadoPedido.OT_EN_PROCESO);
        pedidoRepository.save(pedido);
        
        return otRepository.save(ot);
    }
    
    public OrdenTrabajo cargarDiagnostico(Long idOt, String diagnostico) {
        OrdenTrabajo ot = otRepository.findById(idOt)
                .orElseThrow(() -> new ResourceNotFoundException("Orden de trabajo no encontrada"));
        
        ot.setDiagnosticoTecnico(diagnostico);
        return otRepository.save(ot);
    }
    
    public OrdenTrabajo finalizarTrabajo(Long idOt, String informeFinal, Double horasTrabajadas) {
        OrdenTrabajo ot = otRepository.findById(idOt)
                .orElseThrow(() -> new ResourceNotFoundException("Orden de trabajo no encontrada"));
        
        ot.setInformeFinal(informeFinal);
        ot.setHorasTrabajadas(horasTrabajadas);
        ot.setEstado(EstadoOT.TERMINADA);
        ot.setFechaFinalizacion(LocalDateTime.now());
        
        // Actualizar estado del pedido
        Pedido pedido = ot.getPedido();
        pedido.setEstado(EstadoPedido.OT_TERMINADA);
        pedidoRepository.save(pedido);
        
        return otRepository.save(ot);
    }
    
    public List<OrdenTrabajo> listarPorTecnico(Long idTecnico) {
        return otRepository.findByTecnicoIdTecnico(idTecnico);
    }
    
    public List<OrdenTrabajo> listarPorEstado(EstadoOT estado) {
        return otRepository.findByEstado(estado);
    }
    
    public OrdenTrabajo obtenerPorId(Long id) {
        return otRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Orden de trabajo no encontrada"));
    }

    @Transactional(readOnly = true)
    public List<OrdenTrabajo> listar() {
        return otRepository.findAll();
    }

    public OrdenTrabajo actualizar(Long id, Map<String, Object> datos) {
        OrdenTrabajo ot = otRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Orden de trabajo no encontrada"));

        // Actualizar técnico asignado si se proporciona
        if (datos.containsKey("idTecnicoAsignado") && datos.get("idTecnicoAsignado") != null) {
            Long idTecnico = ((Number) datos.get("idTecnicoAsignado")).longValue();
            Tecnico tecnico = tecnicoRepository.findById(idTecnico)
                    .orElseThrow(() -> new ResourceNotFoundException("Técnico no encontrado"));
            ot.setTecnico(tecnico);
        }

        // Actualizar campos básicos
        if (datos.containsKey("prioridad")) {
            ot.setPrioridad(Prioridad.valueOf((String) datos.get("prioridad")));
        }
        if (datos.containsKey("estado")) {
            ot.setEstado(EstadoOT.valueOf((String) datos.get("estado")));
        }
        if (datos.containsKey("descripcionTrabajo")) {
            ot.setDescripcionTrabajo((String) datos.get("descripcionTrabajo"));
        }
        if (datos.containsKey("diagnosticoTecnico")) {
            ot.setDiagnosticoTecnico((String) datos.get("diagnosticoTecnico"));
        }
        if (datos.containsKey("informeFinal")) {
            ot.setInformeFinal((String) datos.get("informeFinal"));
        }
        if (datos.containsKey("horasTrabajadas") && datos.get("horasTrabajadas") != null) {
            ot.setHorasTrabajadas(((Number) datos.get("horasTrabajadas")).doubleValue());
        }
        if (datos.containsKey("costoManoObra") && datos.get("costoManoObra") != null) {
            ot.setCostoManoObra(new BigDecimal(datos.get("costoManoObra").toString()));
        }
        if (datos.containsKey("presupuestoFinal") && datos.get("presupuestoFinal") != null) {
            ot.setPresupuestoFinal(new BigDecimal(datos.get("presupuestoFinal").toString()));
        }
        if (datos.containsKey("observaciones")) {
            ot.setObservaciones((String) datos.get("observaciones"));
        }

        return otRepository.save(ot);
    }

    public void eliminar(Long id) {
        OrdenTrabajo ot = otRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Orden de trabajo no encontrada"));

        // Actualizar el pedido
        Pedido pedido = ot.getPedido();
        // Revertir el estado del pedido si es necesario
        if (pedido.getEstado() == EstadoPedido.OT_GENERADA ||
            pedido.getEstado() == EstadoPedido.OT_EN_PROCESO) {
            pedido.setEstado(EstadoPedido.PRESUPUESTO_ACEPTADO);
            pedidoRepository.save(pedido);
        }

        otRepository.delete(ot);
    }

    private String generarNumeroOT() {
        String fecha = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = otRepository.count() + 1;
        return String.format("OT-%s-%04d", fecha, count);
    }
}