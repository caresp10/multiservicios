-- =====================================================
-- FIX: Corregir todas las columnas ENUM en el esquema
-- =====================================================
-- Descripción: Convierte columnas VARCHAR a ENUM donde
--              Hibernate espera tipos ENUM nativos de MySQL
-- =====================================================

USE bd_multiservicios;

-- ============================================
-- 1. FIX: repuestos.unidad_medida
-- ============================================

-- Verificar si existe y es VARCHAR
SET @column_type = (
    SELECT DATA_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'repuestos'
    AND COLUMN_NAME = 'unidad_medida'
);

-- Si es VARCHAR, cambiar a ENUM
SET @sql = IF(@column_type = 'varchar',
    'ALTER TABLE repuestos
     MODIFY COLUMN unidad_medida ENUM(''SERVICIO'',''UNIDAD'',''HORA'',''METRO'',''METRO_CUADRADO'',''DIA'',''VISITA'',''KILO'',''LITRO'',''CAJA'',''ROLLO'',''PAR'') NULL',
    'SELECT ''unidad_medida en repuestos ya es ENUM o no existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. FIX: servicios_catalogo.unidad_medida
-- ============================================

-- Verificar si existe y es VARCHAR
SET @column_type = (
    SELECT DATA_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'servicios_catalogo'
    AND COLUMN_NAME = 'unidad_medida'
);

-- Si es VARCHAR, cambiar a ENUM
SET @sql = IF(@column_type = 'varchar',
    'ALTER TABLE servicios_catalogo
     MODIFY COLUMN unidad_medida ENUM(''SERVICIO'',''UNIDAD'',''HORA'',''METRO'',''METRO_CUADRADO'',''DIA'',''VISITA'',''KILO'',''LITRO'',''CAJA'',''ROLLO'',''PAR'') NOT NULL',
    'SELECT ''unidad_medida en servicios_catalogo ya es ENUM o no existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 3. FIX: movimientos_stock.motivo
-- ============================================

-- Verificar si existe la columna
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'movimientos_stock'
    AND COLUMN_NAME = 'motivo'
);

-- Verificar el tipo
SET @column_type = (
    SELECT DATA_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'movimientos_stock'
    AND COLUMN_NAME = 'motivo'
);

-- Si no existe, crearla como ENUM
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE movimientos_stock
     ADD COLUMN motivo ENUM(''COMPRA'',''VENTA'',''DEVOLUCION'',''AJUSTE_INVENTARIO'',''GARANTIA'',''PERDIDA'',''DANO'',''DONACION'',''TRANSFERENCIA'',''OTRO'') NOT NULL DEFAULT ''OTRO'' AFTER cantidad,
     ADD INDEX idx_motivo (motivo)',
    'SELECT ''Columna motivo ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Si existe pero es VARCHAR, cambiar a ENUM
SET @sql = IF(@column_exists > 0 AND @column_type = 'varchar',
    'ALTER TABLE movimientos_stock
     MODIFY COLUMN motivo ENUM(''COMPRA'',''VENTA'',''DEVOLUCION'',''AJUSTE_INVENTARIO'',''GARANTIA'',''PERDIDA'',''DANO'',''DONACION'',''TRANSFERENCIA'',''OTRO'') NOT NULL DEFAULT ''OTRO''',
    'SELECT ''motivo ya es ENUM o fue recién creada'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar índice si no existe
SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'movimientos_stock'
    AND INDEX_NAME = 'idx_motivo'
);

SET @sql = IF(@index_exists = 0,
    'ALTER TABLE movimientos_stock ADD INDEX idx_motivo (motivo)',
    'SELECT ''Índice idx_motivo ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 4. ADD: movimientos_stock.referencia (si no existe)
-- ============================================

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'movimientos_stock'
    AND COLUMN_NAME = 'referencia'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE movimientos_stock ADD COLUMN referencia VARCHAR(100) NULL AFTER motivo',
    'SELECT ''Columna referencia ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 5. Migrar datos existentes en movimientos_stock
-- ============================================

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

-- ============================================
-- Verificación final
-- ============================================

SELECT 'TODAS LAS COLUMNAS ENUM CORREGIDAS' AS status;

-- Verificar repuestos
SELECT
    'repuestos.unidad_medida' AS tabla_columna,
    DATA_TYPE AS tipo_actual,
    COLUMN_TYPE AS tipo_completo
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'repuestos'
AND COLUMN_NAME = 'unidad_medida';

-- Verificar servicios_catalogo
SELECT
    'servicios_catalogo.unidad_medida' AS tabla_columna,
    DATA_TYPE AS tipo_actual,
    COLUMN_TYPE AS tipo_completo
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'servicios_catalogo'
AND COLUMN_NAME = 'unidad_medida';

-- Verificar movimientos_stock
SELECT
    'movimientos_stock.motivo' AS tabla_columna,
    DATA_TYPE AS tipo_actual,
    COLUMN_TYPE AS tipo_completo
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'movimientos_stock'
AND COLUMN_NAME = 'motivo';

SELECT
    'movimientos_stock.referencia' AS tabla_columna,
    DATA_TYPE AS tipo_actual,
    COLUMN_TYPE AS tipo_completo
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'movimientos_stock'
AND COLUMN_NAME = 'referencia';
