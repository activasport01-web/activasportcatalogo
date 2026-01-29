-- Script de Reparación de Tablas Faltantes
-- Ejecuta esto en el Editor SQL de Supabase para crear las tablas que faltan.

-- 1. Tabla: Géneros
create table if not exists public.generos (
  id uuid default gen_random_uuid() primary key,
  nombre text not null, -- Hombre, Mujer, Unisex
  slug text,
  orden integer default 0,
  activa boolean default true,
  created_at timestamp default now()
);

-- Habilitar RLS
alter table public.generos enable row level security;
create policy "Public view generos" on public.generos for select using (true);
create policy "Admin manage generos" on public.generos for all using (true) with check (true);

-- 2. Tabla: Grupos de Talla
create table if not exists public.grupos_tallas (
  id uuid default gen_random_uuid() primary key,
  nombre text not null, -- Niño, Juvenil, Adulto
  rango_tallas text, -- Ej: 18-25
  orden integer default 0,
  activa boolean default true,
  created_at timestamp default now()
);

-- Habilitar RLS
alter table public.grupos_tallas enable row level security;
create policy "Public view grupos_tallas" on public.grupos_tallas for select using (true);
create policy "Admin manage grupos_tallas" on public.grupos_tallas for all using (true) with check (true);

-- 3. Tabla: Subcategorías (Tipos de Planta) - Por si acaso
create table if not exists public.subcategorias (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  categoria_relacionada text,
  imagen_url text,
  activa boolean default true,
  orden integer default 0,
  created_at timestamp default now()
);

alter table public.subcategorias enable row level security;
create policy "Public view subcategorias" on public.subcategorias for select using (true);
create policy "Admin manage subcategorias" on public.subcategorias for all using (true) with check (true);

-- 4. Datos Iniciales (Opcional - Ejecutar si quieres tener datos base)
insert into public.generos (nombre, slug, orden) values 
('Hombre', 'hombre', 1),
('Mujer', 'mujer', 2),
('Unisex', 'unisex', 3)
on conflict do nothing;

insert into public.grupos_tallas (nombre, rango_tallas, orden) values 
('Niño', '18-29', 1),
('Juvenil', '30-35', 2),
('Adulto', '36-45', 3)
on conflict do nothing;
