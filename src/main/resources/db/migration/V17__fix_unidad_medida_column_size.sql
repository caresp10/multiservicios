-- Fix unidad_medida column size to accommodate all enum values
-- The enum value METRO_CUADRADO has 15 characters, so we need at least VARCHAR(20)

ALTER TABLE servicios_catalogo
MODIFY COLUMN unidad_medida VARCHAR(20) NOT NULL;
