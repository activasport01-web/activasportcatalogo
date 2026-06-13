import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * fetch personalizado que redirige todas las llamadas al API de Supabase
 * a través de nuestro proxy en /api/proxy cuando se ejecuta en el cliente.
 *
 * Esto resuelve el bloqueo que algunas operadoras móviles hacen al dominio
 * supabase.co. El navegador ahora solo habla con nuestro propio dominio
 * (activasportbo.com/api/proxy) y Vercel hace la conexión real con Supabase.
 *
 * En el servidor (rutas API de Next.js), se usa fetch directo sin proxy,
 * ya que los servidores de Vercel no tienen restricciones de operadora.
 */
const proxiedFetch = async (
    url: RequestInfo | URL,
    options?: RequestInit
): Promise<Response> => {
    const isClient = typeof window !== 'undefined'
    const urlStr = url.toString()

    // Lado servidor: conexión directa a Supabase.
    // Lado cliente: siempre a través del proxy para evitar bloqueo de operadora.
    if (!isClient) {
        return fetch(url, options)
    }

    // Lado cliente: redirigir a través del proxy para evitar bloqueos de operadora
    const targetUrl = encodeURIComponent(urlStr)
    const proxyUrl = `/api/proxy?target=${targetUrl}`

    try {
        const response = await fetch(proxyUrl, {
            method: options?.method || 'GET',
            headers: options?.headers,
            body: options?.body,
            signal: options?.signal
        })
        return response
    } catch (err) {
        throw err
    }
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
    global: {
        fetch: proxiedFetch,
    },
})

/**
 * Convierte una URL de imagen de Supabase Storage a una URL del proxy local.
 * Usar esta función en todos los <img src={...}> que apunten a Supabase.
 *
 * Ejemplo:
 *   <img src={proxyImageUrl(producto.url_imagen)} />
 */
export function proxyImageUrl(url: string | null | undefined): string {
    if (!url) return ''
    // Solo proxear imágenes de Supabase Storage
    if (url.includes('.supabase.co')) {
        return `/api/img?url=${encodeURIComponent(url)}`
    }
    return url
}

/**
 * Sube un archivo a Supabase Storage forzando el uso del proxy.
 * Esto soluciona problemas donde el cliente de Supabase Storage ignora el proxy
 * o tiene problemas con el proveedor de internet.
 */
export async function safeUpload(bucket: string, path: string, file: File): Promise<{ error: any, data: any }> {
    const isClient = typeof window !== 'undefined'
    const targetUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`
    
    try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        
        const headers: Record<string, string> = {
            'Content-Type': file.type,
            'apikey': supabaseKey,
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        const urlToFetch = isClient ? `/api/proxy?target=${encodeURIComponent(targetUrl)}` : targetUrl

        const response = await fetch(urlToFetch, {
            method: 'POST',
            headers,
            body: file
        })

        if (!response.ok) {
            const errorText = await response.text()
            return { error: new Error(errorText), data: null }
        }

        return { error: null, data: { path } }
    } catch (err) {
        return { error: err, data: null }
    }
}
