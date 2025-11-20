package com.empresa.multiservices.service;

import com.empresa.multiservices.exception.ResourceNotFoundException;
import com.empresa.multiservices.model.Repuesto;
import com.empresa.multiservices.repository.RepuestoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class RepuestoService {

    @Autowired
    private RepuestoRepository repuestoRepository;

    public Repuesto crear(Repuesto repuesto) {
        // Generar código automáticamente si no se proporcionó o si está vacío
        if (repuesto.getCodigo() == null || repuesto.getCodigo().trim().isEmpty()) {
            repuesto.setCodigo(generarCodigoAutomatico());
        } else {
            // Validar que el código no exista
            if (repuestoRepository.existsByCodigo(repuesto.getCodigo())) {
                throw new IllegalArgumentException("Ya existe un repuesto con el código: " + repuesto.getCodigo());
            }
        }

        repuesto.setActivo(true);
        if (repuesto.getStockActual() == null) {
            repuesto.setStockActual(0);
        }
        return repuestoRepository.save(repuesto);
    }

    /**
     * Genera un código automático para un repuesto basado en su categoría
     * Formato: PREFIJO-NNN (ej: ELEC-001, MECAN-015)
     */
    public String generarCodigoPorCategoria(Long idCategoria) {
        // Obtener todos los repuestos de esta categoría
        List<Repuesto> repuestosCategoria = repuestoRepository.findByCategoriaIdCategoria(idCategoria);

        // Obtener el prefijo de la categoría
        Repuesto primerRepuesto = repuestosCategoria.isEmpty() ? null : repuestosCategoria.get(0);
        String prefijo = (primerRepuesto != null && primerRepuesto.getCategoria() != null && primerRepuesto.getCategoria().getPrefijo() != null)
                ? primerRepuesto.getCategoria().getPrefijo()
                : "REP";

        // Buscar el siguiente número disponible
        int maxNumero = 0;
        for (Repuesto r : repuestosCategoria) {
            if (r.getCodigo() != null && r.getCodigo().startsWith(prefijo + "-")) {
                try {
                    String numeroStr = r.getCodigo().substring(prefijo.length() + 1);
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

    /**
     * Genera un código automático para un repuesto sin categoría
     * Formato: REP-NNN (ej: REP-001, REP-015)
     */
    public String generarCodigoAutomatico() {
        String prefijo = "REP";

        // Obtener todos los repuestos
        List<Repuesto> todosRepuestos = repuestoRepository.findAll();

        // Buscar el siguiente número disponible
        int maxNumero = 0;
        for (Repuesto r : todosRepuestos) {
            if (r.getCodigo() != null && r.getCodigo().startsWith(prefijo + "-")) {
                try {
                    String numeroStr = r.getCodigo().substring(prefijo.length() + 1);
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

    public Repuesto actualizar(Long id, Repuesto repuestoActualizado) {
        Repuesto repuesto = repuestoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Repuesto no encontrado"));

        // Validar código único si se está modificando
        if (!repuestoActualizado.getCodigo().equals(repuesto.getCodigo())) {
            if (repuestoRepository.existsByCodigoAndIdRepuestoNot(repuestoActualizado.getCodigo(), id)) {
                throw new IllegalArgumentException("Ya existe un repuesto con el código: " + repuestoActualizado.getCodigo());
            }
        }

        repuesto.setCodigo(repuestoActualizado.getCodigo());
        repuesto.setNombre(repuestoActualizado.getNombre());
        repuesto.setDescripcion(repuestoActualizado.getDescripcion());
        repuesto.setMarca(repuestoActualizado.getMarca());
        repuesto.setModelo(repuestoActualizado.getModelo());
        repuesto.setCategoria(repuestoActualizado.getCategoria());
        repuesto.setUnidadMedida(repuestoActualizado.getUnidadMedida());
        repuesto.setPrecioCosto(repuestoActualizado.getPrecioCosto());
        repuesto.setPrecioVenta(repuestoActualizado.getPrecioVenta());
        repuesto.setStockMinimo(repuestoActualizado.getStockMinimo());
        repuesto.setStockMaximo(repuestoActualizado.getStockMaximo());
        repuesto.setPuntoReorden(repuestoActualizado.getPuntoReorden());
        repuesto.setUbicacion(repuestoActualizado.getUbicacion());
        repuesto.setProveedor(repuestoActualizado.getProveedor());
        repuesto.setTelefonoProveedor(repuestoActualizado.getTelefonoProveedor());
        repuesto.setActivo(repuestoActualizado.getActivo());

        return repuestoRepository.save(repuesto);
    }

    @Transactional(readOnly = true)
    public List<Repuesto> listarTodos() {
        return repuestoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Repuesto> listarActivos() {
        return repuestoRepository.findByActivoTrue();
    }

    @Transactional(readOnly = true)
    public Repuesto obtenerPorId(Long id) {
        return repuestoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Repuesto no encontrado"));
    }

    @Transactional(readOnly = true)
    public Repuesto obtenerPorCodigo(String codigo) {
        return repuestoRepository.findByCodigo(codigo)
                .orElseThrow(() -> new ResourceNotFoundException("Repuesto no encontrado con código: " + codigo));
    }

    @Transactional(readOnly = true)
    public List<Repuesto> buscar(String termino) {
        return repuestoRepository.findByNombreContainingIgnoreCaseOrCodigoContainingIgnoreCase(termino, termino);
    }

    @Transactional(readOnly = true)
    public List<Repuesto> listarPorCategoria(Long idCategoria) {
        return repuestoRepository.findByCategoriaIdCategoria(idCategoria);
    }

    @Transactional(readOnly = true)
    public List<Repuesto> listarConStockBajo() {
        return repuestoRepository.findRepuestosConStockBajo();
    }

    @Transactional(readOnly = true)
    public List<Repuesto> listarSinStock() {
        return repuestoRepository.findRepuestosSinStock();
    }

    // Control de stock
    public void incrementarStock(Long id, Integer cantidad) {
        Repuesto repuesto = obtenerPorId(id);
        repuesto.incrementarStock(cantidad);
        repuestoRepository.save(repuesto);
    }

    public void decrementarStock(Long id, Integer cantidad) {
        Repuesto repuesto = obtenerPorId(id);
        if (!repuesto.tieneStockDisponible(cantidad)) {
            throw new IllegalArgumentException(
                "Stock insuficiente. Stock actual: " + repuesto.getStockActual() +
                ", Solicitado: " + cantidad
            );
        }
        repuesto.decrementarStock(cantidad);
        repuestoRepository.save(repuesto);
    }

    public void ajustarStock(Long id, Integer nuevoStock) {
        Repuesto repuesto = obtenerPorId(id);
        repuesto.setStockActual(nuevoStock);
        repuestoRepository.save(repuesto);
    }

    @Transactional(readOnly = true)
    public boolean verificarStockDisponible(Long id, Integer cantidad) {
        return repuestoRepository.tieneStockDisponible(id, cantidad);
    }

    public void eliminar(Long id) {
        Repuesto repuesto = obtenerPorId(id);
        repuesto.setActivo(false);
        repuestoRepository.save(repuesto);
    }

    public void activar(Long id) {
        Repuesto repuesto = obtenerPorId(id);
        repuesto.setActivo(true);
        repuestoRepository.save(repuesto);
    }
}
