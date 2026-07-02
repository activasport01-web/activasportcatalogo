-- =============================================================================
-- FUNCIONES ADMIN: acceso privilegiado a usuarios, roles y permisos
-- Todas son SECURITY DEFINER (corren como postgres, bypass RLS) pero
-- verifican internamente que el caller sea un Administrador activo.
-- =============================================================================

-- Helper interno que verifica si el usuario actual es Administrador activo
CREATE OR REPLACE FUNCTION es_administrador()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios u
    JOIN public.roles r ON u.rol_id = r.id
    WHERE u.id = auth.uid() AND r.nombre = 'Administrador' AND u.activo = true
  );
END;
$$;

-- =============================================================================
-- USUARIOS
-- =============================================================================

-- Lista todos los usuarios con email (de auth.users) y nombre de rol
CREATE OR REPLACE FUNCTION admin_listar_usuarios()
RETURNS TABLE (
  id            uuid,
  nombre_completo text,
  email         text,
  rol_id        uuid,
  rol_nombre    text,
  activo        boolean,
  fecha_creacion timestamptz
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
    u.nombre_completo,
    au.email,
    u.rol_id,
    r.nombre  AS rol_nombre,
    u.activo,
    u.fecha_creacion
  FROM public.usuarios u
  JOIN auth.users au ON u.id = au.id
  LEFT JOIN public.roles r ON u.rol_id = r.id
  ORDER BY u.fecha_creacion DESC;
END;
$$;

-- Actualiza nombre, rol y estado de un usuario
CREATE OR REPLACE FUNCTION admin_actualizar_usuario(
  p_id             uuid,
  p_nombre_completo text,
  p_rol_id         uuid,
  p_activo         boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT es_administrador() THEN
    RAISE EXCEPTION 'Acceso denegado: se requiere rol Administrador';
  END IF;
  IF p_id = auth.uid() AND NOT p_activo THEN
    RAISE EXCEPTION 'No puedes desactivar tu propia cuenta';
  END IF;

  UPDATE public.usuarios
  SET nombre_completo = p_nombre_completo,
      rol_id          = p_rol_id,
      activo          = p_activo
  WHERE id = p_id;
END;
$$;

-- =============================================================================
-- ROLES
-- =============================================================================

CREATE OR REPLACE FUNCTION admin_crear_rol(p_nombre text, p_descripcion text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT es_administrador() THEN RAISE EXCEPTION 'Acceso denegado'; END IF;
  INSERT INTO public.roles (nombre, descripcion)
  VALUES (p_nombre, p_descripcion)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_actualizar_rol(p_id uuid, p_nombre text, p_descripcion text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT es_administrador() THEN RAISE EXCEPTION 'Acceso denegado'; END IF;
  UPDATE public.roles SET nombre = p_nombre, descripcion = p_descripcion WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_eliminar_rol(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT es_administrador() THEN RAISE EXCEPTION 'Acceso denegado'; END IF;
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE rol_id = p_id) THEN
    RAISE EXCEPTION 'No se puede eliminar: hay usuarios asignados a este rol';
  END IF;
  DELETE FROM public.roles_permisos WHERE rol_id = p_id;
  DELETE FROM public.roles WHERE id = p_id;
END;
$$;

-- =============================================================================
-- PERMISOS
-- =============================================================================

CREATE OR REPLACE FUNCTION admin_crear_permiso(p_codigo text, p_descripcion text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT es_administrador() THEN RAISE EXCEPTION 'Acceso denegado'; END IF;
  INSERT INTO public.permisos (codigo, descripcion)
  VALUES (p_codigo, p_descripcion)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_actualizar_permiso(p_id uuid, p_codigo text, p_descripcion text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT es_administrador() THEN RAISE EXCEPTION 'Acceso denegado'; END IF;
  UPDATE public.permisos SET codigo = p_codigo, descripcion = p_descripcion WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_eliminar_permiso(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT es_administrador() THEN RAISE EXCEPTION 'Acceso denegado'; END IF;
  DELETE FROM public.roles_permisos WHERE permiso_id = p_id;
  DELETE FROM public.permisos WHERE id = p_id;
END;
$$;

-- =============================================================================
-- ASIGNACIÓN DE PERMISOS A ROLES
-- =============================================================================

CREATE OR REPLACE FUNCTION admin_asignar_permiso(p_rol_id uuid, p_permiso_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT es_administrador() THEN RAISE EXCEPTION 'Acceso denegado'; END IF;
  INSERT INTO public.roles_permisos (rol_id, permiso_id)
  VALUES (p_rol_id, p_permiso_id)
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION admin_remover_permiso(p_rol_id uuid, p_permiso_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT es_administrador() THEN RAISE EXCEPTION 'Acceso denegado'; END IF;
  DELETE FROM public.roles_permisos WHERE rol_id = p_rol_id AND permiso_id = p_permiso_id;
END;
$$;

-- =============================================================================
-- PERMISOS DE EJECUCIÓN (solo usuarios autenticados pueden llamar estas funciones)
-- =============================================================================
GRANT EXECUTE ON FUNCTION es_administrador()                                          TO authenticated;
GRANT EXECUTE ON FUNCTION admin_listar_usuarios()                                     TO authenticated;
GRANT EXECUTE ON FUNCTION admin_actualizar_usuario(uuid, text, uuid, boolean)         TO authenticated;
GRANT EXECUTE ON FUNCTION admin_crear_rol(text, text)                                 TO authenticated;
GRANT EXECUTE ON FUNCTION admin_actualizar_rol(uuid, text, text)                      TO authenticated;
GRANT EXECUTE ON FUNCTION admin_eliminar_rol(uuid)                                    TO authenticated;
GRANT EXECUTE ON FUNCTION admin_crear_permiso(text, text)                             TO authenticated;
GRANT EXECUTE ON FUNCTION admin_actualizar_permiso(uuid, text, text)                  TO authenticated;
GRANT EXECUTE ON FUNCTION admin_eliminar_permiso(uuid)                                TO authenticated;
GRANT EXECUTE ON FUNCTION admin_asignar_permiso(uuid, uuid)                           TO authenticated;
GRANT EXECUTE ON FUNCTION admin_remover_permiso(uuid, uuid)                           TO authenticated;
