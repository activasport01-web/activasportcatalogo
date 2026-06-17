-- =============================================================================
-- DIAGNÓSTICO: Políticas RLS en usuarios, roles, roles_permisos
-- Objetivo: identificar por qué la consulta de login/perfil se queda colgada
-- (login funciona pero el botón "Accediendo..." nunca termina)
--
-- Ejecutar en el SQL Editor de Supabase y compartir el resultado
-- =============================================================================

-- 1. Ver todas las políticas activas en las tablas relevantes
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,            -- SELECT, INSERT, UPDATE, DELETE, ALL
    qual,           -- condición USING (la que filtra filas visibles)
    with_check      -- condición WITH CHECK (para insert/update)
FROM pg_policies
WHERE tablename IN ('usuarios', 'roles', 'roles_permisos', 'permisos')
ORDER BY tablename, policyname;

-- 2. Confirmar que RLS está habilitado en estas tablas
SELECT
    relname AS tabla,
    relrowsecurity AS rls_habilitado
FROM pg_class
WHERE relname IN ('usuarios', 'roles', 'roles_permisos', 'permisos');

-- 3. Medir cuánto tarda realmente la consulta que usa el login
-- (reemplaza el UUID por el id real de un usuario admin para probar)
-- EXPLAIN ANALYZE
-- SELECT id, nombre_completo, rol_id, activo, roles(nombre)
-- FROM usuarios
-- WHERE id = 'REEMPLAZA-CON-UN-UUID-REAL'::uuid;

-- 4. Buscar funciones que las políticas podrían estar usando
-- (si una policy llama a una función que vuelve a consultar 'usuarios',
--  eso causa lentitud extrema o recursión)
SELECT
    proname AS funcion,
    prosrc AS definicion
FROM pg_proc
WHERE prosrc ILIKE '%usuarios%'
   OR prosrc ILIKE '%roles_permisos%';
