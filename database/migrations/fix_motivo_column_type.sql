-- =====================================================
-- FIX: Corregir tipo de columna motivo en movimientos_stock
-- =====================================================
-- Descripción: Si la columna motivo fue creada como VARCHAR,
--              la elimina y la recrea como ENUM
-- =====================================================

USE bd_multiservicios;

-- Verificar si la columna existe
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'movimientos_stock'
    AND COLUMN_NAME = 'motivo'
);

-- Si existe, eliminarla
SET @sql = IF(@column_exists > 0,
    'ALTER TABLE movimientos_stock DROP COLUMN motivo',
    'SELECT ''La columna motivo no existe, nada que eliminar'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ahora crear la columna con el tipo correcto (ENUM)
ALTER TABLE movimientos_stock
ADD COLUMN motivo ENUM('COMPRA','VENTA','DEVOLUCION','AJUSTE_INVENTARIO','GARANTIA','PERDIDA','DANO','DONACION','TRANSFERENCIA','OTRO')
NOT NULL DEFAULT 'OTRO' AFTER cantidad;

-- Agregar índice
ALTER TABLE movimientos_stock
ADD INDEX idx_motivo (motivo);

-- Verificar si la columna referencia existe
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'movimientos_stock'
    AND COLUMN_NAME = 'referencia'
);

-- Agregar columna referencia si no existe
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE movimientos_stock ADD COLUMN referencia VARCHAR(100) NULL AFTER motivo',
    'SELECT ''La columna referencia ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrar datos existentes si los hay
-- Convertir valores antiguos de tipo_movimiento a motivo apropiado
UPDATE movimientos_stock
SET motivo = CASE
    WHEN tipo_movimiento = 'ENTRADA' AND id_compra IS NOT NULL THEN 'COMPRA'
    WHEN tipo_movimiento = 'SALIDA' AND id_factura IS NOT NULL THEN 'VENTA'
    WHEN tipo_movimiento = 'DEVOLUCION' THEN 'DEVOLUCION'
    WHEN tipo_movimiento = 'AJUSTE' THEN 'AJUSTE_INVENTARIO'
    ELSE 'OTRO'
END
WHERE motivo = 'OTRO';

-- Actualizar referencia basado en facturas o compras existentes
UPDATE movimientos_stock m
LEFT JOIN facturas f ON m.id_factura = f.id_factura
SET m.referencia = CONCAT('FACT-', f.numero_factura)
WHERE m.id_factura IS NOT NULL AND m.referencia IS NULL;

UPDATE movimientos_stock m
LEFT JOIN compras c ON m.id_compra = c.id_compra
SET m.referencia = CONCAT('COMPRA-', c.id_compra)
WHERE m.id_compra IS NOT NULL AND m.referencia IS NULL;

-- Verificación final
SELECT
    'Columna motivo corregida exitosamente a tipo ENUM' AS resultado,
    COUNT(*) AS total_movimientos,
    COUNT(DISTINCT motivo) AS motivos_diferentes,
    COUNT(CASE WHEN referencia IS NOT NULL THEN 1 END) AS con_referencia
FROM movimientos_stock;

-- Mostrar estructura actualizada
DESCRIBE movimientos_stock;
