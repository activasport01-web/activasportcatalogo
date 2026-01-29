-- Tabla para gestionar las promociones/ofertas tipo "Carrusel Pequeño"
create table if not exists promociones (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  descripcion text,
  imagen_url text, -- URL de la imagen del regalo o icono
  color_fondo text default 'bg-orange-500', -- Clase de Tailwind o Hex
  texto_boton text default 'Ver Oferta',
  link_boton text default '/catalogo',
  activo boolean default true,
  orden integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar seguridad
alter table promociones enable row level security;

-- Política: Cualquiera puede ver las promociones activas
create policy "Promociones son publicas"
  on promociones for select
  using (true);

-- Política: Solo admin puede editar (asumiendo autenticación de admin existente)
-- Por ahora permitimos todo para facilitar el desarrollo inicial, luego restringir
create policy "Admin gestion total"
  on promociones for all
  using (true)
  with check (true);

-- Insertar datos de ejemplo (La promo que pidió el cliente)
insert into promociones (titulo, descripcion, imagen_url, color_fondo, texto_boton, link_boton, orden)
values 
(
  '¡Promo Mayorista!', 
  'Por la compra de 1 docena de zapatillas, llévate 1 docena de medias de regalo 🎁', 
  'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&q=80&w=300&h=300', -- Foto de medias genérica
  'from-orange-500 to-red-600', -- Gradiente
  'Aprovechar',
  '/catalogo',
  1
),
(
  'Envío Gratis 🚚', 
  'En pedidos superiores a 3 docenas a todo el país.', 
  null,
  'from-blue-600 to-blue-800',
  'Ver detalles',
  '/catalogo',
  2
);
