-- =====================================================
-- NORMALIZACIÓN: CATÁLOGO DE SERVICIOS Y REPUESTOS
-- Fecha: 2025-11-17
-- Descripción: Crear catálogo de servicios con precios,
--              control de stock de repuestos, históricos
-- =====================================================

-- 1. TABLA: servicios_catalogo
-- Catálogo de servicios estándar con precios por categoría
CREATE TABLE IF NOT EXISTS servicios_catalogo (
    id_servicio BIGINT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    id_categoria BIGINT NOT NULL,
    precio_base DECIMAL(12,2) NOT NULL,
    unidad_medida ENUM('HORA', 'UNIDAD', 'METRO', 'METRO2', 'SERVICIO') DEFAULT 'SERVICIO',
    tiempo_estimado_horas DECIMAL(5,2) COMMENT 'Tiempo estimado de ejecución en horas',
    incluye_materiales BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE RESTRICT,
    INDEX idx_categoria (id_categoria),
    INDEX idx_activo (activo),
    INDEX idx_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Catálogo de servicios estándar con precios base';

-- 2. TABLA: historico_precios_servicios
-- Auditoría de cambios de precios en servicios
CREATE TABLE IF NOT EXISTS historico_precios_servicios (
    id_historico BIGINT PRIMARY KEY AUTO_INCREMENT,
    id_servicio BIGINT NOT NULL,
    precio_anterior DECIMAL(12,2),
    precio_nuevo DECIMAL(12,2) NOT NULL,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario BIGINT,
    motivo VARCHAR(255),

    FOREIGN KEY (id_servicio) REFERENCES servicios_catalogo(id_servicio) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    INDEX idx_servicio_fecha (id_servicio, fecha_cambio DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Histórico de cambios de precios de servicios';

-- 3. TABLA: repuestos (Mejorada)
-- Gestión de repuestos con control de stock
CREATE TABLE IF NOT EXISTS repuestos (
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

    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE SET NULL,
    INDEX idx_codigo (codigo),
    INDEX idx_nombre (nombre),
    INDEX idx_stock_bajo (stock_actual, stock_minimo),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Inventario de repuestos con control de stock';

-- 4. TABLA: historico_precios_repuestos
-- Auditoría de cambios de precios en repuestos
CREATE TABLE IF NOT EXISTS historico_precios_repuestos (
    id_historico BIGINT PRIMARY KEY AUTO_INCREMENT,
    id_repuesto BIGINT NOT NULL,
    precio_costo_anterior DECIMAL(12,2),
    precio_costo_nuevo DECIMAL(12,2),
    precio_venta_anterior DECIMAL(12,2),
    precio_venta_nuevo DECIMAL(12,2),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario BIGINT,
    motivo VARCHAR(255),

    FOREIGN KEY (id_repuesto) REFERENCES repuestos(id_repuesto) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    INDEX idx_repuesto_fecha (id_repuesto, fecha_cambio DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Histórico de cambios de precios de repuestos';

-- 5. TABLA: movimientos_stock
-- Registro de todos los movimientos de stock (entrada/salida)
CREATE TABLE IF NOT EXISTS movimientos_stock (
    id_movimiento BIGINT PRIMARY KEY AUTO_INCREMENT,
    id_repuesto BIGINT NOT NULL,
    tipo_movimiento ENUM('ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION') NOT NULL,
    cantidad INT NOT NULL COMMENT 'Cantidad (negativa para salidas)',
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    precio_unitario DECIMAL(12,2),
    id_factura BIGINT COMMENT 'Factura que generó la salida',
    id_compra BIGINT COMMENT 'Compra que generó la entrada',
    id_usuario BIGINT NOT NULL,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,

    FOREIGN KEY (id_repuesto) REFERENCES repuestos(id_repuesto) ON DELETE RESTRICT,
    FOREIGN KEY (id_factura) REFERENCES facturas(id_factura) ON DELETE SET NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    INDEX idx_repuesto (id_repuesto),
    INDEX idx_tipo (tipo_movimiento),
    INDEX idx_fecha (fecha_movimiento DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Trazabilidad completa de movimientos de stock';

-- 6. MODIFICAR: presupuesto_items
-- Agregar referencias a servicios del catálogo y repuestos
ALTER TABLE presupuesto_items
ADD COLUMN IF NOT EXISTS id_servicio_catalogo BIGINT AFTER id_item,
ADD COLUMN IF NOT EXISTS id_repuesto BIGINT AFTER id_servicio_catalogo,
ADD CONSTRAINT fk_presupuesto_item_servicio
    FOREIGN KEY (id_servicio_catalogo) REFERENCES servicios_catalogo(id_servicio) ON DELETE SET NULL,
ADD CONSTRAINT fk_presupuesto_item_repuesto
    FOREIGN KEY (id_repuesto) REFERENCES repuestos(id_repuesto) ON DELETE SET NULL,
ADD INDEX idx_servicio_catalogo (id_servicio_catalogo),
ADD INDEX idx_repuesto (id_repuesto);

-- 7. MODIFICAR: factura_items
-- Agregar referencias y control de descuento de stock
ALTER TABLE factura_items
ADD COLUMN IF NOT EXISTS id_servicio_catalogo BIGINT AFTER id_factura,
ADD COLUMN IF NOT EXISTS id_repuesto BIGINT AFTER id_servicio_catalogo,
ADD COLUMN IF NOT EXISTS aplica_descuento_stock BOOLEAN DEFAULT TRUE COMMENT 'Si es repuesto, descontar stock',
ADD CONSTRAINT fk_factura_item_servicio
    FOREIGN KEY (id_servicio_catalogo) REFERENCES servicios_catalogo(id_servicio) ON DELETE SET NULL,
ADD CONSTRAINT fk_factura_item_repuesto
    FOREIGN KEY (id_repuesto) REFERENCES repuestos(id_repuesto) ON DELETE SET NULL,
ADD INDEX idx_servicio_catalogo (id_servicio_catalogo),
ADD INDEX idx_repuesto (id_repuesto);

-- =====================================================
-- DATOS DE EJEMPLO
-- =====================================================

-- Insertar servicios de ejemplo para Electricidad
INSERT INTO servicios_catalogo (codigo, nombre, descripcion, id_categoria, precio_base, unidad_medida, tiempo_estimado_horas, incluye_materiales) VALUES
('ELEC-001', 'Instalación toma corriente simple', 'Instalación de toma corriente simple con materiales incluidos', 1, 150000, 'UNIDAD', 1.5, TRUE),
('ELEC-002', 'Instalación toma corriente doble', 'Instalación de toma corriente doble con materiales incluidos', 1, 200000, 'UNIDAD', 2.0, TRUE),
('ELEC-003', 'Cambio de llave termomagnética', 'Cambio de llave TM simple (10A-50A)', 1, 100000, 'UNIDAD', 1.0, FALSE),
('ELEC-004', 'Instalación de interruptor simple', 'Instalación de interruptor de pared simple', 1, 80000, 'UNIDAD', 0.75, TRUE),
('ELEC-005', 'Instalación de luminaria', 'Instalación de luminaria con cableado', 1, 120000, 'UNIDAD', 1.25, FALSE),
('ELEC-006', 'Revisión tablero eléctrico', 'Inspección completa de tablero eléctrico', 1, 250000, 'SERVICIO', 2.0, FALSE),
('ELEC-007', 'Instalación punto de luz', 'Instalación de punto de luz con cableado', 1, 180000, 'UNIDAD', 2.5, TRUE);

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
-- VISTAS ÚTILES
-- =====================================================

-- Vista: Servicios con su categoría
CREATE OR REPLACE VIEW v_servicios_catalogo AS
SELECT
    s.id_servicio,
    s.codigo,
    s.nombre,
    s.descripcion,
    s.precio_base,
    s.unidad_medida,
    s.tiempo_estimado_horas,
    s.incluye_materiales,
    s.activo,
    c.id_categoria,
    c.nombre AS categoria_nombre
FROM servicios_catalogo s
INNER JOIN categorias c ON s.id_categoria = c.id_categoria;

-- Vista: Repuestos con stock bajo
CREATE OR REPLACE VIEW v_repuestos_stock_bajo AS
SELECT
    r.id_repuesto,
    r.codigo,
    r.nombre,
    r.stock_actual,
    r.stock_minimo,
    r.stock_maximo,
    r.punto_reorden,
    r.proveedor,
    r.telefono_proveedor,
    (r.stock_minimo - r.stock_actual) AS cantidad_a_pedir
FROM repuestos r
WHERE r.stock_actual <= r.stock_minimo
AND r.activo = TRUE
ORDER BY r.stock_actual ASC;

-- Vista: Repuestos con margen de ganancia
CREATE OR REPLACE VIEW v_repuestos_margen AS
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
LEFT JOIN categorias c ON r.id_categoria = c.id_categoria
WHERE r.activo = TRUE
ORDER BY r.margen_ganancia DESC;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
