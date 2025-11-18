-- =====================================================
-- RECREAR TABLA REPUESTOS DESDE CERO
-- Fecha: 2025-11-18
-- Descripción: Elimina y recrea la tabla repuestos con
--              la estructura completa normalizada
-- =====================================================

-- ADVERTENCIA: Este script ELIMINARÁ todos los datos existentes en la tabla repuestos
-- Solo ejecutar si estás seguro de que no hay datos importantes

-- Eliminar tabla repuestos existente
DROP TABLE IF EXISTS repuestos;

-- Crear tabla repuestos desde cero con estructura completa
CREATE TABLE repuestos (
    id_repuesto BIGINT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    id_categoria BIGINT,
    precio_costo DECIMAL(12,2) NOT NULL COMMENT 'Precio de compra al proveedor',
    precio_venta DECIMAL(12,2) NOT NULL COMMENT 'Precio de venta al cliente',
    margen_ganancia DECIMAL(5,2) GENERATED ALWAYS AS (
        ((precio_venta - precio_costo) / precio_costo * 100)
    ) STORED COMMENT 'Margen de ganancia en %',
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT DEFAULT 10,
    stock_maximo INT DEFAULT 100,
    punto_reorden INT COMMENT 'Stock en el que se debe reordenar',
    ubicacion VARCHAR(100) COMMENT 'Ubicación física en almacén',
    proveedor VARCHAR(100),
    telefono_proveedor VARCHAR(20),
    unidad_medida ENUM('UNIDAD', 'METRO', 'KILO', 'LITRO', 'CAJA', 'ROLLO', 'PAR') DEFAULT 'UNIDAD',
    marca VARCHAR(50),
    modelo VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (id_categoria) REFERENCES categorias_servicio(id_categoria) ON DELETE SET NULL,
    INDEX idx_codigo (codigo),
    INDEX idx_nombre (nombre),
    INDEX idx_stock_bajo (stock_actual, stock_minimo),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Inventario de repuestos con control de stock';

-- Insertar repuestos de ejemplo
INSERT INTO repuestos (codigo, nombre, descripcion, id_categoria, precio_costo, precio_venta, stock_actual, stock_minimo, stock_maximo, unidad_medida, proveedor, marca) VALUES
('REP-ELEC-001', 'Llave termomagnética 10A', 'Llave termomagnética 10 Amperios', 1, 35000, 55000, 25, 10, 50, 'UNIDAD', 'Distribuidora Eléctrica SA', 'Schneider'),
('REP-ELEC-002', 'Llave termomagnética 20A', 'Llave termomagnética 20 Amperios', 1, 45000, 70000, 20, 10, 50, 'UNIDAD', 'Distribuidora Eléctrica SA', 'Schneider'),
('REP-ELEC-003', 'Llave termomagnética 32A', 'Llave termomagnética 32 Amperios', 1, 55000, 85000, 15, 8, 40, 'UNIDAD', 'Distribuidora Eléctrica SA', 'Schneider'),
('REP-ELEC-004', 'Toma corriente doble', 'Toma corriente doble 220V', 1, 15000, 30000, 50, 20, 100, 'UNIDAD', 'Distribuidora Eléctrica SA', 'Bticino'),
('REP-ELEC-005', 'Interruptor simple', 'Interruptor de pared simple', 1, 12000, 25000, 60, 20, 100, 'UNIDAD', 'Distribuidora Eléctrica SA', 'Bticino'),
('REP-ELEC-006', 'Cable 2.5mm', 'Cable eléctrico 2.5mm por metro', 1, 3500, 6000, 500, 100, 1000, 'METRO', 'Distribuidora Eléctrica SA', 'Prysmian'),
('REP-ELEC-007', 'Cable 4mm', 'Cable eléctrico 4mm por metro', 1, 5500, 9000, 300, 100, 800, 'METRO', 'Distribuidora Eléctrica SA', 'Prysmian'),
('REP-ELEC-008', 'Caja de paso PVC', 'Caja de paso cuadrada PVC', 1, 8000, 15000, 40, 15, 80, 'UNIDAD', 'Distribuidora Eléctrica SA', 'Tigre');

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
