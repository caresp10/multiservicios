-- ==================================================
-- MIGRATION: Agregar columnas para servicios y repuestos en presupuesto_items
-- ==================================================
-- Descripción: Agrega tipo_item, id_servicio e id_repuesto
--              para vincular items de presupuesto con el catálogo
-- ==================================================

USE bd_multiservicios;

-- ============================================
-- 1. Agregar columna tipo_item
-- ============================================

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'presupuesto_items'
    AND COLUMN_NAME = 'tipo_item'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE presupuesto_items
     ADD COLUMN tipo_item ENUM(''SERVICIO'',''REPUESTO'',''MANUAL'') NULL DEFAULT ''MANUAL'' AFTER id_presupuesto',
    'SELECT ''Columna tipo_item ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. Agregar columna id_servicio (SIN constraint)
-- ============================================

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'presupuesto_items'
    AND COLUMN_NAME = 'id_servicio'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE presupuesto_items ADD COLUMN id_servicio BIGINT NULL AFTER tipo_item',
    'SELECT ''Columna id_servicio ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 3. Agregar columna id_repuesto (SIN constraint)
-- ============================================

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'presupuesto_items'
    AND COLUMN_NAME = 'id_repuesto'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE presupuesto_items ADD COLUMN id_repuesto BIGINT NULL AFTER id_servicio',
    'SELECT ''Columna id_repuesto ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 4. Agregar constraint para id_servicio
-- ============================================

SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'presupuesto_items'
    AND CONSTRAINT_NAME = 'fk_presupuesto_item_servicio'
);

SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE presupuesto_items
     ADD CONSTRAINT fk_presupuesto_item_servicio
         FOREIGN KEY (id_servicio) REFERENCES servicios_catalogo(id_servicio) ON DELETE RESTRICT',
    'SELECT ''Constraint fk_presupuesto_item_servicio ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 5. Agregar constraint para id_repuesto
-- ============================================

SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'presupuesto_items'
    AND CONSTRAINT_NAME = 'fk_presupuesto_item_repuesto'
);

SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE presupuesto_items
     ADD CONSTRAINT fk_presupuesto_item_repuesto
         FOREIGN KEY (id_repuesto) REFERENCES repuestos(id_repuesto) ON DELETE RESTRICT',
    'SELECT ''Constraint fk_presupuesto_item_repuesto ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 6. Agregar índices para mejorar performance
-- ============================================

SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'presupuesto_items'
    AND INDEX_NAME = 'idx_tipo_item'
);

SET @sql = IF(@index_exists = 0,
    'ALTER TABLE presupuesto_items ADD INDEX idx_tipo_item (tipo_item)',
    'SELECT ''Índice idx_tipo_item ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 7. Migrar datos existentes
-- ============================================

-- Todos los items existentes se marcan como MANUAL (ingresados manualmente)
UPDATE presupuesto_items
SET tipo_item = 'MANUAL'
WHERE tipo_item IS NULL;

-- ============================================
-- Verificación final
-- ============================================

SELECT 'MIGRACIÓN COMPLETADA - Presupuesto Items' AS status;

SELECT
    'presupuesto_items.tipo_item' AS tabla_columna,
    DATA_TYPE AS tipo_actual,
    COLUMN_TYPE AS tipo_completo,
    IS_NULLABLE AS nullable
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'presupuesto_items'
AND COLUMN_NAME = 'tipo_item';

SELECT
    'presupuesto_items.id_servicio' AS tabla_columna,
    DATA_TYPE AS tipo_actual,
    IS_NULLABLE AS nullable
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'presupuesto_items'
AND COLUMN_NAME = 'id_servicio';

SELECT
    'presupuesto_items.id_repuesto' AS tabla_columna,
    DATA_TYPE AS tipo_actual,
    IS_NULLABLE AS nullable
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'presupuesto_items'
AND COLUMN_NAME = 'id_repuesto';

SELECT
    COUNT(*) AS total_items,
    COUNT(CASE WHEN tipo_item = 'MANUAL' THEN 1 END) AS items_manuales,
    COUNT(CASE WHEN tipo_item = 'SERVICIO' THEN 1 END) AS items_servicios,
    COUNT(CASE WHEN tipo_item = 'REPUESTO' THEN 1 END) AS items_repuestos
FROM presupuesto_items;
