import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabaseServer'

const BASE_URL = 'https://activasportbo.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Páginas estáticas principales
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
        { url: `${BASE_URL}/catalogo`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${BASE_URL}/nuevos`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
        { url: `${BASE_URL}/ofertas`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
        { url: `${BASE_URL}/nosotros`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/terminos`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
        { url: `${BASE_URL}/privacidad`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    ]

    // Productos disponibles
    const { data: productos } = await supabase
        .from('zapatos')
        .select('id, fecha_creacion')
        .eq('disponible', true)

    const productRoutes: MetadataRoute.Sitemap = (productos || []).map((p: any) => ({
        url: `${BASE_URL}/producto/${p.id}`,
        lastModified: p.fecha_creacion ? new Date(p.fecha_creacion) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
    }))

    // Categorías activas (/catalogo/[categoria])
    const { data: categorias } = await supabase
        .from('categorias')
        .select('slug')
        .eq('activa', true)

    const categoriaRoutes: MetadataRoute.Sitemap = (categorias || [])
        .filter((c: any) => c.slug)
        .map((c: any) => ({
            url: `${BASE_URL}/catalogo/${c.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
        }))

    return [...staticRoutes, ...productRoutes, ...categoriaRoutes]
}
