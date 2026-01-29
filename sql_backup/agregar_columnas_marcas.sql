-- Solo agregar las columnas necesarias
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE zapatos ADD COLUMN IF NOT EXISTS marca text;

-- Verificar marcas existentes
SELECT id, nombre, logo_url, active, created_at
FROM marcas
ORDER BY nombre;
