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

    if (!isClient) {
        // Lado servidor: conexión directa a Supabase (sin restricciones)
        return fetch(url, options)
    }

    // Lado cliente: redirigir a través del proxy para evitar bloqueos de operadora
    const targetUrl = encodeURIComponent(url.toString())
    const proxyUrl = `/api/proxy?target=${targetUrl}`

    return fetch(proxyUrl, {
        method: options?.method || 'GET',
        headers: options?.headers,
        body: options?.body,
    })
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
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
    // Otras URLs (externas, locales) pasan sin cambios
    return url
}
