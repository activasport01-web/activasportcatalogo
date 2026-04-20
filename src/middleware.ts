import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware de protección del panel administrativo.
 *
 * Cómo funciona:
 * - Corre en el SERVIDOR de Vercel, antes de entregar cualquier página.
 * - Si alguien intenta entrar a /admin/* sin estar logueado,
 *   es redirigido al login INMEDIATAMENTE, sin ver nada del panel.
 * - La cookie 'admin_session' la pone el login al ingresar
 *   y la borra el botón de salir (logout).
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Solo proteger rutas /admin/* excepto el login mismo
    const isAdminRoute = pathname.startsWith('/admin')
    const isLoginPage = pathname === '/admin/login'

    if (isAdminRoute && !isLoginPage) {
        const adminSession = request.cookies.get('admin_session')

        if (!adminSession) {
            // No hay sesión → redirigir al login sin entregar nada
            const loginUrl = new URL('/admin/login', request.url)
            loginUrl.searchParams.set('redirect', pathname) // Guardar a dónde iba
            return NextResponse.redirect(loginUrl)
        }
    }

    return NextResponse.next()
}

export const config = {
    // Aplicar este middleware solo a rutas /admin/*
    matcher: ['/admin/:path*'],
}
