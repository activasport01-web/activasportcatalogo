import { createBrowserClient } from '@supabase/ssr'

export { proxyImageUrl } from './supabaseUtils'

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

/**
 * Cliente de Supabase para usar en componentes de CLIENTE ('use client').
 * Usa createBrowserClient (@supabase/ssr) en vez de createClient: esto guarda
 * la sesión en cookies reales del navegador (en vez de localStorage), lo que
 * permite que el middleware del servidor pueda verificar la sesión real con
 * supabase.auth.getUser() antes de dejar pasar a /admin/*.
 *
 * NO usar este cliente en componentes de servidor: createBrowserClient
 * depende de `document`, que no existe ahí. Para Server Components públicos
 * (catálogo, ficha de producto, etc.) usar '@/lib/supabaseServer' en su lugar.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseKey, {
    global: {
        fetch: proxiedFetch,
    },
})

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
    console.log(`[safeUpload] Iniciando subida de: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
    
    if (onProgress) onProgress("Subiendo archivo...")

    // Validar tamaño máximo para el servidor (4.5 MB es el límite físico de Vercel)
    if (file.size > 4.2 * 1024 * 1024) {
        const errorMsg = `El archivo supera los 4.2 MB y Vercel limita las peticiones a un máximo de 4.5 MB. Por favor, selecciona una imagen más pequeña.`
        console.error(`[safeUpload] ERROR: ${errorMsg}`)
        return { 
            error: new Error(errorMsg), 
            url: null 
        }
    }

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
            console.error(`[safeUpload] Tiempo límite de subida agotado (90s).`)
            controller.abort()
        }, 90000) // 90s timeout

        const uploadUrl = `/api/upload?bucket=${bucket}&path=${path}`
        console.log(`[safeUpload] Enviando petición POST a ${uploadUrl}...`)

        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Content-Type': file.type
            },
            body: file,
            signal: controller.signal
        })
        clearTimeout(timeoutId)

        console.log(`[safeUpload] Respuesta recibida del servidor. Código de estado: ${response.status}`)

        if (!response.ok) {
            const errData = await response.json().catch(() => ({ error: `Error HTTP ${response.status} en la subida.` }))
            console.error(`[safeUpload] Error devuelto por el servidor de subidas:`, errData.error)
            return { error: new Error(errData.error || `Error ${response.status}`), url: null }
        }

        const data = await response.json()
        console.log(`[safeUpload] ¡Subida exitosa! URL pública: ${data.url}`)
        return { error: null, url: data.url }
    } catch (err: any) {
        const isAbort = err.name === 'AbortError'
        const errMsg = isAbort ? 'Tiempo de espera agotado (90s) durante la subida.' : err.message
        console.error(`[safeUpload] Error crítico en la subida:`, err)
        return { error: new Error(errMsg), url: null }
    }
}
