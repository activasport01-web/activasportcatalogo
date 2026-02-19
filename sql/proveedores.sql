-- Tabla de Proveedores
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS proveedores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    contacto TEXT,          -- Nombre de la persona de contacto
    telefono TEXT,
    email TEXT,
    pais TEXT DEFAULT 'Bolivia',
    ciudad TEXT,
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON proveedores (nombre);
