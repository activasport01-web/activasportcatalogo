-- =============================================================================
-- SEGURIDAD: Activar RLS en usuarios, roles, permisos, roles_permisos
-- Objetivo: estas 4 tablas tienen RLS DESACTIVADO (lo confirmamos con una
-- consulta de diagnóstico). Esto significa que CUALQUIERA con la clave anon
-- pública (que siempre va embebida en el código del navegador, es pública
-- por diseño) puede leer/escribir estas tablas directo contra la API REST
-- de Supabase, sin pasar por tu aplicación ni necesitar estar logueado.
--
-- Se revisó el código completo del proyecto: solo AuthContext.tsx lee estas
-- tablas (con SELECT), nunca con INSERT/UPDATE/DELETE desde el cliente. No
-- hay ninguna página admin que gestione usuarios/roles desde el navegador
-- (se hace directo en el dashboard de Supabase). Por eso las políticas de
-- abajo solo habilitan SELECT — cualquier escritura seguirá bloqueada para
-- el cliente, que es justo lo que se necesita.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- USUARIOS: cada usuario autenticado solo puede ver SU PROPIA fila.
-- Esto es lo que usa AuthContext.loadProfile() (select ... where id = userId).
-- -----------------------------------------------------------------------------
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_select_propio" ON public.usuarios
FOR SELECT
USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- ROLES: catálogo de nombres de rol (ej. "Administrador", "Empleado").
-- No es información sensible, pero igual se exige estar autenticado para leerla.
-- -----------------------------------------------------------------------------
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_select_autenticado" ON public.roles
FOR SELECT
USING (auth.role() = 'authenticated');

-- -----------------------------------------------------------------------------
-- PERMISOS: catálogo de códigos de permiso (ej. "gestionar_catalogo").
-- -----------------------------------------------------------------------------
ALTER TABLE public.permisos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permisos_select_autenticado" ON public.permisos
FOR SELECT
USING (auth.role() = 'authenticated');

-- -----------------------------------------------------------------------------
-- ROLES_PERMISOS: relación rol → permisos. Necesaria para que AuthContext
-- calcule qué puede hacer cada usuario según su rol.
-- -----------------------------------------------------------------------------
ALTER TABLE public.roles_permisos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_permisos_select_autenticado" ON public.roles_permisos
FOR SELECT
USING (auth.role() = 'authenticated');

-- =============================================================================
-- IMPORTANTE: no se crean políticas de INSERT/UPDATE/DELETE a propósito.
-- Sin una política para esos comandos, quedan bloqueados por defecto para
-- 'authenticated' y 'anon'. Si en el futuro agregas una página admin que
-- necesite crear/editar usuarios o roles desde el navegador, vas a necesitar
-- agregar políticas específicas para eso entonces (y probablemente restringir
-- esas operaciones solo a usuarios con rol 'Administrador').
-- =============================================================================
