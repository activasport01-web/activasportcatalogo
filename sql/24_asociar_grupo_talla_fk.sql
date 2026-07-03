-- HU8-T4: Asociar grupos_tallas a zapatos mediante FK
-- La columna zapatos.grupo_talla es TEXT (legado).
-- Se agrega grupo_talla_id uuid como FK correcta a grupos_tallas.

ALTER TABLE public.zapatos
ADD COLUMN IF NOT EXISTS grupo_talla_id uuid REFERENCES public.grupos_tallas(id);

-- Migrar datos legado: si en grupos_tallas existe un nombre que coincide
-- (case-insensitive) con el texto en zapatos.grupo_talla, se enlaza.
UPDATE public.zapatos z
SET grupo_talla_id = gt.id
FROM public.grupos_tallas gt
WHERE lower(z.grupo_talla) = lower(gt.nombre)
  AND z.grupo_talla_id IS NULL
  AND z.grupo_talla IS NOT NULL;

-- Índice para acelerar búsquedas de productos por grupo de talla
CREATE INDEX IF NOT EXISTS idx_zapatos_grupo_talla_id ON public.zapatos(grupo_talla_id);
