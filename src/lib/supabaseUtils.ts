/**
 * Convierte una URL de imagen de Supabase Storage a una URL del proxy local.
 * Usar esta función en todos los <img src={...}> que apunten a Supabase.
 *
 * Ejemplo:
 *   <img src={proxyImageUrl(producto.url_imagen)} />
 *
 * Es una función pura (sin dependencia del cliente de Supabase), por eso
 * vive separada: la usan tanto el cliente de navegador como el de servidor.
 */
export function proxyImageUrl(url: string | null | undefined): string {
    if (!url) return ''
    // Solo proxear imágenes de Supabase Storage
    if (url.includes('.supabase.co')) {
        return `/api/img?url=${encodeURIComponent(url)}`
    }
    return url
}
