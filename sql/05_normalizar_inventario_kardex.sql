-- =============================================================================
-- MIGRACIÓN: Normalización de inventario y kardex
-- Fecha: Abril 2026
-- Descripción:
--   1. Restructura la tabla 'inventario' con FK formal a 'zapatos'
--   2. Migra el stock actual de zapatos.stock_bultos → inventario
--   3. Crea la vista 'kardex' como alias de movimientos_kardex
--
-- ⚠️  IMPORTANTE: Ejecutar en el SQL Editor de Supabase
-- ⚠️  Los datos de la tabla 'zapatos' NO se modifican
-- ⚠️  Hacer backup antes de ejecutar en producción
-- =============================================================================


-- -----------------------------------------------------------------------------
-- PASO 1: Backup de seguridad (opcional pero recomendado)
-- Crea una copia de inventario antes de modificarla
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventario_backup_2026 AS
SELECT * FROM public.inventario;

-- Verificar cuántos registros tenía (debería ser 0 si estaba vacía)
-- SELECT COUNT(*) FROM inventario_backup_2026;


-- -----------------------------------------------------------------------------
-- PASO 2: Restructurar la tabla 'inventario'
-- La tabla vacía se elimina y se recrea con la estructura correcta
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS public.inventario;

CREATE TABLE public.inventario (
    id          uuid NOT NULL DEFAULT gen_random_uuid(),
    producto_id bigint NOT NULL,
    color       text,                        -- Color del par (puede ser null si no aplica)
    cantidad    integer NOT NULL DEFAULT 0,  -- Cantidad en stock (en bultos o pares, según el caso)
    ultima_actualizacion timestamp without time zone DEFAULT now(),

    CONSTRAINT inventario_pkey PRIMARY KEY (id),

    -- FK formal: si se elimina un zapato, se elimina su inventario también
    CONSTRAINT inventario_producto_fk
        FOREIGN KEY (producto_id)
        REFERENCES public.zapatos(id)
        ON DELETE CASCADE
);

-- Índice para búsquedas rápidas por producto
CREATE INDEX idx_inventario_producto_id ON public.inventario(producto_id);
CREATE INDEX idx_inventario_color ON public.inventario(color);

-- Comentarios descriptivos en la tabla
COMMENT ON TABLE public.inventario IS 'Stock por producto y color. Se relaciona formalmente con zapatos via FK.';
COMMENT ON COLUMN public.inventario.producto_id IS 'ID del producto en la tabla zapatos';
COMMENT ON COLUMN public.inventario.color IS 'Color del artículo. NULL = stock general sin distinción de color';
COMMENT ON COLUMN public.inventario.cantidad IS 'Cantidad en stock. La unidad depende del producto (bultos o pares)';


-- -----------------------------------------------------------------------------
-- PASO 3: Migrar el stock actual de zapatos.stock_bultos → inventario
-- Solo migra productos que tienen stock mayor a 0
-- Los productos con stock 0 o null no se migran (no tiene sentido)
-- -----------------------------------------------------------------------------
INSERT INTO public.inventario (producto_id, cantidad, ultima_actualizacion)
SELECT
    id,
    COALESCE(stock_bultos, 0),
    now()
FROM public.zapatos
WHERE stock_bultos IS NOT NULL
  AND stock_bultos > 0;

-- Verificar cuántos productos se migraron:
-- SELECT COUNT(*) FROM inventario;


-- -----------------------------------------------------------------------------
-- PASO 4: Crear la vista 'kardex'
-- En lugar de tener dos tablas que hacen lo mismo (kardex y movimientos_kardex),
-- 'kardex' se convierte en una vista que muestra movimientos_kardex de forma
-- más amigable, con el nombre del producto incluido.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS public.kardex;  -- Eliminar la tabla vacía

CREATE OR REPLACE VIEW public.kardex AS
SELECT
    mk.id,
    mk.producto_id,
    z.nombre                    AS producto_nombre,
    z.marca                     AS producto_marca,
    mk.tipo,                    -- 'ENTRADA', 'VENTA', 'AJUSTE', etc.
    mk.cantidad,
    mk.precio_total,
    mk.fecha
FROM public.movimientos_kardex mk
LEFT JOIN public.zapatos z ON z.id = mk.producto_id
ORDER BY mk.fecha DESC;

COMMENT ON VIEW public.kardex IS 'Vista del kardex completo con nombre de producto. Fuente: movimientos_kardex.';


-- -----------------------------------------------------------------------------
-- RESULTADO FINAL:
-- ✅ inventario  → tabla real, con FK a zapatos, stock migrado
-- ✅ kardex      → vista de movimientos_kardex con nombre de producto
-- ✅ zapatos     → sin cambios, todos los productos intactos
-- ✅ movimientos_kardex → sin cambios, sigue siendo la fuente de verdad
-- -----------------------------------------------------------------------------
