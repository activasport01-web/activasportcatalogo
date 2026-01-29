-- COPIA Y PEGA ESTO EN SQL EDITOR DE SUPABASE PARA ARREGLAR LA TABLA ZAPATOS

-- 1. Aseguramos que existan todas las columnas necesarias
alter table zapatos 
add column if not exists precio numeric default 0,
add column if not exists tallas text[] default '{}',
add column if not exists colores text[] default '{}',
add column if not exists etiquetas text[] default '{}',
add column if not exists origen text default 'Nacional',
add column if not exists imagen_hover text,
add column if not exists descripcion text;

-- 2. Refrescamos el caché del esquema (truco: analizando la tabla)
analyze zapatos;
