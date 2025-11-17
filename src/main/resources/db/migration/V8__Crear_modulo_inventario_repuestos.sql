-- Migración V8: Crear módulo completo de Inventario de Repuestos y Proveedores

-- Tabla de Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id_proveedor BIGINT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    razon_social VARCHAR(150),
    ruc VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion VARCHAR(200),
    ciudad VARCHAR(50),
    pais VARCHAR(50) DEFAULT 'Paraguay',
    persona_contacto VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    observaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de Repuestos (Inventario)
CREATE TABLE IF NOT EXISTS repuestos (
    id_repuesto BIGINT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    marca VARCHAR(50),
    modelo VARCHAR(50),
    categoria VARCHAR(50),
    unidad_medida VARCHAR(20) DEFAULT 'Unidad',
    precio_compra DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    precio_venta DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT DEFAULT 5,
    stock_maximo INT DEFAULT 100,
    ubicacion VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_codigo (codigo),
    INDEX idx_stock (stock_actual)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de Compras
CREATE TABLE IF NOT EXISTS compras (
    id_compra BIGINT PRIMARY KEY AUTO_INCREMENT,
    numero_compra VARCHAR(20) UNIQUE NOT NULL,
    id_proveedor BIGINT NOT NULL,
    fecha_compra DATE NOT NULL,
    numero_factura VARCHAR(50),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    iva DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, COMPLETADA, CANCELADA
    forma_pago VARCHAR(50),
    observaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor),
    INDEX idx_numero_compra (numero_compra),
    INDEX idx_proveedor (id_proveedor),
    INDEX idx_fecha (fecha_compra)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de Detalle de Compras
CREATE TABLE IF NOT EXISTS detalle_compras (
    id_detalle_compra BIGINT PRIMARY KEY AUTO_INCREMENT,
    id_compra BIGINT NOT NULL,
    id_repuesto BIGINT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_compra) REFERENCES compras(id_compra) ON DELETE CASCADE,
    FOREIGN KEY (id_repuesto) REFERENCES repuestos(id_repuesto),
    INDEX idx_compra (id_compra),
    INDEX idx_repuesto (id_repuesto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de Repuestos usados en Órdenes de Trabajo
CREATE TABLE IF NOT EXISTS orden_trabajo_repuestos (
    id_ot_repuesto BIGINT PRIMARY KEY AUTO_INCREMENT,
    id_orden_trabajo BIGINT NOT NULL,
    id_repuesto BIGINT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_orden_trabajo) REFERENCES ordenes_trabajo(id_orden_trabajo) ON DELETE CASCADE,
    FOREIGN KEY (id_repuesto) REFERENCES repuestos(id_repuesto),
    INDEX idx_orden (id_orden_trabajo),
    INDEX idx_repuesto (id_repuesto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertar algunos datos de prueba para proveedores
INSERT INTO proveedores (nombre, razon_social, ruc, telefono, email, ciudad, persona_contacto) VALUES
('Repuestos del Este', 'Repuestos del Este S.A.', '80012345-1', '0981234567', 'ventas@repuestosdeleste.com.py', 'Ciudad del Este', 'María González'),
('Importadora Tech', 'Tech Import S.R.L.', '80023456-2', '0982345678', 'info@techimport.com.py', 'Asunción', 'Carlos Rodríguez');

-- Insertar algunos repuestos de ejemplo
INSERT INTO repuestos (codigo, nombre, descripcion, marca, categoria, unidad_medida, precio_compra, precio_venta, stock_actual, stock_minimo) VALUES
('REP-001', 'Fusible 10A', 'Fusible de vidrio 10 amperios', 'Universal', 'Eléctricos', 'Unidad', 5000, 8000, 50, 10),
('REP-002', 'Cable UTP Cat6', 'Cable de red categoría 6', 'Furukawa', 'Redes', 'Metro', 3000, 5000, 100, 20),
('REP-003', 'Conector RJ45', 'Conector para cable UTP', 'AMP', 'Redes', 'Unidad', 1000, 2000, 200, 50),
('REP-004', 'Disco Duro 1TB', 'Disco duro interno SATA 1TB', 'Western Digital', 'Almacenamiento', 'Unidad', 250000, 350000, 10, 3),
('REP-005', 'Memoria RAM 8GB DDR4', 'Módulo de memoria RAM', 'Kingston', 'Memoria', 'Unidad', 150000, 220000, 15, 5);
