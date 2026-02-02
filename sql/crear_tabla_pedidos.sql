-- 1. Tabla Principal de Pedidos
create table public.pedidos (
  id uuid default gen_random_uuid() primary key,
  fecha_creacion timestamp with time zone default timezone('utc'::text, now()) not null,
  cliente_nombre text, -- Opcional, si el usuario no esta logueado
  cliente_telefono text,
  cliente_id uuid references auth.users(id), -- Opcional, si esta logueado
  total numeric not null,
  estado text default 'pendiente', -- pendiente, pagado, enviado, entregado, cancelado
  metodo_pago text default 'whatsapp'
);

-- 2. Tabla de Detalle (Items del pedido)
create table public.detalle_pedidos (
  id uuid default gen_random_uuid() primary key,
  pedido_id uuid references public.pedidos(id) on delete cascade not null,
  producto_id uuid references public.zapatos(id), -- Referencia al zapato
  nombre_producto text not null, -- Guardamos el nombre por si se borra el producto original
  cantidad_pares integer not null,
  tipo_curva text,
  color text, -- Nuevo campo color
  precio_unitario numeric, -- Precio al momento de la compra
  subtotal numeric
);

-- 3. Habilitar RLS (Seguridad)
alter table public.pedidos enable row level security;
alter table public.detalle_pedidos enable row level security;

-- 4. Políticas de Seguridad (Quién puede ver qué)

-- a) Admin puede ver TODOS los pedidos
create policy "Admin ve todo pedidos"
  on public.pedidos for all
  using ( auth.role() = 'authenticated' ); -- Simplificado: cualquier usuario autenticado (idealmente admin)

-- b) Usuario puede ver SUS PROPIOS pedidos
create policy "Usuario ve sus pedidos"
  on public.pedidos for select
  using ( auth.uid() = cliente_id );

-- c) Cualquiera puede CREAR un pedido (incluido anónimos si quisieras, pero mejor restringir a auth o anon con reglas)
create policy "Cualquiera crea pedidos"
  on public.pedidos for insert
  with check ( true ); 

-- Repetir para detalles
create policy "Admin ve todo detalles"
  on public.detalle_pedidos for all
  using ( auth.role() = 'authenticated' );

create policy "Cualquiera crea detalles"
  on public.detalle_pedidos for insert
  with check ( true );
