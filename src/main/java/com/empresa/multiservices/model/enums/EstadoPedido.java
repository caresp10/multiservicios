package com.empresa.multiservices.model.enums;

public enum EstadoPedido {
    NUEVO,        // Al registrar el pedido
    EN_PROCESO,   // Cuando el presupuesto es aceptado (durante OT)
    COMPLETADO,   // Cuando la OT se termina y se factura
    CANCELADO     // Cuando el presupuesto es rechazado o se cancela
}