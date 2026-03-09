package com.empresa.multiservices.service;

import com.empresa.multiservices.exception.ResourceNotFoundException;
import com.empresa.multiservices.model.CategoriaServicio;
import com.empresa.multiservices.model.HistoricoPreciosServicio;
import com.empresa.multiservices.model.ServicioCatalogo;
import com.empresa.multiservices.model.Usuario;
import com.empresa.multiservices.repository.CategoriaServicioRepository;
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

    @Autowired
    private CategoriaServicioRepository categoriaServicioRepository;

    public ServicioCatalogo crear(ServicioCatalogo servicio) {
        // Generar código automáticamente si no se proporcionó o si está vacío
        if (servicio.getCodigo() == null || servicio.getCodigo().trim().isEmpty()) {
            if (servicio.getCategoria() == null || servicio.getCategoria().getIdCategoria() == null) {
                throw new IllegalArgumentException("Debe especificar una categoría para generar el código automáticamente");
            }
            servicio.setCodigo(generarCodigoPorCategoria(servicio.getCategoria().getIdCategoria()));
        } else {
            // Validar que el código no exista
            if (servicioCatalogoRepository.existsByCodigo(servicio.getCodigo())) {
                throw new IllegalArgumentException("Ya existe un servicio con el código: " + servicio.getCodigo());
            }
        }

        return servicioCatalogoRepository.save(servicio);
    }

    /**
     * Genera un código automático para un servicio basado en su categoría
     * Formato: PREFIJO-NNN (ej: ELEC-001, MECAN-015)
     */
    public String generarCodigoPorCategoria(Long idCategoria) {
        // Obtener la categoría desde la base de datos
        CategoriaServicio categoria = categoriaServicioRepository.findById(idCategoria)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con ID: " + idCategoria));

        // Obtener el prefijo de la categoría (si no tiene, usar "SRV" por defecto)
        String prefijo = (categoria.getPrefijo() != null && !categoria.getPrefijo().trim().isEmpty())
                ? categoria.getPrefijo().trim()
                : "SRV";

        // Obtener todos los servicios de esta categoría
        List<ServicioCatalogo> serviciosCategoria = servicioCatalogoRepository.findByCategoriaIdCategoria(idCategoria);

        // Buscar el siguiente número disponible para este prefijo específico
        int maxNumero = 0;
        for (ServicioCatalogo s : serviciosCategoria) {
            if (s.getCodigo() != null && s.getCodigo().startsWith(prefijo + "-")) {
                try {
                    String numeroStr = s.getCodigo().substring(prefijo.length() + 1);
                    int numero = Integer.parseInt(numeroStr);
                    if (numero > maxNumero) {
                        maxNumero = numero;
                    }
                } catch (NumberFormatException | StringIndexOutOfBoundsException e) {
                    // Ignorar códigos con formato no estándar
                }
            }
        }

        int siguienteNumero = maxNumero + 1;
        return String.format("%s-%03d", prefijo, siguienteNumero);
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
