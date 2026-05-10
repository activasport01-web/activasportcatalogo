-- ============================================================
-- Políticas RLS para: portada_destacada + bucket imagenes-zapatos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. HABILITAR RLS en la tabla (si no está habilitado)
ALTER TABLE public.portada_destacada ENABLE ROW LEVEL SECURITY;

-- 2. Política: Cualquiera puede VER portadas activas (para el Home público)
CREATE POLICY "Portada visible al público"
ON public.portada_destacada
FOR SELECT
USING (true);

-- 3. Política: Usuarios autenticados pueden CREAR portadas
CREATE POLICY "Usuarios autenticados pueden crear portadas"
ON public.portada_destacada
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Política: Usuarios autenticados pueden ACTUALIZAR portadas
CREATE POLICY "Usuarios autenticados pueden actualizar portadas"
ON public.portada_destacada
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Política: Usuarios autenticados pueden ELIMINAR portadas
CREATE POLICY "Usuarios autenticados pueden eliminar portadas"
ON public.portada_destacada
FOR DELETE
TO authenticated
USING (true);

-- ============================================================
-- BUCKET DE STORAGE: imagenes-zapatos
-- ============================================================

-- 6. Política: Cualquiera puede VER las imágenes (público)
CREATE POLICY "Imágenes públicas para todos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'imagenes-zapatos');

-- 7. Política: Usuarios autenticados pueden SUBIR imágenes
CREATE POLICY "Usuarios autenticados pueden subir imágenes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'imagenes-zapatos');

-- 8. Política: Usuarios autenticados pueden ACTUALIZAR imágenes
CREATE POLICY "Usuarios autenticados pueden actualizar imágenes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'imagenes-zapatos');

-- 9. Política: Usuarios autenticados pueden ELIMINAR imágenes
CREATE POLICY "Usuarios autenticados pueden eliminar imágenes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'imagenes-zapatos');
