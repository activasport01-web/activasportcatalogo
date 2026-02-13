-- SISTEMA DE CONTROL DE INVENTARIO POR BULTOS (DOCENAS/MEDIAS)
-- Adaptado para venta mayorista de cajas cerradas surtidas.

-- 1. Añadir columna stock_bultos a la tabla Zapatos (Simplificado)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zapatos' AND column_name = 'stock_bultos') THEN
        ALTER TABLE public.zapatos ADD COLUMN stock_bultos integer DEFAULT 0;
    END IF;
END
$$;

-- 2. Tabla MOVIMIENTOS SIMPLIFICADA (Ventas Rápidas)
-- Registra cada salida de mercadería con precio y detalle
CREATE TABLE IF NOT EXISTS public.movimientos_kardex (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id bigint REFERENCES public.zapatos(id) ON DELETE SET NULL,
  tipo text CHECK (tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE', 'VENTA')), -- VENTA resta, ENTRADA suma
  cantidad integer NOT NULL, -- Cantidad de BULTOS/CAJAS
  precio_total numeric, -- Cuánto cobraste por esa venta (Ej: 800 Bs)
  detalle text, -- Ej: "Cliente Juan", "Compra Fábrica"
  usuario_id uuid REFERENCES auth.users(id),
  fecha timestamp with time zone DEFAULT now()
);

-- 3. SEGURIDAD
ALTER TABLE public.movimientos_kardex ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gestiona movimientos" ON public.movimientos_kardex 
FOR ALL USING (auth.role() = 'authenticated');

-- 4. INDICES
CREATE INDEX IF NOT EXISTS idx_kardex_producto ON public.movimientos_kardex(producto_id);
CREATE INDEX IF NOT EXISTS idx_kardex_fecha ON public.movimientos_kardex(fecha DESC);
