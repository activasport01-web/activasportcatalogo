-- Cambiar la columna colores de ARRAY a JSONB para soportar objetos complejos
-- Esto permitirá guardar variantes con color, nombre e imagen

-- Paso 1: Crear una nueva columna temporal
ALTER TABLE zapatos ADD COLUMN colores_new JSONB;

-- Paso 2: Migrar datos existentes
-- Convertir el array a JSON usando array_to_json
UPDATE zapatos 
SET colores_new = 
  CASE 
    WHEN colores IS NULL THEN '[]'::jsonb
    ELSE array_to_json(colores)::jsonb
  END;

-- Paso 3: Eliminar la columna vieja
ALTER TABLE zapatos DROP COLUMN colores;

-- Paso 4: Renombrar la nueva columna
ALTER TABLE zapatos RENAME COLUMN colores_new TO colores;

-- Paso 5: Establecer valor por defecto
ALTER TABLE zapatos ALTER COLUMN colores SET DEFAULT '[]'::jsonb;

-- Verificar el cambio
SELECT nombre, colores, pg_typeof(colores) as tipo_columna 
FROM zapatos 
WHERE nombre = 'deportivo';
