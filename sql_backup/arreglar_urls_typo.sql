-- Arreglar el typo en las URLs de Supabase
-- Cambiar 'kaloxowczuyyzzuhduep' (incorrecto) por 'kaloxowczuyyzuhduep' (correcto)

UPDATE zapatos
SET colores = (
  SELECT jsonb_agg(
    jsonb_set(
      elem::jsonb,
      '{imagen}',
      to_jsonb(replace(elem::jsonb->>'imagen', 'kaloxowczuyyzzuhduep', 'kaloxowczuyyzuhduep'))
    )
  )
  FROM jsonb_array_elements_text(colores) AS elem
)
WHERE colores::text LIKE '%kaloxowczuyyzzuhduep%';

-- También actualizar url_imagen e imagen_hover si tienen el typo
UPDATE zapatos
SET url_imagen = replace(url_imagen, 'kaloxowczuyyzzuhduep', 'kaloxowczuyyzuhduep')
WHERE url_imagen LIKE '%kaloxowczuyyzzuhduep%';

UPDATE zapatos
SET imagen_hover = replace(imagen_hover, 'kaloxowczuyyzzuhduep', 'kaloxowczuyyzuhduep')
WHERE imagen_hover LIKE '%kaloxowczuyyzzuhduep%';

-- Verificar
SELECT nombre, url_imagen, colores
FROM zapatos
WHERE nombre = 'deportivo';
