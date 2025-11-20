-- Agregar campo prefijo a categorias_servicio para generación automática de códigos
ALTER TABLE categorias_servicio
ADD COLUMN prefijo VARCHAR(10);

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

-- Asignar prefijo genérico a categorías que no coincidan con ningún patrón
-- Usar el ID de categoría para hacerlo único
UPDATE categorias_servicio
SET prefijo = CONCAT('SRV', LPAD(id_categoria, 2, '0'))
WHERE prefijo IS NULL;

-- Agregar constraint de unique al prefijo
ALTER TABLE categorias_servicio
ADD UNIQUE KEY uk_prefijo (prefijo);
