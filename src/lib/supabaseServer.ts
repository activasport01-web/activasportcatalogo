import { createClient } from '@supabase/supabase-js'

export { proxyImageUrl } from './supabaseUtils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Cliente de Supabase para Server Components públicos (catálogo, ficha de
 * producto, sitemap, etc.) que solo leen datos públicos y no necesitan saber
 * quién es el usuario logueado.
 *
 * Conexión directa a Supabase (sin pasar por /api/proxy): los servidores de
 * Vercel no tienen las restricciones de operadora móvil que sí afectan al
 * navegador del cliente.
 *
 * NO usar este cliente en componentes de cliente ('use client') ni para
 * lógica que dependa de la sesión del usuario — para eso usar '@/lib/supabase'.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
    },
})
