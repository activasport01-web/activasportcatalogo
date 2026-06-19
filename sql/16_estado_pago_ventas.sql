-- =============================================================================
-- NUEVO: Estado de pago en ventas (pagado / a crédito)
-- Objetivo: hoy no hay forma de saber qué ventas quedaron pendientes de cobro.
-- Se agrega a movimientos_kardex porque ahí vive cada línea de venta (no existe
-- una tabla "ventas" separada — cada venta multi-línea genera varias filas
-- de tipo VENTA en este kardex).
-- =============================================================================

ALTER TABLE public.movimientos_kardex
ADD COLUMN IF NOT EXISTS estado_pago text DEFAULT 'pagado'
CHECK (estado_pago IN ('pagado', 'credito'));

-- Las filas existentes (ventas registradas antes de este cambio) quedan
-- marcadas como 'pagado' por defecto, ya que no hay forma de saber
-- retroactivamente cuáles fueron a crédito.

CREATE INDEX IF NOT EXISTS idx_movimientos_kardex_estado_pago
ON public.movimientos_kardex(estado_pago)
WHERE tipo = 'VENTA';
