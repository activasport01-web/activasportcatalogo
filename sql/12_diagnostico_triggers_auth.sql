-- =============================================================================
-- DIAGNÓSTICO 2: Triggers en auth.users + tiempo real de la consulta de login
-- Objetivo: el login tarda ~20+ segundos en completar (no se cuelga para siempre,
-- pero sí mucho). RLS ya fue descartado (deshabilitado en las 4 tablas).
--
-- Sospecha: un trigger en auth.users que se dispara en cada login (Supabase
-- actualiza auth.users.last_sign_in_at en cada signInWithPassword) podría estar
-- ejecutando algo lento (ej: handle_new_user mal configurado para correr también
-- en UPDATE, no solo INSERT).
-- =============================================================================

-- 1. Ver todos los triggers en auth.users (incluye el evento: INSERT, UPDATE, etc.)
SELECT
    trigger_name,
    event_manipulation,   -- INSERT, UPDATE, DELETE
    action_timing,        -- BEFORE, AFTER
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- 2. Medir el tiempo REAL de la consulta que usa el login.
--    Reemplaza el UUID por tu propio id de usuario admin (lo puedes obtener
--    corriendo: SELECT id FROM auth.users WHERE email = 'tu_correo@ejemplo.com';)
-- EXPLAIN ANALYZE
-- SELECT u.id, u.nombre_completo, u.rol_id, u.activo, r.nombre
-- FROM usuarios u
-- LEFT JOIN roles r ON r.id = u.rol_id
-- WHERE u.id = 'REEMPLAZA-CON-TU-UUID'::uuid;

-- 3. Ver cuántas conexiones/queries activas hay en este momento (por si hay bloqueos)
SELECT pid, state, wait_event_type, wait_event, query, query_start
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start ASC;
