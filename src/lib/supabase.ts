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
export async function safeUpload(
    bucket: string,
    path: string,
    file: File,
    onProgress?: (message: string) => void
): Promise<{ error: any, url: string | null }> {
    const isClient = typeof window !== 'undefined'
    const directUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`

    // Obtener token de sesión
    let token: string | undefined
    try {
        const { data: sessionData } = await supabase.auth.getSession()
        token = sessionData.session?.access_token
    } catch (e) {
        console.warn("[safeUpload] No se pudo obtener el token de sesión:", e)
    }

    const headers: Record<string, string> = {
        'Content-Type': file.type,
        'apikey': supabaseKey,
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    // Si no es el cliente (servidor), subir directo
    if (!isClient) {
        try {
            const res = await fetch(directUrl, {
                method: 'POST',
                headers,
                body: file
            })
            if (!res.ok) {
                const text = await res.text()
                return { error: new Error(text), url: null }
            }
            return { error: null, url: publicUrl }
        } catch (err) {
            return { error: err, url: null }
        }
    }

    // 1. Intentar subida DIRECTA a Supabase (evita límite 4.5MB de Vercel y es más rápido)
    console.log(`[safeUpload] 1. Intentando subida directa a Supabase para: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`)
    if (onProgress) onProgress("Conectando directo a Supabase...")

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
            console.warn(`[safeUpload] Timeout (30s) en subida directa para ${file.name}. Cancelando...`)
            controller.abort()
        }, 30000) // 30s timeout para subida directa

        const response = await fetch(directUrl, {
            method: 'POST',
            headers,
            body: file,
            signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (response.ok) {
            console.log(`[safeUpload] ¡Subida directa exitosa! URL: ${publicUrl}`)
            return { error: null, url: publicUrl }
        } else {
            const errorText = await response.text()
            console.warn(`[safeUpload] La subida directa falló con estado ${response.status}: ${errorText}. Intentando fallback por proxy...`)
        }
    } catch (err: any) {
        const isAbort = err.name === 'AbortError'
        console.warn(`[safeUpload] Subida directa falló o fue cancelada (${isAbort ? 'Timeout' : 'Error de red/bloqueo de ISP'}). Error:`, err)
    }

    // 2. FALLBACK: Subida a través del PROXY de Vercel (si falla la directa)
    console.log(`[safeUpload] 2. Ejecutando fallback a través del proxy para: ${file.name}...`)
    if (onProgress) onProgress("Usando proxy de respaldo...")

    // Validar tamaño máximo para el proxy
    if (file.size > 4.2 * 1024 * 1024) {
        const errorMsg = `El archivo supera los 4.2 MB (${(file.size / 1024 / 1024).toFixed(2)} MB) y debe usar el proxy porque la conexión directa falló. Vercel limita las subidas por proxy a 4.5 MB. Por favor, selecciona una imagen más pequeña.`
        console.error(`[safeUpload] ERROR: ${errorMsg}`)
        return { 
            error: new Error(errorMsg), 
            url: null 
        }
    }

    try {
        const proxyUrl = `/api/proxy?target=${encodeURIComponent(directUrl)}`
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
            console.error(`[safeUpload] Timeout (90s) agotado en proxy para ${file.name}.`)
            controller.abort()
        }, 90000) // 90s timeout para subida por proxy (redes lentas)

        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers,
            body: file,
            signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`[safeUpload] La subida por proxy falló con estado ${response.status}:`, errorText)
            let userFriendlyError = errorText
            if (response.status === 413) {
                userFriendlyError = "El servidor de Vercel rechazó la imagen por exceder el límite de tamaño de 4.5 MB."
            }
            return { error: new Error(userFriendlyError), url: null }
        }

        console.log(`[safeUpload] ¡Subida por proxy exitosa! URL: ${publicUrl}`)
        return { error: null, url: publicUrl }
    } catch (err: any) {
        const isAbort = err.name === 'AbortError'
        const errMsg = isAbort ? 'Tiempo de espera agotado (90s) en el proxy.' : err.message
        console.error(`[safeUpload] Error crítico en subida por proxy:`, err)
        return { error: new Error(errMsg), url: null }
    }
}
