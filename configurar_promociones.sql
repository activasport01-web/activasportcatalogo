-- Crear bucket para imágenes de promociones si no existe
insert into storage.buckets (id, name, public)
values ('promociones', 'promociones', true)
on conflict (id) do nothing;

-- Política de almacenamiento para acceso público
create policy "Acceso publico promociones"
  on storage.objects for select
  using ( bucket_id = 'promociones' );

-- Política de almacenamiento para insert (solo autenticados)
create policy "Auth upload promociones"
  on storage.objects for insert
  with check ( bucket_id = 'promociones' and auth.role() = 'authenticated' );

-- Política de almacenamiento para update (solo autenticados)
create policy "Auth update promociones"
  on storage.objects for update
  using ( bucket_id = 'promociones' and auth.role() = 'authenticated' );

-- Política de almacenamiento para delete (solo autenticados)
create policy "Auth delete promociones"
  on storage.objects for delete
  using ( bucket_id = 'promociones' and auth.role() = 'authenticated' );

-- Asegurar que la tabla promociones tenga los campos correctos
-- (En caso de que ya se haya creado con el script anterior, esto es idempotente o altera)
alter table promociones 
add column if not exists imagen_fondo_url text; -- Para la imagen grande de fondo si se desea

-- Si queremos que el usuario "seleccione" un producto, podemos guardar el ID
alter table promociones
add column if not exists producto_relacionado_id uuid references zapatos(id);
