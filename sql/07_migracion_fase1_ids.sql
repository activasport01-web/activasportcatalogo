-- ==============================================================================
-- FASE 1: PREPARACIÓN PARA MIGRACIÓN A IDs (CERO RIESGO PARA EL FRONTEND)
-- Este script NO borra ni altera datos existentes. Solo añade nuevas columnas
-- y reglas de seguridad.
-- ==============================================================================

-- 1. Agregar la Llave Foránea a compras_producto
-- Esto asegura que no se puedan registrar compras de zapatos que no existen.
ALTER TABLE public.compras_producto
ADD CONSTRAINT compras_producto_producto_id_fkey 
FOREIGN KEY (producto_id) REFERENCES public.zapatos(id);

-- 2. Crear las nuevas columnas de ID en la tabla zapatos
-- Se crean vacías (NULL) para no romper el sistema actual.
ALTER TABLE public.zapatos
ADD COLUMN categoria_id uuid REFERENCES public.categorias(id),
ADD COLUMN marca_id uuid REFERENCES public.marcas(id),
ADD COLUMN subcategoria_id uuid REFERENCES public.subcategorias(id),
ADD COLUMN genero_id uuid REFERENCES public.generos(id);

-- 3. Crear columna ID en subcategorias
-- Actualmente subcategorias usa un texto para referirse a la categoria principal.
ALTER TABLE public.subcategorias
ADD COLUMN categoria_id uuid REFERENCES public.categorias(id);
