-- COPIA Y PEGA ESTO EN EL EDITOR SQL DE SUPABASE

-- 1. Crear el bucket de almacenamiento para imágenes
insert into storage.buckets (id, name, public) 
values ('imagenes-zapatos', 'imagenes-zapatos', true)
on conflict (id) do nothing;

-- 2. Configurar políticas de acceso (Seguridad)

-- Permitir acceso PÚBLICO para ver las imágenes (SELECT)
create policy "Cualquiera puede ver imagenes"
on storage.objects for select
using ( bucket_id = 'imagenes-zapatos' );

-- Permitir a usuarios autenticados subir imágenes (INSERT)
create policy "Usuarios autenticados pueden subir imagenes"
on storage.objects for insert
with check ( bucket_id = 'imagenes-zapatos' and auth.role() = 'authenticated' );

-- Permitir a usuarios autenticados actualizar imágenes (UPDATE)
create policy "Usuarios autenticados pueden actualizar imagenes"
on storage.objects for update
using ( bucket_id = 'imagenes-zapatos' and auth.role() = 'authenticated' );

-- Permitir a usuarios autenticados eliminar imágenes (DELETE)
create policy "Usuarios autenticados pueden borrar imagenes"
on storage.objects for delete
using ( bucket_id = 'imagenes-zapatos' and auth.role() = 'authenticated' );
