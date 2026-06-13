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
    // ya que fetch la generará automáticamente con el boundary correcto.
    const isMultipart = contentType.includes('multipart/form-data')
    if (!isMultipart && contentType) {
        forwardHeaders['Content-Type'] = contentType
    } else if (!contentType) {
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

    let body: any = undefined

    if (method !== 'GET' && method !== 'HEAD') {
        console.log(`[Proxy] Reading body for ${method} ${target}...`)
        try {
            if (isMultipart) {
                body = await request.formData()
                console.log(`[Proxy] Body read successfully as FormData`)
            } else {
                body = await request.arrayBuffer()
                console.log(`[Proxy] Body read successfully as ArrayBuffer (${body.byteLength} bytes)`)
            }
        } catch (err: any) {
            console.error(`[Proxy] Error reading request body:`, err)
            return new Response(JSON.stringify({ 
                error: 'Error al leer cuerpo de petición', 
                details: err?.message || String(err) 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            })
        }
    }

    try {
        console.log(`[Proxy] Fetching upstream target: ${target}...`)
        const upstream = await fetch(target, {
            method,
            headers: forwardHeaders,
            body: body ?? undefined
        } as any)
        
        console.log(`[Proxy] Upstream response received: Status ${upstream.status}`)

        // Reenviar cabeceras de respuesta importantes
        const responseHeaders: Record<string, string> = {
            'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
        }
        for (const h of ['Content-Range', 'X-Total-Count', 'Preference-Applied']) {
            const val = upstream.headers.get(h)
            if (val) responseHeaders[h] = val
        }

        // IMPORTANTE: Según el estándar HTTP, las respuestas 204, 205 y 304 no pueden tener cuerpo.
        const isBodyAllowed = ![204, 205, 304].includes(upstream.status);
        
        let responseBody: any = null
        if (isBodyAllowed) {
            console.log(`[Proxy] Reading response body...`)
            responseBody = await upstream.arrayBuffer()
            console.log(`[Proxy] Response body read complete (${responseBody.byteLength} bytes)`)
        }

        return new Response(responseBody, {
            status: upstream.status,
            headers: responseHeaders,
        })
    } catch (error: any) {
        console.error('[Proxy Supabase] Upstream Error:', error)
        return new Response(JSON.stringify({ 
            error: 'Error interno del proxy', 
            details: error?.message || String(error),
            stack: error?.stack 
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
