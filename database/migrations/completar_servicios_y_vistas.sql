-- =====================================================
-- COMPLETAR SERVICIOS Y VISTAS FALTANTES
-- =====================================================

-- 1. Insertar servicios (usar INSERT IGNORE para evitar duplicados)
INSERT IGNORE INTO servicios_catalogo (codigo, nombre, descripcion, id_categoria, precio_base, unidad_medida, tiempo_estimado_horas, incluye_materiales) VALUES
('ELEC-001', 'Instalación toma corriente simple', 'Instalación de toma corriente simple con materiales incluidos', 1, 150000, 'UNIDAD', 1.5, TRUE),
('ELEC-002', 'Instalación toma corriente doble', 'Instalación de toma corriente doble con materiales incluidos', 1, 200000, 'UNIDAD', 2.0, TRUE),
('ELEC-003', 'Cambio de llave termomagnética', 'Cambio de llave TM simple (10A-50A)', 1, 100000, 'UNIDAD', 1.0, FALSE),
('ELEC-004', 'Instalación de interruptor simple', 'Instalación de interruptor de pared simple', 1, 80000, 'UNIDAD', 0.75, TRUE),
('ELEC-005', 'Instalación de luminaria', 'Instalación de luminaria con cableado', 1, 120000, 'UNIDAD', 1.25, FALSE),
('ELEC-006', 'Revisión tablero eléctrico', 'Inspección completa de tablero eléctrico', 1, 250000, 'SERVICIO', 2.0, FALSE),
('ELEC-007', 'Instalación punto de luz', 'Instalación de punto de luz con cableado', 1, 180000, 'UNIDAD', 2.5, TRUE);

-- 2. Vista de repuestos con margen de ganancia
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
    c.nombre AS categoria_nombre
FROM repuestos r
LEFT JOIN categorias_servicio c ON r.id_categoria = c.id_categoria
WHERE r.activo = TRUE
ORDER BY r.margen_ganancia DESC;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
