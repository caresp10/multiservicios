-- Agregar campos de establecimiento y punto de expedición a timbrados
ALTER TABLE timbrados
ADD COLUMN establecimiento VARCHAR(3) NOT NULL DEFAULT '001' AFTER numero,
ADD COLUMN punto_expedicion VARCHAR(3) NOT NULL DEFAULT '001' AFTER establecimiento;

-- Crear índice único compuesto para evitar duplicados de numero + establecimiento + punto
-- Primero remover el índice único de solo numero
ALTER TABLE timbrados DROP INDEX numero;

-- Crear nuevo índice único compuesto
ALTER TABLE timbrados
ADD UNIQUE KEY uk_timbrado_completo (numero, establecimiento, punto_expedicion);

-- Agregar índice para consultas por establecimiento y punto
ALTER TABLE timbrados
ADD INDEX idx_establecimiento_punto (establecimiento, punto_expedicion);
