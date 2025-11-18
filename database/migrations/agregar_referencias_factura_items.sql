-- =========================================
-- Script de Migración: Agregar referencias a factura_items
-- Fecha: 2025
-- Descripción: Agrega columnas para vincular items de factura con servicios_catalogo y repuestos
-- =========================================

USE multiservicios;

-- Verificar si la columna id_servicio ya existe
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'factura_items'
    AND COLUMN_NAME = 'id_servicio'
);

-- Agregar columna id_servicio si no existe
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE factura_items
     ADD COLUMN id_servicio BIGINT NULL AFTER tipo_item',
    'SELECT ''Columna id_servicio ya existe'' AS mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar si la columna id_repuesto ya existe
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'factura_items'
    AND COLUMN_NAME = 'id_repuesto'
);

-- Agregar columna id_repuesto si no existe
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE factura_items
     ADD COLUMN id_repuesto BIGINT NULL AFTER id_servicio',
    'SELECT ''Columna id_repuesto ya existe'' AS mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar si existe el constraint FK para id_servicio
SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'factura_items'
    AND CONSTRAINT_NAME = 'fk_factura_item_servicio'
);

-- Agregar FK constraint para id_servicio si no existe
SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE factura_items
     ADD CONSTRAINT fk_factura_item_servicio
     FOREIGN KEY (id_servicio) REFERENCES servicios_catalogo(id_servicio)',
    'SELECT ''Constraint fk_factura_item_servicio ya existe'' AS mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar si existe el constraint FK para id_repuesto
SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'factura_items'
    AND CONSTRAINT_NAME = 'fk_factura_item_repuesto'
);

-- Agregar FK constraint para id_repuesto si no existe
SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE factura_items
     ADD CONSTRAINT fk_factura_item_repuesto
     FOREIGN KEY (id_repuesto) REFERENCES repuestos(id_repuesto)',
    'SELECT ''Constraint fk_factura_item_repuesto ya existe'' AS mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar el resultado
SELECT 'Migración completada: factura_items ahora soporta referencias a servicios y repuestos' AS resultado;

-- Mostrar estructura de la tabla
DESCRIBE factura_items;
