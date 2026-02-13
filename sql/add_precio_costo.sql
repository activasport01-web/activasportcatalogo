-- Agregar columna de precio de costo (compra) a la tabla zapatos
ALTER TABLE public.zapatos 
ADD COLUMN IF NOT EXISTS precio_costo numeric DEFAULT 0;

-- Crear vista o función para reporte de ventas si es necesario, 
-- pero por ahora consultaremos directamente movimientos_kardex + zapatos
