-- Plan A Seguridad: tabla de intentos de acceso al panel admin

CREATE TABLE IF NOT EXISTS public.login_intentos (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text        NOT NULL,
  ip         text        DEFAULT 'desconocida',
  user_agent text,
  exitoso    boolean     DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Índice para consultas rápidas por email + fecha
CREATE INDEX IF NOT EXISTS idx_login_intentos_email_fecha
  ON public.login_intentos(email, created_at DESC);

-- RLS activado: sin policies = solo service_role puede acceder
ALTER TABLE public.login_intentos ENABLE ROW LEVEL SECURITY;

-- Limpieza automática: eliminar registros mayores a 30 días (opcional, ejecutar manualmente o con pg_cron)
-- DELETE FROM public.login_intentos WHERE created_at < now() - interval '30 days';
