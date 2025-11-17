-- Eliminar columna estado de la tabla compras
-- Las compras ahora se completan automáticamente al crearse

ALTER TABLE compras DROP COLUMN estado;
