-- =============================================================================
-- NUEVO MÓDULO: Compras conectadas a Proveedores
-- Objetivo: hoy compras_producto no tiene ninguna relación con proveedores,
-- a pesar de que existe toda una página /admin/proveedores para gestionarlos.
-- Esto agrega la columna proveedor_id para poder saber qué compraste a quién.
-- =============================================================================

ALTER TABLE public.compras_producto
ADD COLUMN IF NOT EXISTS proveedor_id uuid REFERENCES public.proveedores(id);

CREATE INDEX IF NOT EXISTS idx_compras_producto_proveedor_id
ON public.compras_producto(proveedor_id);

-- Las compras existentes (registradas antes de este cambio) quedan con
-- proveedor_id = NULL. Esto es esperado: no hay forma de saber retroactivamente
-- a qué proveedor correspondían. Las nuevas compras desde /admin/compras sí
-- lo registrarán correctamente.
