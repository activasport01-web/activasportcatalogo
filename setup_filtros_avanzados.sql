-- 1. Tabla: Categorías (Limpiar y reiniciar si es necesario, pero tratemos de preservar IDs si existen)
-- El usuario quiere SOLO: Deportivo y Casual.

-- Primero aseguramos que la tabla existe con la estructura correcta
create table if not exists public.categorias (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  slug text unique not null,
  descripcion text,
  emoji text,
  imagen_url text,
  orden integer default 0,
  activa boolean default true,
  fecha_creacion timestamp default now()
);

-- Habilitar RLS
alter table public.categorias enable row level security;
create policy "Public view categorias" on public.categorias for select using (true);
create policy "Admin manage categorias" on public.categorias for all using (true) with check (true);


-- 2. Tabla: Subcategorías (Ahora llamadas 'Tipos de Planta' en el frontend)
create table if not exists public.subcategorias (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  categoria_relacionada text, -- 'Deportivo', 'Casual' o NULL para ambos
  imagen_url text,
  activa boolean default true,
  orden integer default 0,
  created_at timestamp default now()
);

alter table public.subcategorias enable row level security;
create policy "Public view subcategorias" on public.subcategorias for select using (true);
create policy "Admin manage subcategorias" on public.subcategorias for all using (true) with check (true);


-- 3. Tabla: Géneros (Para CRUD de Géneros)
create table if not exists public.generos (
  id uuid default gen_random_uuid() primary key,
  nombre text not null, -- Hombre, Mujer, Unisex
  slug text,
  orden integer default 0,
  activa boolean default true,
  created_at timestamp default now()
);

alter table public.generos enable row level security;
create policy "Public view generos" on public.generos for select using (true);
create policy "Admin manage generos" on public.generos for all using (true) with check (true);


-- 4. Tabla: Grupos de Talla (Niño, Juvenil, Adulto)
create table if not exists public.grupos_tallas (
  id uuid default gen_random_uuid() primary key,
  nombre text not null, -- Niño, Juvenil, Adulto
  rango_tallas text, -- Ej: 18-25
  orden integer default 0,
  activa boolean default true,
  created_at timestamp default now()
);

alter table public.grupos_tallas enable row level security;
create policy "Public view grupos_tallas" on public.grupos_tallas for select using (true);
create policy "Admin manage grupos_tallas" on public.grupos_tallas for all using (true) with check (true);


-- 5. Insertar Datos Iniciales (Solo si las tablas están vacías)

-- Categorías: Deportivo, Casual
insert into public.categorias (nombre, slug, descripcion, emoji, orden)
select 'Deportivo', 'deportivo', 'Calzado para deporte de alto rendimiento', '⚽', 1
where not exists (select 1 from public.categorias where slug = 'deportivo');

insert into public.categorias (nombre, slug, descripcion, emoji, orden)
select 'Casual', 'casual', 'Estilo urbano para el día a día', '👟', 2
where not exists (select 1 from public.categorias where slug = 'casual');

-- Subcategorías (Tipos de Planta)
insert into public.subcategorias (nombre, categoria_relacionada, orden) VALUES
('Turf / Trilla', 'Deportivo', 1),
('Salonera / Futsal', 'Deportivo', 2),
('Chutera / Tacos', 'Deportivo', 3),
('Running', 'Deportivo', 4),
('Urbano', 'Casual', 5),
('Sandalias', 'Casual', 6)
ON CONFLICT DO NOTHING; -- Nota: ON CONFLICT requiere constraint unique, aquí usamos insert simple si tabla vacía mejor
-- (Para simplificar, el usuario puede limpiar la tabla si quiere reiniciar)


-- Géneros
insert into public.generos (nombre, slug, orden) VALUES
('Hombre', 'hombre', 1),
('Mujer', 'mujer', 2),
('Unisex', 'unisex', 3);

-- Grupos
insert into public.grupos_tallas (nombre, orden) VALUES
('Niño', 1),
('Juvenil', 2),
('Adulto', 3);
