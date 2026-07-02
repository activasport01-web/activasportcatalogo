-- Corrige el tipo de retorno de admin_listar_usuarios().
-- auth.users.email es "character varying", no "text".
-- Sin el cast explícito PostgreSQL lanza:
--   "structure of query does not match function result type"
CREATE OR REPLACE FUNCTION admin_listar_usuarios()
RETURNS TABLE (
  id              uuid,
  nombre_completo text,
  email           text,
  rol_id          uuid,
  rol_nombre      text,
  activo          boolean,
  fecha_creacion  timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT es_administrador() THEN
    RAISE EXCEPTION 'Acceso denegado: se requiere rol Administrador';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.nombre_completo::text,
    au.email::text,
    u.rol_id,
    r.nombre::text   AS rol_nombre,
    u.activo,
    u.fecha_creacion
  FROM public.usuarios u
  JOIN auth.users au ON u.id = au.id
  LEFT JOIN public.roles r ON u.rol_id = r.id
  ORDER BY u.fecha_creacion DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_listar_usuarios() TO authenticated;
