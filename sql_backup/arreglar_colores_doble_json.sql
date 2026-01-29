-- Arreglar el problema de doble serialización JSON
-- Los datos están guardados como array de strings JSON, necesitamos convertirlos a objetos

UPDATE zapatos
SET colores = (
  SELECT jsonb_agg(elem::jsonb)
  FROM jsonb_array_elements_text(colores) AS elem
)
WHERE jsonb_typeof(colores) = 'array' 
  AND colores::text LIKE '%\\"%'; -- Detectar si tiene strings escapados

-- Verificar el resultado
SELECT nombre, colores, jsonb_typeof(colores) as tipo
FROM zapatos 
WHERE nombre = 'deportivo';
