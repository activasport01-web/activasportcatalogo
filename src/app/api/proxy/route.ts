import { NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Proxy genérico para todas las llamadas al API de Supabase.
 * Evita que las operadoras móviles bloqueen el dominio supabase.co,
 * ya que el navegador solo habla con /api/proxy (nuestro propio dominio)
 * y Vercel hace la conexión real con Supabase desde sus servidores.
 */
async function handler(request: NextRequest) {
    const target = request.nextUrl.searchParams.get('target')

    if (!target) {
        return new Response(JSON.stringify({ error: 'Falta el parámetro target' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    // Seguridad: solo permitir peticiones hacia Supabase
    if (!target.startsWith(SUPABASE_URL)) {
        return new Response(JSON.stringify({ error: 'Destino no permitido' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    // Construir cabeceras para reenviar a Supabase
    const forwardHeaders: Record<string, string> = {
        'apikey': SUPABASE_KEY,
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
    }

    // Reenviar cabeceras relevantes del cliente
    const headersToForward = [
        'Authorization',
        'Prefer',
        'Range',
        'Accept',
        'Accept-Profile',
        'Content-Profile',
        'X-Client-Info',
    ]
    for (const header of headersToForward) {
        const value = request.headers.get(header)
        if (value) forwardHeaders[header] = value
    }

    const method = request.method
    const body =
        method !== 'GET' && method !== 'HEAD' ? await request.arrayBuffer() : undefined

    try {
        const upstream = await fetch(target, {
            method,
            headers: forwardHeaders,
            body: body ?? undefined,
        })

        // Reenviar cabeceras de respuesta importantes
        const responseHeaders: Record<string, string> = {
            'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
        }
        for (const h of ['Content-Range', 'X-Total-Count', 'Preference-Applied']) {
            const val = upstream.headers.get(h)
            if (val) responseHeaders[h] = val
        }

        const responseBody = await upstream.arrayBuffer()

        return new Response(responseBody, {
            status: upstream.status,
            headers: responseHeaders,
        })
    } catch (error) {
        console.error('[Proxy Supabase] Error:', error)
        return new Response(JSON.stringify({ error: 'Error interno del proxy' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export const GET = handler
export const POST = handler
export const PATCH = handler
export const PUT = handler
export const DELETE = handler
export const HEAD = handler
export const OPTIONS = handler
