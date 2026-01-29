-- Arreglar el doble encoding JSON
-- Convertir array de strings JSON a array de objetos JSON

UPDATE zapatos
SET colores = (
  SELECT jsonb_agg(elem::jsonb)
  FROM jsonb_array_elements_text(colores) AS elem
)
WHERE nombre = 'deportivo';

-- Verificar el resultado
SELECT nombre, colores, jsonb_typeof(colores) as tipo,
       jsonb_typeof(colores->0) as tipo_primer_elemento
FROM zapatos 
WHERE nombre = 'deportivo';
