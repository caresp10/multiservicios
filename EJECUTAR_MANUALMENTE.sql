-- =====================================================
-- SCRIPT DE MIGRACION MANUAL PARA MySQL
-- Ejecutar este script completo en tu cliente MySQL
-- (phpMyAdmin, MySQL Workbench, etc.)
-- =====================================================

-- Seleccionar la base de datos correcta
USE multiservicios;

-- =====================================================
-- PASO 1: Agregar columna 'prefijo' si no existe
-- =====================================================

-- Verificar si la columna 'prefijo' ya existe
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'categorias_servicio'
    AND COLUMN_NAME = 'prefijo'
);

-- Solo agregar la columna si NO existe
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE categorias_servicio ADD COLUMN prefijo VARCHAR(10)',
    'SELECT "La columna prefijo ya existe, saltando creación..." AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 2: Limpiar constraint unique si existe
-- =====================================================

-- Eliminar índice unique si existe (para evitar errores al actualizar)
SET @index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'categorias_servicio'
    AND INDEX_NAME = 'uk_prefijo'
);

SET @sql = IF(@index_exists > 0,
    'ALTER TABLE categorias_servicio DROP INDEX uk_prefijo',
    'SELECT "El índice uk_prefijo no existe, saltando eliminación..." AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 3: Actualizar prefijos por categoría
-- =====================================================

-- Actualizar las categorías existentes con prefijos únicos
UPDATE categorias_servicio SET prefijo = 'ELEC' WHERE nombre LIKE '%Electricidad%' OR nombre LIKE '%Eléctric%';
UPDATE categorias_servicio SET prefijo = 'MECAN' WHERE nombre LIKE '%Mecánica%' OR nombre LIKE '%Mecanic%';
UPDATE categorias_servicio SET prefijo = 'PINTU' WHERE nombre LIKE '%Pintura%';
UPDATE categorias_servicio SET prefijo = 'CHAPA' WHERE nombre LIKE '%Chapa%';
UPDATE categorias_servicio SET prefijo = 'MOTOR' WHERE nombre LIKE '%Motor%';
UPDATE categorias_servicio SET prefijo = 'NEUMAT' WHERE nombre LIKE '%Neumático%' OR nombre LIKE '%Goma%';
UPDATE categorias_servicio SET prefijo = 'AIRE' WHERE nombre LIKE '%Aire%' OR nombre LIKE '%A/C%' OR nombre LIKE '%Clima%';
UPDATE categorias_servicio SET prefijo = 'FRENO' WHERE nombre LIKE '%Freno%';
UPDATE categorias_servicio SET prefijo = 'SUSPEN' WHERE nombre LIKE '%Suspensión%' OR nombre LIKE '%Suspension%';
UPDATE categorias_servicio SET prefijo = 'ESCAPE' WHERE nombre LIKE '%Escape%';
UPDATE categorias_servicio SET prefijo = 'TRANS' WHERE nombre LIKE '%Transmisión%' OR nombre LIKE '%Transmision%' OR nombre LIKE '%Caja%';
UPDATE categorias_servicio SET prefijo = 'DIAG' WHERE nombre LIKE '%Diagnóstico%' OR nombre LIKE '%Diagnostico%' OR nombre LIKE '%Scanner%';
UPDATE categorias_servicio SET prefijo = 'LAVADO' WHERE nombre LIKE '%Lavado%' OR nombre LIKE '%Limpieza%';

-- =====================================================
-- PASO 4: Asignar prefijos genéricos
-- =====================================================

-- Asignar prefijo genérico a categorías que no coincidan con ningún patrón
-- Usar el ID de categoría para hacerlo único
UPDATE categorias_servicio
SET prefijo = CONCAT('SRV', LPAD(id_categoria, 2, '0'))
WHERE prefijo IS NULL OR prefijo = 'SRV';

-- =====================================================
-- PASO 5: Agregar constraint UNIQUE
-- =====================================================

-- Agregar constraint de unique al prefijo
ALTER TABLE categorias_servicio
ADD UNIQUE KEY uk_prefijo (prefijo);

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Mostrar todas las categorías con sus prefijos
SELECT
    id_categoria,
    nombre,
    prefijo,
    activo
FROM categorias_servicio
ORDER BY id_categoria;

-- =====================================================
-- FIN DEL SCRIPT
-- Después de ejecutar esto, reinicia el backend
-- =====================================================
