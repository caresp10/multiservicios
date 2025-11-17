package com.empresa.multiservices.model.enums;

public enum EstadoOT {
    ABIERTA,              // Admin crea la OT
    ASIGNADA,             // Admin asigna técnico
    EN_PROCESO,           // Técnico inicia el trabajo
    ESPERANDO_REVISION,   // Técnico envía para revisión
    DEVUELTA_A_TECNICO,   // Admin devuelve al técnico con observaciones
    TERMINADA,            // Admin aprueba y cierra
    FACTURADA,            // Se generó la factura
    CANCELADA             // OT cancelada
}