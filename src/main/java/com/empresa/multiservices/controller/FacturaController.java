package com.empresa.multiservices.controller;

import com.empresa.multiservices.dto.response.ApiResponse;
import com.empresa.multiservices.model.Factura;
import com.empresa.multiservices.model.enums.EstadoFactura;
import com.empresa.multiservices.service.FacturaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/facturas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FacturaController {

    private final FacturaService facturaService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'RECEPCIONISTA')")
    public ResponseEntity<ApiResponse> listarTodas() {
        try {
            List<Factura> facturas = facturaService.listarTodas();
            return ResponseEntity.ok(ApiResponse.success("Facturas obtenidas exitosamente", facturas));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener facturas: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'RECEPCIONISTA')")
    public ResponseEntity<ApiResponse> obtenerPorId(@PathVariable Long id) {
        try {
            Factura factura = facturaService.obtenerPorId(id);
            // Forzar la carga de los items (evitar lazy loading en la serialización)
            factura.getItems().size();
            return ResponseEntity.ok(ApiResponse.success("Factura encontrada", factura));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener factura: " + e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'RECEPCIONISTA')")
    public ResponseEntity<ApiResponse> crear(@RequestBody Factura factura) {
        try {
            Factura nuevaFactura = facturaService.crear(factura);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Factura creada exitosamente", nuevaFactura));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al crear factura: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'RECEPCIONISTA')")
    public ResponseEntity<ApiResponse> actualizar(@PathVariable Long id, @RequestBody Factura factura) {
        try {
            Factura facturaActualizada = facturaService.actualizar(id, factura);
            return ResponseEntity.ok(ApiResponse.success("Factura actualizada exitosamente", facturaActualizada));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al actualizar factura: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> eliminar(@PathVariable Long id) {
        // Las facturas no se pueden eliminar por regla de negocio
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Las facturas no se pueden eliminar. Use la opción de anular factura."));
    }

    @PatchMapping("/{id}/anular")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO')")
    public ResponseEntity<ApiResponse> anular(@PathVariable Long id) {
        try {
            Factura factura = facturaService.anular(id);
            return ResponseEntity.ok(ApiResponse.success("Factura anulada exitosamente. Se ha devuelto el stock de repuestos.", factura));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al anular factura: " + e.getMessage()));
        }
    }

    @GetMapping("/estado/{estado}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'RECEPCIONISTA')")
    public ResponseEntity<ApiResponse> listarPorEstado(@PathVariable EstadoFactura estado) {
        try {
            List<Factura> facturas = facturaService.listarPorEstado(estado);
            return ResponseEntity.ok(ApiResponse.success("Facturas obtenidas exitosamente", facturas));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener facturas: " + e.getMessage()));
        }
    }

    @GetMapping("/cliente/{idCliente}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'RECEPCIONISTA')")
    public ResponseEntity<ApiResponse> listarPorCliente(@PathVariable Long idCliente) {
        try {
            List<Factura> facturas = facturaService.listarPorCliente(idCliente);
            return ResponseEntity.ok(ApiResponse.success("Facturas obtenidas exitosamente", facturas));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener facturas: " + e.getMessage()));
        }
    }

    @GetMapping("/datos-facturacion/ot/{idOt}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DUENO', 'RECEPCIONISTA')")
    public ResponseEntity<ApiResponse> obtenerDatosParaFacturar(@PathVariable Long idOt) {
        try {
            var datos = facturaService.obtenerDatosParaFacturar(idOt);
            return ResponseEntity.ok(ApiResponse.success("Datos obtenidos exitosamente", datos));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener datos: " + e.getMessage()));
        }
    }
}
