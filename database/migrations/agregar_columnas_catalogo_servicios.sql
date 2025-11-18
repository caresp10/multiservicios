-- ============================================================================
-- Script para agregar columnas faltantes a servicios_catalogo
-- ============================================================================

-- Verificar si la columna notas_adicionales existe
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'servicios_catalogo'
    AND COLUMN_NAME = 'notas_adicionales'
);

-- Agregar columna notas_adicionales si no existe
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE servicios_catalogo ADD COLUMN notas_adicionales TEXT COMMENT ''Notas, advertencias o información adicional'' AFTER incluye_materiales',
    'SELECT ''La columna notas_adicionales ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar estructura final
SELECT 'Estructura actualizada de servicios_catalogo:' AS info;
DESCRIBE servicios_catalogo;

SELECT '✓ Script completado exitosamente' AS estado;
