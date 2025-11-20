-- =====================================================
-- MIGRATION: Agregar columnas faltantes a movimientos_stock
-- =====================================================
-- Descripción: Agrega las columnas motivo y referencia que faltan
--              en la tabla movimientos_stock para que coincida con
--              la entidad MovimientoStock.java
-- =====================================================

USE bd_multiservicios;

-- Verificar y agregar columna motivo
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'movimientos_stock'
    AND COLUMN_NAME = 'motivo'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE movimientos_stock
     ADD COLUMN motivo ENUM(''COMPRA'',''VENTA'',''DEVOLUCION'',''AJUSTE_INVENTARIO'',''GARANTIA'',''PERDIDA'',''DANO'',''DONACION'',''TRANSFERENCIA'',''OTRO'') NOT NULL DEFAULT ''OTRO'' AFTER cantidad,
     ADD INDEX idx_motivo (motivo)',
    'SELECT ''La columna motivo ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar columna referencia
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'movimientos_stock'
    AND COLUMN_NAME = 'referencia'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE movimientos_stock
     ADD COLUMN referencia VARCHAR(100) NULL AFTER motivo',
    'SELECT ''La columna referencia ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Actualizar tipo_movimiento ENUM si es necesario
-- La tabla original tiene ENUM('ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION')
-- La entidad solo usa ENUM('ENTRADA', 'SALIDA')
-- Esto es compatible, no requiere cambios por ahora

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
    'Columnas agregadas exitosamente' AS resultado,
    COUNT(*) AS total_movimientos,
    COUNT(DISTINCT motivo) AS motivos_diferentes,
    COUNT(CASE WHEN referencia IS NOT NULL THEN 1 END) AS con_referencia
FROM movimientos_stock;

-- Mostrar estructura actualizada
DESCRIBE movimientos_stock;
