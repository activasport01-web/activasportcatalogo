import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ANON_KEY      = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const MAX_INTENTOS   = 5
const VENTANA_MS     = 15 * 60 * 1000  // 15 minutos

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null)
    if (!body?.email || !body?.password) {
        return NextResponse.json({ error: 'datos_incompletos' }, { status: 400 })
    }

    const { email, password } = body
    const emailNorm = email.toLowerCase().trim()

    /* Cliente admin (service role) — solo server-side, nunca en el browser */
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    })

    /* IP del visitante */
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || 'desconocida'
    const userAgent = req.headers.get('user-agent') || ''

    /* ── 1. Verificar si está bloqueado ── */
    const ventanaInicio = new Date(Date.now() - VENTANA_MS).toISOString()

    const { data: fallidos } = await admin
        .from('login_intentos')
        .select('created_at')
        .eq('email', emailNorm)
        .eq('exitoso', false)
        .gte('created_at', ventanaInicio)
        .order('created_at', { ascending: true })

    if (fallidos && fallidos.length >= MAX_INTENTOS) {
        /* Desbloqueo: 15 min desde el intento más antiguo de la ventana */
        const masAntiguo    = new Date(fallidos[0].created_at)
        const desbloqueoEn  = new Date(masAntiguo.getTime() + VENTANA_MS)
        const msRestantes   = Math.max(0, desbloqueoEn.getTime() - Date.now())
        const minRestantes  = Math.ceil(msRestantes / 60000)
        const segRestantes  = Math.ceil(msRestantes / 1000)

        /* Registrar el intento bloqueado */
        await admin.from('login_intentos').insert({ email: emailNorm, ip, user_agent: userAgent, exitoso: false })

        return NextResponse.json({
            error: 'bloqueado',
            minRestantes,
            segRestantes,
        }, { status: 429 })
    }

    /* ── 2. Intentar autenticación ── */
    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
        email: email.trim(),
        password,
    })

    const exitoso = !authError && !!authData?.session

    /* ── 3. Registrar intento ── */
    await admin.from('login_intentos').insert({
        email: emailNorm,
        ip,
        user_agent: userAgent,
        exitoso,
    })

    if (!exitoso) {
        const usados    = (fallidos?.length ?? 0) + 1
        const restantes = Math.max(0, MAX_INTENTOS - usados)
        return NextResponse.json({ error: 'credenciales', restantes }, { status: 401 })
    }

    /* ── 4. Devolver sesión al cliente ── */
    return NextResponse.json({ session: authData.session })
}
