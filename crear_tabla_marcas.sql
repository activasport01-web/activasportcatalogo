-- COPIA Y PEGA ESTO EN EL EDITOR SQL DE SUPABASE

-- 1. Crear la tabla de marcas
create table if not exists marcas (
  id uuid default gen_random_uuid() primary key,
  nombre text not null unique,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Habilitar permisos (para que puedas leer y escribir)
alter table marcas enable row level security;

-- Política para permitir acceso público total (para desarrollo)
create policy "Acceso total a marcas" 
on marcas for all 
using (true) 
with check (true);

-- 3. Insertar las marcas iniciales
insert into marcas (nombre) values 
('Golero'), 
('Grasep'), 
('Gasper'), 
('Buss'), 
('Bolka'),
('Nike'), 
('Adidas'), 
('Puma'), 
('Reebok'), 
('Jordan'), 
('Vans'), 
('Under Armour'), 
('New Balance'), 
('Converse'), 
('Fila'), 
('Skechers'), 
('Generico')
on conflict (nombre) do nothing;
