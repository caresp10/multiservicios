package com.empresa.multiservices.service;

import com.empresa.multiservices.dto.request.TecnicoRequest;
import com.empresa.multiservices.exception.ResourceNotFoundException;
import com.empresa.multiservices.model.Tecnico;
import com.empresa.multiservices.model.Usuario;
import com.empresa.multiservices.repository.TecnicoRepository;
import com.empresa.multiservices.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TecnicoService {

    @Autowired
    private TecnicoRepository tecnicoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    public Tecnico crear(TecnicoRequest request) {
        Tecnico.TecnicoBuilder builder = Tecnico.builder()
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .ci(request.getCi())
                .telefono(request.getTelefono())
                .celular(request.getCelular())
                .email(request.getEmail())
                .direccion(request.getDireccion())
                .especialidad(request.getEspecialidad())
                .nivelExperiencia(request.getNivelExperiencia())
                .observaciones(request.getObservaciones())
                .activo(true);

        // Asociar usuario si se proporcionó
        if (request.getIdUsuario() != null) {
            Usuario usuario = usuarioRepository.findById(request.getIdUsuario())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
            builder.usuario(usuario);
        }

        Tecnico tecnico = builder.build();
        return tecnicoRepository.save(tecnico);
    }

    public Tecnico actualizar(Long id, TecnicoRequest request) {
        Tecnico tecnico = tecnicoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Técnico no encontrado"));

        tecnico.setNombre(request.getNombre());
        tecnico.setApellido(request.getApellido());
        tecnico.setCi(request.getCi());
        tecnico.setTelefono(request.getTelefono());
        tecnico.setCelular(request.getCelular());
        tecnico.setEmail(request.getEmail());
        tecnico.setDireccion(request.getDireccion());
        tecnico.setEspecialidad(request.getEspecialidad());
        tecnico.setNivelExperiencia(request.getNivelExperiencia());
        tecnico.setObservaciones(request.getObservaciones());

        if (request.getActivo() != null) {
            tecnico.setActivo(request.getActivo());
        }

        // Actualizar usuario asociado si se proporcionó
        if (request.getIdUsuario() != null) {
            Usuario usuario = usuarioRepository.findById(request.getIdUsuario())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
            tecnico.setUsuario(usuario);
        }

        return tecnicoRepository.save(tecnico);
    }

    @Transactional(readOnly = true)
    public Tecnico obtenerPorId(Long id) {
        return tecnicoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Técnico no encontrado"));
    }

    @Transactional(readOnly = true)
    public List<Tecnico> listar() {
        return tecnicoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Tecnico> listarActivos() {
        return tecnicoRepository.findByActivoTrue();
    }

    @Transactional(readOnly = true)
    public Tecnico obtenerPorIdUsuario(Long idUsuario) {
        System.out.println("=== DEBUG: Buscando técnico para idUsuario: " + idUsuario);
        Optional<Tecnico> tecnicoOpt = tecnicoRepository.findByUsuario_IdUsuario(idUsuario);
        System.out.println("=== DEBUG: Técnico encontrado: " + tecnicoOpt.isPresent());
        if (tecnicoOpt.isPresent()) {
            System.out.println("=== DEBUG: ID Técnico: " + tecnicoOpt.get().getIdTecnico());
            System.out.println("=== DEBUG: Nombre Técnico: " + tecnicoOpt.get().getNombre() + " " + tecnicoOpt.get().getApellido());
        }
        return tecnicoOpt.orElseThrow(() -> new ResourceNotFoundException("No se encontró técnico asociado a este usuario"));
    }

    public void eliminar(Long id) {
        Tecnico tecnico = obtenerPorId(id);
        tecnico.setActivo(false);
        tecnicoRepository.save(tecnico);
    }

    @Transactional(readOnly = true)
    public List<Tecnico> listarPorCategoria(Long idCategoria) {
        return tecnicoRepository.findByActivoTrueAndCategoria_IdCategoria(idCategoria);
    }
}
