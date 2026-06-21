import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Middleware de protección del panel administrativo.
 *
 * Cómo funciona:
 * - Corre en el SERVIDOR de Vercel, antes de entregar cualquier página.
 * - Si alguien intenta entrar a /admin/* sin estar logueado,
 *   es redirigido al login INMEDIATAMENTE, sin ver nada del panel.
 * - La sesión vive en cookies reales de Supabase (gracias a createBrowserClient
 *   en lib/supabase.ts). supabase.auth.getUser() valida el JWT contra el
 *   servidor de Supabase — no es solo "existe una cookie", es una sesión real.
 *
 *   Esto reemplaza la verificación anterior basada en una cookie simple
 *   ('admin_session=1'), que cualquiera podía forjar manualmente.
 */
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Solo proteger rutas /admin/* excepto el login mismo
    const isAdminRoute = pathname.startsWith('/admin')
    const isLoginPage = pathname === '/admin/login'

    if (!isAdminRoute || isLoginPage) {
        return NextResponse.next()
    }

    let response = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // getUser() revalida el JWT contra el servidor de Supabase (a diferencia
    // de getSession(), que solo lee la cookie sin verificarla de nuevo).
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        const loginUrl = new URL('/admin/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    return response
}

export const config = {
    // Aplicar este middleware solo a rutas /admin/*
    matcher: ['/admin/:path*'],
}
