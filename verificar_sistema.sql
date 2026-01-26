-- Verificación completa del sistema
-- Ejecuta esto para ver el estado actual de todos los productos

SELECT 
    id,
    nombre,
    categoria,
    disponible,
    url_imagen IS NOT NULL as tiene_imagen_principal,
    imagen_hover IS NOT NULL as tiene_imagen_hover,
    jsonb_typeof(colores) as tipo_colores,
    jsonb_array_length(colores) as cantidad_variantes,
    colores
FROM zapatos
ORDER BY fecha_creacion DESC
LIMIT 5;
