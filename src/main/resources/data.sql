-- Insertar categorías de servicio iniciales (solo si no existen)
INSERT IGNORE INTO categorias_servicio (nombre, descripcion, activo) VALUES
('Plomería', 'Servicios de instalación y reparación de tuberías, grifos, sanitarios', true),
('Electricidad', 'Instalaciones eléctricas, reparaciones y mantenimiento', true),
('Carpintería', 'Fabricación y reparación de muebles, puertas, ventanas', true),
('Pintura', 'Pintura de interiores y exteriores, acabados', true),
('Albañilería', 'Construcción, remodelación, mampostería', true),
('Aire Acondicionado', 'Instalación, mantenimiento y reparación de equipos de climatización', true),
('Cerrajería', 'Apertura de puertas, cambio de cerraduras, duplicado de llaves', true),
('Jardinería', 'Mantenimiento de jardines, poda, diseño de espacios verdes', true),
('Limpieza', 'Limpieza profunda, limpieza de oficinas y hogares', true),
('Reparación de Electrodomésticos', 'Reparación de lavadoras, refrigeradores, estufas', true);
