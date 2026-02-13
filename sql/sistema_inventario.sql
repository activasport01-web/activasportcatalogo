-- SISTEMA DE CONTROL DE INVENTARIO (Integrado a Productos)
-- Ejecuta este script en Supabase para habilitar el control de stock

-- 1. TABLA DE STOCK ACTUAL (Por Variante/Color)
-- Esta tabla guarda cuántas cajas tienes exactamente de cada "Zapato + Color"
create table public.inventario (
  id uuid default gen_random_uuid() primary key,
  producto_id bigint references public.zapatos(id) on delete cascade not null,
  color text not null, -- Ej: "Negro", "Blanco", "Rojo"
  cantidad integer default 0 check (cantidad >= 0), -- Stock actual (Cajas)
  ubicacion text, -- Opcional: "Estante A", "Bodega"
  updated_at timestamp with time zone default now(),
  
  -- Restricción: No puede haber dos registros del mismo zapato y color
  constraint unique_stock_producto_color unique (producto_id, color)
);

-- 2. TABLA KARDEX (Historial de Movimientos)
-- Esta es la parte "Inteligente": Registra cada vez que entra o sale mercadería
create table public.kardex (
  id uuid default gen_random_uuid() primary key,
  producto_id bigint references public.zapatos(id) on delete cascade not null,
  color text, 
  tipo_movimiento text check (tipo_movimiento in ('ENTRADA', 'SALIDA', 'AJUSTE', 'VENTA')),
  cantidad integer not null, -- Cuánto se movió
  stock_resultante integer, -- Cuánto quedó después del movimiento (Snapshot)
  motivo text, -- Ej: "Compra Factura #123", "Venta Web", "Merma"
  usuario_id uuid references auth.users(id),
  fecha timestamp with time zone default now()
);

-- 3. SEGURIDAD (RLS)
alter table public.inventario enable row level security;
alter table public.kardex enable row level security;

-- Políticas: Solo usuarios autenticados (Admins) pueden ver y gestionar esto
create policy "Admin gestiona inventario" on public.inventario 
  for all using (auth.role() = 'authenticated');

create policy "Admin ve kardex" on public.kardex 
  for all using (auth.role() = 'authenticated');

-- 4. INDICES (Para que sea rápido cuando tengas miles de movimientos)
create index idx_inventario_producto on public.inventario(producto_id);
create index idx_kardex_producto on public.kardex(producto_id);
create index idx_kardex_fecha on public.kardex(fecha desc);
