-- SOLUCIÓN SIMPLE: Limpiar todo y empezar de nuevo
-- Esto eliminará las variantes problemáticas y te permitirá agregarlas nuevamente

UPDATE zapatos
SET colores = '[]'::jsonb
WHERE nombre = 'deportivo';

-- Verificar
SELECT nombre, colores, url_imagen
FROM zapatos
WHERE nombre = 'deportivo';
