-- =========================================
-- Script de Migración: Agregar tipo_item a repuestos_utilizados
-- Fecha: 2025
-- Descripción: Agrega columnas para soportar items tipificados (SERVICIO, REPUESTO, MANUAL)
--              con referencias a servicios_catalogo y repuestos
-- =========================================

USE multiservicios;

-- Verificar si la columna tipo_item ya existe
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'repuestos_utilizados'
    AND COLUMN_NAME = 'tipo_item'
);

-- Agregar columna tipo_item si no existe
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE repuestos_utilizados
     ADD COLUMN tipo_item ENUM(''SERVICIO'',''REPUESTO'',''MANUAL'') NULL DEFAULT ''MANUAL'' AFTER id_ot',
    'SELECT ''Columna tipo_item ya existe'' AS mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar si la columna id_servicio ya existe
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'repuestos_utilizados'
    AND COLUMN_NAME = 'id_servicio'
);

-- Agregar columna id_servicio si no existe
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE repuestos_utilizados
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
    AND TABLE_NAME = 'repuestos_utilizados'
    AND COLUMN_NAME = 'id_repuesto'
);

-- Agregar columna id_repuesto si no existe
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE repuestos_utilizados
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
    AND TABLE_NAME = 'repuestos_utilizados'
    AND CONSTRAINT_NAME = 'fk_repuesto_utilizado_servicio'
);

-- Agregar FK constraint para id_servicio si no existe
SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE repuestos_utilizados
     ADD CONSTRAINT fk_repuesto_utilizado_servicio
     FOREIGN KEY (id_servicio) REFERENCES servicios_catalogo(id_servicio)',
    'SELECT ''Constraint fk_repuesto_utilizado_servicio ya existe'' AS mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar si existe el constraint FK para id_repuesto
SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'repuestos_utilizados'
    AND CONSTRAINT_NAME = 'fk_repuesto_utilizado_repuesto'
);

-- Agregar FK constraint para id_repuesto si no existe
SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE repuestos_utilizados
     ADD CONSTRAINT fk_repuesto_utilizado_repuesto
     FOREIGN KEY (id_repuesto) REFERENCES repuestos(id_repuesto)',
    'SELECT ''Constraint fk_repuesto_utilizado_repuesto ya existe'' AS mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar el resultado
SELECT 'Migración completada: repuestos_utilizados ahora soporta items tipificados' AS resultado;

-- Mostrar estructura de la tabla
DESCRIBE repuestos_utilizados;
