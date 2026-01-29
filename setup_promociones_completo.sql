-- 1. Crear la tabla 'promociones' si no existe
create table if not exists public.promociones (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  descripcion text,
  imagen_url text,
  color_fondo text default 'bg-gradient-to-r from-orange-500 to-red-600',
  texto_boton text default 'Ver Oferta',
  link_boton text default '/catalogo',
  activo boolean default true,
  orden integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Agregar columna para vincular con un producto (Corregido para BIGINT)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'promociones' and column_name = 'producto_relacionado_id') then
        alter table public.promociones 
        add column producto_relacionado_id bigint references public.zapatos(id);
    end if;
end $$;

-- 3. Habilitar seguridad (RLS)
alter table public.promociones enable row level security;

-- Políticas de seguridad para la tabla
create policy "Promociones publicas para ver" on public.promociones for select using (true);
create policy "Admin total control" on public.promociones for all using (true) with check (true);

-- 4. Configurar Almacenamiento (Storage) para las imágenes
insert into storage.buckets (id, name, public)
values ('promociones', 'promociones', true)
on conflict (id) do nothing;

-- Políticas de Storage
create policy "Publico ver imagenes promo" on storage.objects for select using ( bucket_id = 'promociones' );
create policy "Admin insertar imagenes promo" on storage.objects for insert with check ( bucket_id = 'promociones' );
create policy "Admin actualizar imagenes promo" on storage.objects for update using ( bucket_id = 'promociones' );
create policy "Admin borrar imagenes promo" on storage.objects for delete using ( bucket_id = 'promociones' );

-- 5. Insertar un dato de ejemplo inicial para que no esté vacío el panel
insert into public.promociones (titulo, descripcion, imagen_url, link_boton)
select '¡Gran Apertura!', 'Gestiona tus ofertas desde el panel administrativo.', null, '/admin/promociones'
where not exists (select 1 from public.promociones);
