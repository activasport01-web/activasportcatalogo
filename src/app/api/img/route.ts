import { NextRequest } from 'next/server'

const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Proxy de imágenes para Supabase Storage.
 * Las imágenes de productos están alojadas en supabase.co,
 * que es bloqueado por algunas operadoras móviles.
 * Este endpoint actúa de intermediario: el navegador pide /api/img?url=...
 * y Vercel descarga y devuelve la imagen desde sus servidores.
 *
 * Uso: /api/img?url=<url_imagen_supabase_codificada>
 */
export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url')

    if (!url) {
        return new Response('Falta el parámetro url', { status: 400 })
    }

    // Seguridad: solo permitir URLs de Supabase Storage
    if (!url.includes('.supabase.co')) {
        return new Response('URL no autorizada', { status: 403 })
    }

    try {
        const response = await fetch(url, {
            headers: {
                apikey: SUPABASE_KEY,
            },
        })

        if (!response.ok) {
            return new Response('Imagen no encontrada', { status: response.status })
        }

        const imageData = await response.arrayBuffer()
        const contentType = response.headers.get('Content-Type') || 'image/jpeg'

        return new Response(imageData, {
            headers: {
                'Content-Type': contentType,
                // Cache de 24 horas en el navegador, 7 días en CDN
                'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
            },
        })
    } catch (error) {
        console.error('[Proxy Imagen] Error:', error)
        return new Response('Error al obtener la imagen', { status: 500 })
    }
}
