-- Script para corregir permisos y políticas de seguridad (RLS) en Pedidos
-- Ejecuta este script en el Editor SQL de Supabase para permitir que se guarden los pedidos.

-- 1. Habilitar RLS explícitamente
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_pedidos ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Admin ve todo pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Usuario ve sus pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Cualquiera crea pedidos" ON public.pedidos;

DROP POLICY IF EXISTS "Admin ve todo detalles" ON public.detalle_pedidos;
DROP POLICY IF EXISTS "Cualquiera crea detalles" ON public.detalle_pedidos;

-- 3. Crear Políticas Correctas

-- -> TABLA PEDIDOS

-- Permitir crear pedidos a CUALQUIERA (público o logueado)
CREATE POLICY "Cualquiera crea pedidos"
ON public.pedidos
FOR INSERT
WITH CHECK (true);

-- Permitir ver sus propios pedidos al usuario logueado
CREATE POLICY "Usuario ve sus pedidos"
ON public.pedidos
FOR SELECT
USING (auth.uid() = cliente_id);

-- Permitir a usuarios autenticados (Admins) ver y editar todo
CREATE POLICY "Admin gestiona todo pedidos"
ON public.pedidos
FOR ALL
USING (auth.role() = 'authenticated');


-- -> TABLA DETALLE_PEDIDOS

-- Permitir crear detalles a CUALQUIERA
CREATE POLICY "Cualquiera crea detalles"
ON public.detalle_pedidos
FOR INSERT
WITH CHECK (true);

-- Permitir a usuarios autenticados (Admins) ver y editar todo
CREATE POLICY "Admin gestiona todo detalles"
ON public.detalle_pedidos
FOR ALL
USING (auth.role() = 'authenticated');
