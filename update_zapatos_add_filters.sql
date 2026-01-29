-- Add 'genero' and 'grupo_talla' columns to 'zapatos' table if they don't exist

DO $$
BEGIN
    -- Add genero column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zapatos' AND column_name = 'genero') THEN
        ALTER TABLE public.zapatos ADD COLUMN genero text;
    END IF;

    -- Add grupo_talla column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zapatos' AND column_name = 'grupo_talla') THEN
        ALTER TABLE public.zapatos ADD COLUMN grupo_talla text;
    END IF;
END $$;
