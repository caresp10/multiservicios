-- Migración para agregar relación entre Usuario y Tecnico

-- Agregar columna id_usuario a la tabla tecnicos
ALTER TABLE tecnicos
ADD COLUMN id_usuario BIGINT UNIQUE COMMENT 'Usuario asociado para login del técnico';

-- Agregar foreign key constraint
ALTER TABLE tecnicos
ADD CONSTRAINT fk_tecnico_usuario
FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
ON DELETE SET NULL;

-- Crear índice para mejorar performance en búsquedas
CREATE INDEX idx_tecnico_usuario ON tecnicos(id_usuario);
