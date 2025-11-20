-- Migrar estados antiguos de pedidos a los nuevos estados simplificados

-- FACTURADO -> COMPLETADO
UPDATE pedidos SET estado = 'COMPLETADO' WHERE estado = 'FACTURADO';

-- OT_TERMINADA -> COMPLETADO (ya se facturó o está listo)
UPDATE pedidos SET estado = 'COMPLETADO' WHERE estado = 'OT_TERMINADA';

-- OT_GENERADA, OT_EN_PROCESO, PRESUPUESTO_ACEPTADO -> EN_PROCESO
UPDATE pedidos SET estado = 'EN_PROCESO' WHERE estado IN ('OT_GENERADA', 'OT_EN_PROCESO', 'PRESUPUESTO_ACEPTADO');

-- PRESUPUESTO_GENERADO -> NUEVO (aún no aceptado)
UPDATE pedidos SET estado = 'NUEVO' WHERE estado = 'PRESUPUESTO_GENERADO';

-- PRESUPUESTO_RECHAZADO -> CANCELADO
UPDATE pedidos SET estado = 'CANCELADO' WHERE estado = 'PRESUPUESTO_RECHAZADO';
