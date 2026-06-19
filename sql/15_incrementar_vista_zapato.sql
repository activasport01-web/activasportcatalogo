-- =============================================================================
-- NUEVO: Función RPC para incrementar vistas de forma atómica
-- Objetivo: zapatos.vistas nunca se incrementaba en ningún lado del código,
-- a diferencia de zapatos.consultas que ya usa la función
-- incrementar_consulta_zapato() al hacer clic en "Hacer la consulta" (WhatsApp).
--
-- Esta función espeja ese mismo patrón pero para las vistas de la ficha
-- de producto (se llama una vez por cada carga de /producto/[id]).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.incrementar_vista_zapato(zapato_id bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.zapatos
    SET vistas = COALESCE(vistas, 0) + 1
    WHERE id = zapato_id;
END;
$$;
