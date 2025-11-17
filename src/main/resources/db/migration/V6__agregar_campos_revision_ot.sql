-- Migración para agregar campos de revisión a órdenes de trabajo

-- Agregar nuevos estados al enum (en MySQL, necesitamos usar ALTER TABLE con MODIFY COLUMN)
-- Primero, verificamos la estructura actual y la modificamos

ALTER TABLE ordenes_trabajo
MODIFY COLUMN estado ENUM(
    'ABIERTA',
    'ASIGNADA',
    'EN_PROCESO',
    'ESPERANDO_REVISION',
    'DEVUELTA_A_TECNICO',
    'TERMINADA',
    'FACTURADA',
    'CANCELADA'
) NOT NULL DEFAULT 'ABIERTA';

-- Agregar nuevos campos para la revisión administrativa
ALTER TABLE ordenes_trabajo
ADD COLUMN observaciones_devolucion TEXT COMMENT 'Observaciones cuando admin devuelve OT al técnico' AFTER observaciones;

ALTER TABLE ordenes_trabajo
ADD COLUMN justificacion_ajuste TEXT COMMENT 'Justificación si admin ajusta el presupuesto final' AFTER observaciones_devolucion;

-- Comentarios para documentar los campos existentes relacionados
ALTER TABLE ordenes_trabajo
MODIFY COLUMN diagnostico_tecnico TEXT COMMENT 'Diagnóstico realizado por el técnico';

ALTER TABLE ordenes_trabajo
MODIFY COLUMN informe_final TEXT COMMENT 'Informe final del trabajo realizado por el técnico';

ALTER TABLE ordenes_trabajo
MODIFY COLUMN horas_trabajadas DOUBLE COMMENT 'Horas trabajadas por el técnico';

ALTER TABLE ordenes_trabajo
MODIFY COLUMN costo_mano_obra DECIMAL(12,2) COMMENT 'Costo de mano de obra calculado';

ALTER TABLE ordenes_trabajo
MODIFY COLUMN presupuesto_final DECIMAL(12,2) COMMENT 'Presupuesto final ajustado por admin';
