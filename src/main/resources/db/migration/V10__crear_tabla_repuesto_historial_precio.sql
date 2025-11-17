-- Crear tabla para historial de precios de repuestos
CREATE TABLE IF NOT EXISTS repuesto_historial_precio (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_repuesto BIGINT NOT NULL,
    precio_compra DECIMAL(10,2) NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    fecha_cambio DATETIME NOT NULL,
    FOREIGN KEY (id_repuesto) REFERENCES repuestos(id_repuesto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índice para búsquedas rápidas por repuesto y fecha
CREATE INDEX idx_repuesto_fecha ON repuesto_historial_precio(id_repuesto, fecha_cambio);
