-- Script para actualizar la estructura de colores en la tabla zapatos
-- Ahora soportará objetos con color, nombre e imagen

-- NOTA: La columna 'colores' ya existe como JSONB, solo necesitamos documentar el nuevo formato

COMMENT ON COLUMN zapatos.colores IS 'Array de objetos con formato: [{"color": "#HEX", "nombre": "Nombre Color", "imagen": "URL"}] o array de strings ["#HEX"] para compatibilidad';

-- Ejemplo de cómo actualizar un producto existente al nuevo formato:
-- UPDATE zapatos 
-- SET colores = '[
--   {"color": "#000000", "nombre": "Negro", "imagen": "https://tu-bucket.supabase.co/zapato-negro.jpg"},
--   {"color": "#FFFFFF", "nombre": "Blanco", "imagen": "https://tu-bucket.supabase.co/zapato-blanco.jpg"}
-- ]'::jsonb
-- WHERE id = 'TU_PRODUCTO_ID';

-- El sistema soporta AMBOS formatos:
-- Formato VIEJO (solo hex): ["#000000", "#FFFFFF", "#FF0000"]
-- Formato NUEVO (con imágenes): [{"color": "#000000", "nombre": "Negro", "imagen": "url"}, ...]
