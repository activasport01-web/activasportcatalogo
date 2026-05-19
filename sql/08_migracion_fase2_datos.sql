-- ==============================================================================
-- FASE 2: MIGRACIÓN DE DATOS (TEXTO A IDs)
-- Rellena las nuevas columnas UUID buscando las coincidencias de texto
-- ignorando mayúsculas, minúsculas y espacios en blanco.
-- ==============================================================================

-- 1. Llenar marca_id cruzando el texto con la tabla de marcas
UPDATE public.zapatos z
SET marca_id = m.id
FROM public.marcas m
WHERE TRIM(LOWER(z.marca)) = TRIM(LOWER(m.nombre));

-- 2. Llenar categoria_id cruzando el texto con la tabla de categorias
UPDATE public.zapatos z
SET categoria_id = c.id
FROM public.categorias c
WHERE TRIM(LOWER(z.categoria)) = TRIM(LOWER(c.nombre));

-- 3. Llenar subcategoria_id cruzando el texto con la tabla de subcategorias
UPDATE public.zapatos z
SET subcategoria_id = s.id
FROM public.subcategorias s
WHERE TRIM(LOWER(z.subcategoria)) = TRIM(LOWER(s.nombre));

-- 4. Llenar genero_id cruzando el texto con la tabla de generos
UPDATE public.zapatos z
SET genero_id = g.id
FROM public.generos g
WHERE TRIM(LOWER(z.genero)) = TRIM(LOWER(g.nombre));

-- 5. Llenar categoria_id dentro de la tabla de subcategorias
UPDATE public.subcategorias s
SET categoria_id = c.id
FROM public.categorias c
WHERE TRIM(LOWER(s.categoria_relacionada)) = TRIM(LOWER(c.nombre));
