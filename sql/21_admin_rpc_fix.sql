-- =============================================================================
-- PARCHE: corrige es_administrador() y agrega reglas de protección
-- =============================================================================

-- 1. Corrige la comparación de nombre de rol a case-insensitive (ILIKE).
--    Si el rol en tu BD se llama 'administrador', 'Administrador', 'ADMINISTRADOR'
--    o cualquier variante, esta versión lo reconoce igual.
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
    WHERE u.id = auth.uid()
      AND lower(r.nombre) = 'administrador'
      AND u.activo = true
  );
END;
$$;

-- 2. Protege admin_eliminar_rol: bloquea borrar el rol 'Administrador'
CREATE OR REPLACE FUNCTION admin_eliminar_rol(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT es_administrador() THEN
    RAISE EXCEPTION 'Acceso denegado: se requiere rol Administrador';
  END IF;
  -- No se puede eliminar el rol Administrador del sistema
  IF EXISTS (SELECT 1 FROM public.roles WHERE id = p_id AND lower(nombre) = 'administrador') THEN
    RAISE EXCEPTION 'El rol Administrador no puede eliminarse';
  END IF;
  -- No se puede eliminar si hay usuarios asignados
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE rol_id = p_id) THEN
    RAISE EXCEPTION 'No se puede eliminar: hay usuarios asignados a este rol';
  END IF;
  DELETE FROM public.roles_permisos WHERE rol_id = p_id;
  DELETE FROM public.roles WHERE id = p_id;
END;
$$;

-- 3. Protege admin_actualizar_usuario: no permite que un admin se quite
--    su propio rol de Administrador (para no bloquearse a sí mismo)
CREATE OR REPLACE FUNCTION admin_actualizar_usuario(
  p_id              uuid,
  p_nombre_completo text,
  p_rol_id          uuid,
  p_activo          boolean
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
  -- No puede desactivarse a sí mismo
  IF p_id = auth.uid() AND NOT p_activo THEN
    RAISE EXCEPTION 'No puedes desactivar tu propia cuenta';
  END IF;
  -- No puede quitarse el rol Administrador a sí mismo
  IF p_id = auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.roles
    WHERE id = p_rol_id AND lower(nombre) = 'administrador'
  ) THEN
    RAISE EXCEPTION 'No puedes cambiar tu propio rol de Administrador';
  END IF;

  UPDATE public.usuarios
  SET nombre_completo = p_nombre_completo,
      rol_id          = p_rol_id,
      activo          = p_activo
  WHERE id = p_id;
END;
$$;

-- Re-otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION es_administrador()                              TO authenticated;
GRANT EXECUTE ON FUNCTION admin_eliminar_rol(uuid)                        TO authenticated;
GRANT EXECUTE ON FUNCTION admin_actualizar_usuario(uuid, text, uuid, boolean) TO authenticated;
