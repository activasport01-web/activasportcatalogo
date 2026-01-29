-- Paso 1: Agregar columna logo_url a la tabla marcas
ALTER TABLE marcas ADD COLUMN logo_url text;

-- Paso 2: Agregar columna marca a la tabla zapatos (relación con marcas)
ALTER TABLE zapatos ADD COLUMN marca text;

-- Paso 3: Insertar algunas marcas de ejemplo con sus logos
-- (Puedes agregar las URLs de los logos después de subirlos a Supabase Storage)
INSERT INTO marcas (nombre, logo_url, active) VALUES
('GRACEP', NULL, true),
('NIKE', NULL, true),
('ADIDAS', NULL, true),
('PUMA', NULL, true),
('REEBOK', NULL, true)
ON CONFLICT (nombre) DO UPDATE SET active = true;

-- Paso 4: Actualizar productos existentes con marcas
-- Ejemplo: Asignar marca GRACEP al producto deportivo
UPDATE zapatos 
SET marca = 'GRACEP'
WHERE nombre = 'deportivo';

-- Verificar
SELECT m.nombre as marca, m.logo_url, m.active,
       COUNT(z.id) as total_productos
FROM marcas m
LEFT JOIN zapatos z ON z.marca = m.nombre
GROUP BY m.id, m.nombre, m.logo_url, m.active
ORDER BY m.nombre;
