-- Agregar columna de categoría a la tabla de técnicos
ALTER TABLE tecnicos ADD COLUMN id_categoria BIGINT NULL;

-- Agregar foreign key constraint
ALTER TABLE tecnicos ADD CONSTRAINT fk_tecnico_categoria
    FOREIGN KEY (id_categoria) REFERENCES categorias_servicio(id_categoria);
