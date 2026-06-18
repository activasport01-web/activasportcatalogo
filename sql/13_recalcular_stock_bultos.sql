-- =============================================================================
-- CORRECCIÓN: Recalcular stock_bultos a partir de variantes_tallas
-- Objetivo: muchos productos muestran "SIN STOCK" / 0 bultos en el Dashboard
-- y en Alertas de Stock Bajo, pero SÍ tienen stock real cargado en sus
-- variantes de talla (variantes_tallas). stock_bultos quedó desactualizado
-- porque se guardó el producto sin tocar manualmente cada variante.
--
-- Esto solo afecta a productos con variantes_tallas como array no vacío.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PASO 0: Vista previa — ver qué productos cambiarían y por cuánto
-- (no modifica nada, solo para revisar antes de aplicar)
-- -----------------------------------------------------------------------------
SELECT
    z.id,
    z.nombre,
    z.stock_bultos AS stock_actual,
    COALESCE((
        SELECT SUM((elem->>'stock_bultos')::numeric)
        FROM jsonb_array_elements(z.variantes_tallas) AS elem
    ), 0) AS stock_recalculado
FROM public.zapatos z
WHERE jsonb_typeof(z.variantes_tallas) = 'array'
  AND jsonb_array_length(z.variantes_tallas) > 0
  AND z.stock_bultos IS DISTINCT FROM COALESCE((
        SELECT SUM((elem->>'stock_bultos')::numeric)
        FROM jsonb_array_elements(z.variantes_tallas) AS elem
    ), 0)
ORDER BY z.nombre;


-- -----------------------------------------------------------------------------
-- PASO 1: Aplicar la corrección (ejecutar solo después de revisar el PASO 0)
-- -----------------------------------------------------------------------------
UPDATE public.zapatos z
SET stock_bultos = COALESCE((
    SELECT SUM((elem->>'stock_bultos')::numeric)
    FROM jsonb_array_elements(z.variantes_tallas) AS elem
), 0)
WHERE jsonb_typeof(z.variantes_tallas) = 'array'
  AND jsonb_array_length(z.variantes_tallas) > 0;


-- -----------------------------------------------------------------------------
-- PASO 2: Verificar que ya no queden diferencias
-- -----------------------------------------------------------------------------
-- SELECT COUNT(*) FROM public.zapatos z
-- WHERE jsonb_typeof(z.variantes_tallas) = 'array'
--   AND jsonb_array_length(z.variantes_tallas) > 0
--   AND z.stock_bultos IS DISTINCT FROM COALESCE((
--         SELECT SUM((elem->>'stock_bultos')::numeric)
--         FROM jsonb_array_elements(z.variantes_tallas) AS elem
--     ), 0);
-- (debería devolver 0)
