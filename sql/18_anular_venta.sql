-- =============================================================================
-- NUEVO: Anular/revertir una venta
-- Objetivo: hoy si te equivocas registrando una venta no hay forma limpia de
-- corregirlo — el stock ya quedó descontado y solo se puede arreglar a mano.
--
-- Se usa una columna 'anulado' en vez de borrar la fila: mantiene el rastro
-- de auditoría (quién vendió, qué se anuló y cuándo), y permite excluir
-- estos movimientos de los totales de ingresos en Reportes.
-- =============================================================================

ALTER TABLE public.movimientos_kardex
ADD COLUMN IF NOT EXISTS anulado boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_movimientos_kardex_anulado
ON public.movimientos_kardex(anulado)
WHERE tipo = 'VENTA';
