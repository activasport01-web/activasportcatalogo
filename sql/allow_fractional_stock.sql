-- MODIFICAR TABLAS PARA ACEPTAR DECIMALES (Medias Docenas)
-- Permite vender 0.5, 1.5 cajas, etc.

-- 1. Modificar tabla stock zapatos
ALTER TABLE public.zapatos 
ALTER COLUMN stock_bultos TYPE numeric(10, 2);

-- 2. Modificar tabla historial movimientos
ALTER TABLE public.movimientos_kardex 
ALTER COLUMN cantidad TYPE numeric(10, 2);
