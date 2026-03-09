package com.empresa.multiservices.model.enums;

public enum EstadoNotaCredito {
    PENDIENTE,   // Creada pero no aplicada aún
    APLICADA,    // Ya aplicada a la factura
    ANULADA      // Anulada (no se aplicará)
}
