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
    const method = request.method
    const contentType = request.headers.get('Content-Type') || ''

    console.log(`[Proxy] Request started: ${method} ${target} | Content-Type: ${contentType}`)

    if (!target) {
        console.warn(`[Proxy] Missing target parameter`)
        return new Response(JSON.stringify({ error: 'Falta el parámetro target' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    // Seguridad: solo permitir peticiones hacia Supabase
    if (!target.startsWith(SUPABASE_URL)) {
        console.warn(`[Proxy] Target domain not allowed: ${target}`)
        return new Response(JSON.stringify({ error: 'Destino no permitido' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    // Construir cabeceras para reenviar a Supabase
    const forwardHeaders: Record<string, string> = {
        'apikey': SUPABASE_KEY,
    }

    // Si es multipart/form-data, NO debemos pasar la cabecera Content-Type manualmente,
    // ya que fetch la generará automáticamente con el boundary correcto (si pasamos FormData).
    // PERO como ahora pasaremos el stream crudo (request.body), SÍ debemos reenviar el Content-Type original
    // que ya incluye el boundary generado por el navegador.
    if (contentType) {
        forwardHeaders['Content-Type'] = contentType
    } else {
        forwardHeaders['Content-Type'] = 'application/json'
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

    const fetchOptions: RequestInit & { duplex?: string } = {
        method,
        headers: forwardHeaders,
    }

    if (method !== 'GET' && method !== 'HEAD') {
        // Leemos el body completo en lugar de usar stream para evitar cuelgues de duplex='half' en Next.js
        const arrayBuffer = await request.arrayBuffer()
        fetchOptions.body = Buffer.from(arrayBuffer)
    }

    try {
        console.log(`[Proxy] Fetching upstream target: ${target}...`)
        const upstream = await fetch(target, fetchOptions)
        
        console.log(`[Proxy] Upstream response received: Status ${upstream.status}`)

        // Reenviar cabeceras de respuesta importantes
        const responseHeaders: Record<string, string> = {
            'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
        }
        for (const h of ['Content-Range', 'X-Total-Count', 'Preference-Applied']) {
            const val = upstream.headers.get(h)
            if (val) responseHeaders[h] = val
        }

        // IMPORTANTE: Según el estándar HTTP, las respuestas 204, 205, 304 y el método HEAD no pueden tener cuerpo.
        const isBodyAllowed = method !== 'HEAD' && ![204, 205, 304].includes(upstream.status);
        
        let responseBody: any = null
        if (isBodyAllowed) {
            console.log(`[Proxy] Reading response body as ArrayBuffer...`)
            const arrayBuffer = await upstream.arrayBuffer()
            responseBody = Buffer.from(arrayBuffer)
        }

        return new Response(responseBody, {
            status: upstream.status,
            headers: responseHeaders,
        })
    } catch (error: any) {
        console.error('[Proxy Supabase] Upstream Error:', error)
        return new Response(JSON.stringify({
            error: 'Error interno del proxy',
            details: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : 'Error de conexión',
        }), {
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
