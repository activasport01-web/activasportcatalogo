-- =============================================================================
-- ACTIVACIÓN: Tabla inventario como tracker por sucursal
-- Fecha: Junio 2026
-- Descripción:
--   La tabla 'inventario' se usa ahora para registrar el stock de cada producto
--   distribuido por sucursal o bodega física.
--
--   Estructura utilizada:
--     - producto_id  → FK a zapatos
--     - color        → nombre de la sucursal (ej: "Principal", "Bodega", "Sucursal 2")
--     - cantidad     → bultos en esa sucursal
--     - ultima_actualizacion → timestamp auto-actualizado
--     - usuario_id   → quién hizo el último cambio
--
--   El stock global sigue viviendo en zapatos.stock_bultos.
--   La tabla inventario es complementaria: muestra cómo se distribuye ese stock.
--
-- ⚠️  NO es necesario ejecutar nada para activar esto — la tabla ya existe.
-- ⚠️  Solo ejecutar si quieres limpiar datos obsoletos de la migración anterior.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- OPCIONAL: Limpiar datos de migración anterior (Abril 2026)
-- Si la tabla tiene filas de la migración 05_ que ya no son válidas,
-- puedes borrarlas con esto. Verifica primero con el SELECT.
-- -----------------------------------------------------------------------------

-- Ver qué hay actualmente en inventario:
-- SELECT i.*, z.nombre FROM public.inventario i
-- LEFT JOIN public.zapatos z ON z.id = i.producto_id
-- ORDER BY i.ultima_actualizacion DESC
-- LIMIT 50;

-- Si quieres limpiar todos los datos de migración y empezar desde cero:
-- TRUNCATE TABLE public.inventario;

-- Si quieres eliminar solo entradas sin nombre de sucursal (datos obsoletos):
-- DELETE FROM public.inventario WHERE color IS NULL OR color = '';


-- -----------------------------------------------------------------------------
-- OPCIONAL: Eliminar la tabla de backup (es solo un snapshot vacío de Abril 2026)
-- -----------------------------------------------------------------------------
-- DROP TABLE IF EXISTS public.inventario_backup_2026;


-- -----------------------------------------------------------------------------
-- ÍNDICES (ya deberían existir de la migración anterior, pero por si acaso)
-- -----------------------------------------------------------------------------
-- CREATE INDEX IF NOT EXISTS idx_inventario_producto_id ON public.inventario(producto_id);


-- =============================================================================
-- RESULTADO:
-- ✅ inventario       → activa, usada para stock por sucursal desde /admin/inventario
-- ✅ inventario.color → contiene el nombre de la sucursal (Principal, Bodega, etc.)
-- ✅ zapatos.stock_bultos → sigue siendo el stock global total
-- =============================================================================
