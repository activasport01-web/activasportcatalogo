-- Script para Reparar el Módulo de Promociones y Storage
-- Ejecuta esto en el Editor SQL de Supabase para habilitar la subida de imágenes.

-- 1. Crear el Bucket de Almacenamiento 'promociones' si no existe
insert into storage.buckets (id, name, public)
values ('promociones', 'promociones', true)
on conflict (id) do nothing;

-- 2. Eliminar políticas antiguas para evitar conflictos
drop policy if exists "Imagenes Promociones Publicas" on storage.objects;
drop policy if exists "Admin Subir Imagenes Promociones" on storage.objects;
drop policy if exists "Admin Actualizar Imagenes Promociones" on storage.objects;
drop policy if exists "Admin Eliminar Imagenes Promociones" on storage.objects;

-- 3. Crear Políticas de Seguridad para el Storage
-- Permitir que CUALQUIERA vea las imágenes (Público)
create policy "Imagenes Promociones Publicas"
on storage.objects for select
using ( bucket_id = 'promociones' );

-- Permitir que usuarios AUTENTICADOS (Admins) suban imágenes
create policy "Admin Subir Imagenes Promociones"
on storage.objects for insert
with check ( bucket_id = 'promociones' and auth.role() = 'authenticated' );

-- Permitir que usuarios AUTENTICADOS (Admins) actualicen imágenes
create policy "Admin Actualizar Imagenes Promociones"
on storage.objects for update
with check ( bucket_id = 'promociones' and auth.role() = 'authenticated' );

-- Permitir que usuarios AUTENTICADOS (Admins) eliminen imágenes
create policy "Admin Eliminar Imagenes Promociones"
on storage.objects for delete
using ( bucket_id = 'promociones' and auth.role() = 'authenticated' );

-- 4. Asegurarse que la tabla 'promociones' existe y tiene la estructura correcta
create table if not exists public.promociones (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  descripcion text,
  imagen_url text,
  color_fondo text default 'bg-brand-orange',
  texto_boton text default 'Ver Oferta',
  link_boton text default '/catalogo',
  activo boolean default true,
  orden integer default 0,
  created_at timestamp default now()
);

-- Habilitar RLS para la tabla promociones
alter table public.promociones enable row level security;

-- Políticas de la tabla promociones
create policy "Public view promociones" on public.promociones for select using (true);
create policy "Admin manage promociones" on public.promociones for all using (true) with check (true);
