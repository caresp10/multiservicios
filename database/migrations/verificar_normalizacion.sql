-- =====================================================
-- SCRIPT DE VERIFICACIÓN DE NORMALIZACIÓN
-- Verifica que todas las tablas, columnas, FKs y vistas
-- estén correctamente creadas
-- =====================================================

-- 1. VERIFICAR TABLAS CREADAS
SELECT '=== TABLAS CREADAS ===' AS '';
SELECT
    TABLE_NAME,
    TABLE_COMMENT,
    ENGINE,
    TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN (
    'servicios_catalogo',
    'historico_precios_servicios',
    'repuestos',
    'historico_precios_repuestos',
    'movimientos_stock'
)
ORDER BY TABLE_NAME;

-- 2. VERIFICAR COLUMNAS DE servicios_catalogo
SELECT '=== COLUMNAS DE servicios_catalogo ===' AS '';
SELECT
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'servicios_catalogo'
ORDER BY ORDINAL_POSITION;

-- 3. VERIFICAR COLUMNAS DE repuestos
SELECT '=== COLUMNAS DE repuestos ===' AS '';
SELECT
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'repuestos'
ORDER BY ORDINAL_POSITION;

-- 4. VERIFICAR FOREIGN KEYS
SELECT '=== FOREIGN KEYS CREADAS ===' AS '';
SELECT
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
AND REFERENCED_TABLE_NAME IS NOT NULL
AND (
    TABLE_NAME IN ('servicios_catalogo', 'historico_precios_servicios', 'repuestos', 'historico_precios_repuestos', 'movimientos_stock')
    OR REFERENCED_TABLE_NAME IN ('servicios_catalogo', 'repuestos')
)
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- 5. VERIFICAR VISTAS
SELECT '=== VISTAS CREADAS ===' AS '';
SELECT
    TABLE_NAME AS VISTA_NOMBRE,
    VIEW_DEFINITION
FROM information_schema.VIEWS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN (
    'v_servicios_catalogo',
    'v_repuestos_stock_bajo',
    'v_repuestos_margen'
);

-- 6. VERIFICAR DATOS INSERTADOS
SELECT '=== DATOS DE EJEMPLO INSERTADOS ===' AS '';

SELECT 'servicios_catalogo' AS tabla, COUNT(*) AS cantidad_registros
FROM servicios_catalogo
UNION ALL
SELECT 'repuestos' AS tabla, COUNT(*) AS cantidad_registros
FROM repuestos;

-- 7. VERIFICAR SERVICIOS INSERTADOS
SELECT '=== SERVICIOS EN CATÁLOGO ===' AS '';
SELECT
    codigo,
    nombre,
    precio_base,
    unidad_medida,
    activo
FROM servicios_catalogo
ORDER BY codigo;

-- 8. VERIFICAR REPUESTOS INSERTADOS
SELECT '=== REPUESTOS EN INVENTARIO ===' AS '';
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

-- 9. VERIFICAR COLUMNAS AGREGADAS A TABLAS EXISTENTES
SELECT '=== COLUMNAS AGREGADAS A presupuesto_items ===' AS '';
SELECT
    COLUMN_NAME,
    COLUMN_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'presupuesto_items'
AND COLUMN_NAME IN ('id_servicio_catalogo', 'id_repuesto')
ORDER BY ORDINAL_POSITION;

SELECT '=== COLUMNAS AGREGADAS A factura_items ===' AS '';
SELECT
    COLUMN_NAME,
    COLUMN_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'factura_items'
AND COLUMN_NAME IN ('id_servicio_catalogo', 'id_repuesto', 'aplica_descuento_stock')
ORDER BY ORDINAL_POSITION;

-- 10. VERIFICAR ÍNDICES CREADOS
SELECT '=== ÍNDICES CREADOS ===' AS '';
SELECT
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS COLUMNAS
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN ('servicios_catalogo', 'repuestos')
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY TABLE_NAME, INDEX_NAME;

-- 11. RESUMEN FINAL
SELECT '=== RESUMEN DE VERIFICACIÓN ===' AS '';
SELECT
    'Tablas creadas' AS verificacion,
    COUNT(*) AS cantidad
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN (
    'servicios_catalogo',
    'historico_precios_servicios',
    'repuestos',
    'historico_precios_repuestos',
    'movimientos_stock'
)
UNION ALL
SELECT
    'Vistas creadas' AS verificacion,
    COUNT(*) AS cantidad
FROM information_schema.VIEWS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN (
    'v_servicios_catalogo',
    'v_repuestos_stock_bajo',
    'v_repuestos_margen'
)
UNION ALL
SELECT
    'Servicios insertados' AS verificacion,
    COUNT(*) AS cantidad
FROM servicios_catalogo
UNION ALL
SELECT
    'Repuestos insertados' AS verificacion,
    COUNT(*) AS cantidad
FROM repuestos;

-- =====================================================
-- FIN DE LA VERIFICACIÓN
-- =====================================================
