package com.empresa.multiservices.service;

import com.empresa.multiservices.exception.ResourceNotFoundException;
import com.empresa.multiservices.model.HistoricoPreciosServicio;
import com.empresa.multiservices.model.ServicioCatalogo;
import com.empresa.multiservices.model.Usuario;
import com.empresa.multiservices.repository.HistoricoPreciosServicioRepository;
import com.empresa.multiservices.repository.ServicioCatalogoRepository;
import com.empresa.multiservices.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ServicioCatalogoService {

    @Autowired
    private ServicioCatalogoRepository servicioCatalogoRepository;

    @Autowired
    private HistoricoPreciosServicioRepository historicoPreciosRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    public ServicioCatalogo crear(ServicioCatalogo servicio) {
        // Validar que el código no exista
        if (servicioCatalogoRepository.existsByCodigo(servicio.getCodigo())) {
            throw new IllegalArgumentException("Ya existe un servicio con el código: " + servicio.getCodigo());
        }

        return servicioCatalogoRepository.save(servicio);
    }

    public ServicioCatalogo actualizar(Long id, ServicioCatalogo servicioActualizado) {
        ServicioCatalogo servicio = servicioCatalogoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado"));

        // Validar código único si cambió
        if (!servicio.getCodigo().equals(servicioActualizado.getCodigo())) {
            if (servicioCatalogoRepository.existsByCodigoAndIdServicioNot(
                    servicioActualizado.getCodigo(), id)) {
                throw new IllegalArgumentException("Ya existe un servicio con el código: " + servicioActualizado.getCodigo());
            }
            servicio.setCodigo(servicioActualizado.getCodigo());
        }

        // Verificar cambio de precio y registrar en histórico
        BigDecimal precioAnterior = servicio.getPrecioBase();
        BigDecimal precioNuevo = servicioActualizado.getPrecioBase();

        if (precioAnterior.compareTo(precioNuevo) != 0) {
            registrarCambioPrecio(servicio, precioAnterior, precioNuevo, "Actualización de precio");
        }

        // Actualizar campos
        servicio.setNombre(servicioActualizado.getNombre());
        servicio.setDescripcion(servicioActualizado.getDescripcion());
        servicio.setCategoria(servicioActualizado.getCategoria());
        servicio.setPrecioBase(precioNuevo);
        servicio.setUnidadMedida(servicioActualizado.getUnidadMedida());
        servicio.setTiempoEstimadoHoras(servicioActualizado.getTiempoEstimadoHoras());
        servicio.setIncluyeMateriales(servicioActualizado.getIncluyeMateriales());
        servicio.setNotasAdicionales(servicioActualizado.getNotasAdicionales());
        servicio.setActivo(servicioActualizado.getActivo());

        return servicioCatalogoRepository.save(servicio);
    }

    @Transactional(readOnly = true)
    public ServicioCatalogo obtenerPorId(Long id) {
        return servicioCatalogoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado"));
    }

    @Transactional(readOnly = true)
    public List<ServicioCatalogo> listarTodos() {
        return servicioCatalogoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<ServicioCatalogo> listarActivos() {
        return servicioCatalogoRepository.findByActivoTrue();
    }

    @Transactional(readOnly = true)
    public List<ServicioCatalogo> listarPorCategoria(Long idCategoria) {
        return servicioCatalogoRepository.findByCategoriaIdCategoria(idCategoria);
    }

    public void eliminar(Long id) {
        ServicioCatalogo servicio = obtenerPorId(id);
        servicio.setActivo(false);
        servicioCatalogoRepository.save(servicio);
    }

    @Transactional(readOnly = true)
    public List<HistoricoPreciosServicio> obtenerHistoricoPrecios(Long idServicio) {
        return historicoPreciosRepository.findByServicioIdServicioOrderByFechaCambioDesc(idServicio);
    }

    private void registrarCambioPrecio(ServicioCatalogo servicio, BigDecimal precioAnterior,
                                       BigDecimal precioNuevo, String motivo) {
        Usuario usuarioActual = obtenerUsuarioActual();

        HistoricoPreciosServicio historico = new HistoricoPreciosServicio();
        historico.setServicio(servicio);
        historico.setPrecioAnterior(precioAnterior);
        historico.setPrecioNuevo(precioNuevo);
        historico.setFechaCambio(LocalDateTime.now());
        historico.setUsuario(usuarioActual);
        historico.setMotivo(motivo);

        historicoPreciosRepository.save(historico);
    }

    private Usuario obtenerUsuarioActual() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                String username = authentication.getName();
                return usuarioRepository.findByUsername(username).orElse(null);
            }
        } catch (Exception e) {
            // Si hay error obteniendo el usuario, continuar sin usuario
        }
        return null;
    }
}
