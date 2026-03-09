package com.empresa.multiservices.controller;

import com.empresa.multiservices.dto.response.ApiResponse;
import com.empresa.multiservices.model.NotaCredito;
import com.empresa.multiservices.model.enums.EstadoNotaCredito;
import com.empresa.multiservices.service.NotaCreditoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notas-credito")
@CrossOrigin(origins = "*")
public class NotaCreditoController {

    @Autowired
    private NotaCreditoService notaCreditoService;

    /**
     * Crear una nueva Nota de Crédito
     */
    @PostMapping
    public ResponseEntity<ApiResponse> crear(@RequestBody NotaCredito notaCredito) {
        try {
            NotaCredito ncCreada = notaCreditoService.crear(notaCredito);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Nota de crédito creada exitosamente", ncCreada));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al crear la nota de crédito: " + e.getMessage()));
        }
    }

    /**
     * Listar todas las Notas de Crédito
     */
    @GetMapping
    public ResponseEntity<ApiResponse> listarTodas() {
        try {
            List<NotaCredito> notasCredito = notaCreditoService.listarTodas();
            return ResponseEntity.ok(ApiResponse.success("Notas de crédito obtenidas", notasCredito));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener las notas de crédito: " + e.getMessage()));
        }
    }

    /**
     * Obtener una Nota de Crédito por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> obtenerPorId(@PathVariable Long id) {
        try {
            NotaCredito nc = notaCreditoService.obtenerPorId(id);
            return ResponseEntity.ok(ApiResponse.success("Nota de crédito obtenida", nc));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Obtener una Nota de Crédito por número
     */
    @GetMapping("/numero/{numeroNC}")
    public ResponseEntity<ApiResponse> obtenerPorNumero(@PathVariable String numeroNC) {
        try {
            NotaCredito nc = notaCreditoService.obtenerPorNumero(numeroNC);
            return ResponseEntity.ok(ApiResponse.success("Nota de crédito obtenida", nc));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Listar Notas de Crédito por Factura
     */
    @GetMapping("/factura/{idFactura}")
    public ResponseEntity<ApiResponse> listarPorFactura(@PathVariable Long idFactura) {
        try {
            List<NotaCredito> notasCredito = notaCreditoService.listarPorFactura(idFactura);
            return ResponseEntity.ok(ApiResponse.success("Notas de crédito de la factura obtenidas", notasCredito));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener las notas de crédito: " + e.getMessage()));
        }
    }

    /**
     * Listar Notas de Crédito por Estado
     */
    @GetMapping("/estado/{estado}")
    public ResponseEntity<ApiResponse> listarPorEstado(@PathVariable String estado) {
        try {
            EstadoNotaCredito estadoEnum = EstadoNotaCredito.valueOf(estado.toUpperCase());
            List<NotaCredito> notasCredito = notaCreditoService.listarPorEstado(estadoEnum);
            return ResponseEntity.ok(ApiResponse.success("Notas de crédito obtenidas", notasCredito));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Estado no válido: " + estado));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener las notas de crédito: " + e.getMessage()));
        }
    }

    /**
     * Aplicar una Nota de Crédito (cambiar estado a APLICADA)
     */
    @PatchMapping("/{id}/aplicar")
    public ResponseEntity<ApiResponse> aplicar(@PathVariable Long id) {
        try {
            NotaCredito nc = notaCreditoService.aplicar(id);
            return ResponseEntity.ok(ApiResponse.success("Nota de crédito aplicada exitosamente", nc));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al aplicar la nota de crédito: " + e.getMessage()));
        }
    }

    /**
     * Anular una Nota de Crédito
     */
    @PatchMapping("/{id}/anular")
    public ResponseEntity<ApiResponse> anular(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            String motivo = body.getOrDefault("motivo", "Sin motivo especificado");
            NotaCredito nc = notaCreditoService.anular(id, motivo);
            return ResponseEntity.ok(ApiResponse.success("Nota de crédito anulada exitosamente", nc));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al anular la nota de crédito: " + e.getMessage()));
        }
    }

    /**
     * Generar número de Nota de Crédito (útil para previsualización en frontend)
     */
    @GetMapping("/generar-numero")
    public ResponseEntity<ApiResponse> generarNumero() {
        try {
            String numeroNC = notaCreditoService.generarNumeroNC();
            return ResponseEntity.ok(ApiResponse.success("Número generado", numeroNC));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al generar número: " + e.getMessage()));
        }
    }
}
