-- =====================================================
-- DIAGNÓSTICO Y FIX TABLA REPUESTOS
-- =====================================================

-- 1. Ver la estructura actual de la tabla repuestos
SELECT 'ESTRUCTURA ACTUAL DE LA TABLA REPUESTOS:' AS info;
DESCRIBE repuestos;

-- 2. Listar todas las columnas de repuestos
SELECT 'COLUMNAS EN REPUESTOS:' AS info;
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'repuestos'
ORDER BY ORDINAL_POSITION;

-- 3. Verificar si existe la columna margen_ganancia
SELECT 'VERIFICANDO COLUMNA margen_ganancia:' AS info;
SELECT
    CASE
        WHEN COUNT(*) > 0 THEN 'La columna margen_ganancia EXISTE'
        ELSE 'La columna margen_ganancia NO EXISTE - necesita ser creada'
    END AS estado
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'repuestos'
AND COLUMN_NAME = 'margen_ganancia';

-- =====================================================
-- FIX: Agregar columna margen_ganancia si no existe
-- =====================================================

-- Preparar el statement para agregar la columna
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'repuestos'
    AND COLUMN_NAME = 'margen_ganancia'
);

-- Si NO existe, la creamos
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE repuestos ADD COLUMN margen_ganancia DECIMAL(5,2) GENERATED ALWAYS AS (CASE WHEN precio_costo > 0 THEN ((precio_venta - precio_costo) / precio_costo * 100) ELSE 0 END) STORED COMMENT ''Margen de ganancia en %'' AFTER precio_venta',
    'SELECT ''La columna margen_ganancia ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Ver estructura actualizada
SELECT 'ESTRUCTURA ACTUALIZADA:' AS info;
DESCRIBE repuestos;

-- Probar el query que estaba dando error
SELECT 'PROBANDO EL QUERY:' AS info;
SELECT
    codigo,
    nombre,
    precio_costo,
    precio_venta,
    margen_ganancia,
    stock_actual,
    stock_minimo,
    activo
FROM repuestos
ORDER BY codigo;

SELECT '✓ Script completado - La columna margen_ganancia está disponible' AS resultado;
