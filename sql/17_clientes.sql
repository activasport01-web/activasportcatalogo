-- =============================================================================
-- NUEVO: Registro de clientes recurrentes
-- Objetivo: hoy el nombre del cliente se escribe a mano en cada venta (texto
-- libre), sin historial real por cliente ni forma de saber "qué le he vendido
-- antes a Margarita" o "cuánto me debe en total".
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.clientes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nombre text NOT NULL,
    telefono text,
    notas text,
    activo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    usuario_id uuid REFERENCES public.usuarios(id),
    CONSTRAINT clientes_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON public.clientes(nombre);

-- Conectar las ventas (movimientos_kardex) con el cliente que las hizo.
-- Se mantiene nullable: las ventas sin cliente registrado (texto libre antiguo,
-- o ventas rápidas sin cliente recurrente) siguen funcionando igual.
ALTER TABLE public.movimientos_kardex
ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES public.clientes(id);

CREATE INDEX IF NOT EXISTS idx_movimientos_kardex_cliente_id
ON public.movimientos_kardex(cliente_id);
