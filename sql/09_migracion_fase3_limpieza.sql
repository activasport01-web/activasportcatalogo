-- ==============================================================================
-- FASE FINAL (FASE 5): LIMPIEZA Y NORMALIZACIÓN DEFINITIVA
-- ==============================================================================
-- ADVERTENCIA: Este script ELIMINA PERMANENTEMENTE las columnas de texto plano
-- que fueron reemplazadas por las nuevas llaves foráneas (UUIDs).
-- NO EJECUTAR hasta haber confirmado que el frontend (catálogo público) 
-- y el backend (admin) ya están usando *_id correctamente.
-- ==============================================================================

ALTER TABLE public.zapatos
DROP COLUMN IF EXISTS categoria CASCADE,
DROP COLUMN IF EXISTS marca CASCADE,
DROP COLUMN IF EXISTS subcategoria CASCADE,
DROP COLUMN IF EXISTS genero CASCADE;

-- Opcional: Si se desea forzar a que todo nuevo zapato TENGA que tener una 
-- marca y categoria válida, se puede agregar una restricción NOT NULL:
-- ALTER TABLE public.zapatos ALTER COLUMN categoria_id SET NOT NULL;
-- ALTER TABLE public.zapatos ALTER COLUMN marca_id SET NOT NULL;

-- Felicidades, la base de datos ahora está 100% normalizada relacionalmente.
