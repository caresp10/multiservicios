-- ============================================================================
-- Script para agregar la columna calculada margen_ganancia a la tabla repuestos
-- ============================================================================

-- Verificar si la columna existe y eliminarla si está mal configurada
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'repuestos'
    AND COLUMN_NAME = 'margen_ganancia'
);

-- Si existe, la eliminamos primero para recrearla correctamente
SET @sql = IF(@column_exists > 0,
    'ALTER TABLE repuestos DROP COLUMN margen_ganancia',
    'SELECT "La columna no existe, se creará" AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ahora agregar la columna calculada correctamente
ALTER TABLE repuestos
ADD COLUMN margen_ganancia DECIMAL(5,2)
GENERATED ALWAYS AS (
    CASE
        WHEN precio_costo > 0 THEN ((precio_venta - precio_costo) / precio_costo * 100)
        ELSE 0
    END
) STORED
COMMENT 'Margen de ganancia en %'
AFTER precio_venta;

-- Verificar que se creó correctamente
SELECT
    'Columna margen_ganancia agregada correctamente' AS resultado,
    COUNT(*) AS total_repuestos
FROM repuestos;

-- Mostrar algunos ejemplos con el cálculo
SELECT
    codigo,
    nombre,
    precio_costo,
    precio_venta,
    margen_ganancia AS margen_pct,
    stock_actual
FROM repuestos
LIMIT 5;

-- Recrear la vista v_repuestos_margen si existe
DROP VIEW IF EXISTS v_repuestos_margen;

CREATE VIEW v_repuestos_margen AS
SELECT
    r.id_repuesto,
    r.codigo,
    r.nombre,
    r.precio_costo,
    r.precio_venta,
    r.margen_ganancia,
    r.stock_actual,
    r.stock_minimo,
    c.nombre AS categoria_nombre
FROM repuestos r
LEFT JOIN categorias_servicio c ON r.id_categoria = c.id_categoria
WHERE r.activo = TRUE
ORDER BY r.margen_ganancia DESC;

-- Probar la vista
SELECT * FROM v_repuestos_margen;

SELECT '✓ Script completado exitosamente' AS estado;
