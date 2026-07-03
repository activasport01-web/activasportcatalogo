-- Sprint 2: Crear grupos_tallas y habilitar RLS en tablas HU5-HU8
-- Ejecutar en Supabase SQL Editor

-- ============================================================
-- 1. CREAR grupos_tallas (HU8-T2)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.grupos_tallas (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre         text NOT NULL,
  rango_tallas   text,
  orden          integer DEFAULT 0,
  activa         boolean DEFAULT true,
  fecha_creacion timestamptz DEFAULT now()
);

-- ============================================================
-- 2. HABILITAR RLS EN TODAS LAS TABLAS SPRINT 2
-- ============================================================
ALTER TABLE public.categorias    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marcas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_tallas ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. POLÍTICAS: lectura pública + escritura solo admin
-- ============================================================

-- CATEGORIAS
DROP POLICY IF EXISTS "Lectura publica categorias"  ON public.categorias;
DROP POLICY IF EXISTS "Admin gestiona categorias"   ON public.categorias;
CREATE POLICY "Lectura publica categorias" ON public.categorias
  FOR SELECT USING (true);
CREATE POLICY "Admin gestiona categorias" ON public.categorias
  FOR ALL TO authenticated
  USING (es_administrador())
  WITH CHECK (es_administrador());

-- SUBCATEGORIAS
DROP POLICY IF EXISTS "Lectura publica subcategorias" ON public.subcategorias;
DROP POLICY IF EXISTS "Admin gestiona subcategorias"  ON public.subcategorias;
CREATE POLICY "Lectura publica subcategorias" ON public.subcategorias
  FOR SELECT USING (true);
CREATE POLICY "Admin gestiona subcategorias" ON public.subcategorias
  FOR ALL TO authenticated
  USING (es_administrador())
  WITH CHECK (es_administrador());

-- MARCAS
DROP POLICY IF EXISTS "Lectura publica marcas" ON public.marcas;
DROP POLICY IF EXISTS "Admin gestiona marcas"  ON public.marcas;
CREATE POLICY "Lectura publica marcas" ON public.marcas
  FOR SELECT USING (true);
CREATE POLICY "Admin gestiona marcas" ON public.marcas
  FOR ALL TO authenticated
  USING (es_administrador())
  WITH CHECK (es_administrador());

-- GENEROS
DROP POLICY IF EXISTS "Lectura publica generos" ON public.generos;
DROP POLICY IF EXISTS "Admin gestiona generos"  ON public.generos;
CREATE POLICY "Lectura publica generos" ON public.generos
  FOR SELECT USING (true);
CREATE POLICY "Admin gestiona generos" ON public.generos
  FOR ALL TO authenticated
  USING (es_administrador())
  WITH CHECK (es_administrador());

-- GRUPOS_TALLAS
DROP POLICY IF EXISTS "Lectura publica grupos_tallas" ON public.grupos_tallas;
DROP POLICY IF EXISTS "Admin gestiona grupos_tallas"  ON public.grupos_tallas;
CREATE POLICY "Lectura publica grupos_tallas" ON public.grupos_tallas
  FOR SELECT USING (true);
CREATE POLICY "Admin gestiona grupos_tallas" ON public.grupos_tallas
  FOR ALL TO authenticated
  USING (es_administrador())
  WITH CHECK (es_administrador());
