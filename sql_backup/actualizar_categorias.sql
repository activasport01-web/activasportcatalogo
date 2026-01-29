-- PASO 1: Agregar columna de subcategoría a la tabla zapatos
ALTER TABLE zapatos 
ADD COLUMN IF NOT EXISTS subcategoria TEXT;

-- PASO 2: Crear comentarios para documentar las opciones válidas
COMMENT ON COLUMN zapatos.categoria IS 'Categorías válidas: Deportivo, Casual, Semicasual, Tenis';
COMMENT ON COLUMN zapatos.subcategoria IS 'Subcategorías válidas: Turf o Trilla, Chutera, Salonera (opcional)';

-- PASO 3: Actualizar productos existentes (mapeo de categorías viejas a nuevas)
-- Esto es opcional, solo si quieres migrar datos existentes

-- Ejemplo: Convertir "deportivo" antiguo a "Deportivo" nuevo
UPDATE zapatos 
SET categoria = 'Deportivo' 
WHERE LOWER(categoria) IN ('deportivo', 'deporte', 'sport');

-- Ejemplo: Convertir "adulto" a "Casual" (ajusta según tu criterio)
UPDATE zapatos 
SET categoria = 'Casual' 
WHERE LOWER(categoria) IN ('adulto', 'casual');

-- Ejemplo: Convertir "niño" a "Deportivo" (ajusta según tu criterio)
UPDATE zapatos 
SET categoria = 'Deportivo' 
WHERE LOWER(categoria) IN ('niño', 'nino', 'infantil');

-- NOTA: Revisa los datos antes de ejecutar las actualizaciones
-- Puedes ver las categorías actuales con:
-- SELECT DISTINCT categoria FROM zapatos;
