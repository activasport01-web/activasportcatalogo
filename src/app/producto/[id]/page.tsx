import { Metadata } from 'next'
import { supabase, proxyImageUrl } from '@/lib/supabaseServer'

import { notFound } from 'next/navigation'
import ProductView from '@/components/ProductView'
import ProductCard from '@/components/ProductCard'

export const revalidate = 0

interface Props {
    params: Promise<{
        id: string
    }>
}

// 1. Generación Dinámica de Metadatos para SEO y Redes Sociales
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params

    const { data: producto } = await supabase
        .from('zapatos')
        .select('nombre, precio, url_imagen, descripcion, origen')
        .eq('id', id)
        .single()

    if (!producto) {
        return {
            title: 'Producto no encontrado | Activa Sport'
        }
    }

    const origen = producto.origen && producto.origen !== 'Nacional' ? `(${producto.origen})` : ''
    // SEO: Título sin precio, énfasis en Modelo y Marca
    const titulo = `${producto.nombre} ${origen} - Catálogo Mayorista Activa Sport`
    // Descripción enfocada en calidad y venta mayorista, SIN precio
    const descripcion = `Detalle del modelo ${producto.nombre}. Disponible para pedidos al por mayor. Consulta curvas y colores disponibles.`

    return {
        title: titulo,
        description: descripcion,
        openGraph: {
            title: titulo,
            description: descripcion,
            images: [
                {
                    url: producto.url_imagen,
                    width: 800,
                    height: 800,
                    alt: producto.nombre,
                }
            ],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: titulo,
            description: descripcion,
            images: [producto.url_imagen],
        }
    }
}

// 2. Componente Principal de la Página
export default async function ProductoPage({ params }: Props) {
    const { id } = await params

    // Fetch Producto Principal
    const { data: producto } = await supabase
        .from('zapatos')
        .select('*, cat_obj:categorias(nombre), marca_obj:marcas(nombre), subcat_obj:subcategorias(nombre), gen_obj:generos(nombre)')
        .eq('id', id)
        .single()

    if (!producto) {
        notFound()
    }

    // Incrementar el contador de vistas de forma atómica (no bloquea el render si falla)
    supabase.rpc('incrementar_vista_zapato', { zapato_id: producto.id }).then(({ error }) => {
        if (error) console.error('Error al incrementar vista:', error)
    })

    // Fetch Productos Relacionados (Misma Categoría, excluyendo el actual)
    // Buscamos hasta 4 productos similares para mostrar abajo
    const { data: relacionados } = await supabase
        .from('zapatos')
        .select('*, cat_obj:categorias(nombre), marca_obj:marcas(nombre), subcat_obj:subcategorias(nombre), gen_obj:generos(nombre)')
        .eq('categoria_id', producto.categoria_id) // Match using ID instead of text
        .eq('disponible', true)
        .neq('id', id) // Excluir el actual
        .limit(4)

    // Datos estructurados (JSON-LD) para que Google entienda el producto.
    // No se incluye "offers" con precio: este catálogo es mayorista por consulta
    // y Google penaliza/marca como error un Offer sin precio real declarado.
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: producto.nombre,
        description: producto.descripcion || `${producto.nombre} disponible para pedidos al por mayor en Activa Sport.`,
        image: producto.url_imagen,
        sku: producto.codigo || String(producto.id),
        brand: {
            '@type': 'Brand',
            name: producto.marca_obj?.nombre || producto.origen || 'Activa Sport',
        },
    }

    return (
        <main className="bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col transition-colors duration-300">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="flex-grow pt-20 md:pt-28 pb-12">
                <ProductView producto={producto} />

                {/* Sección Productos Relacionados */}
                {relacionados && relacionados.length > 0 && (
                    <section className="max-w-7xl mx-auto px-4 mt-10 md:mt-16">
                        <div className="flex items-center gap-4 mb-6">
                            <h2 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                También te podría interesar
                            </h2>
                            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-grow"></div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                            {relacionados.map((item) => (
                                <ProductCard key={item.id} zapato={item} />
                            ))}
                        </div>
                    </section>
                )}
            </div>

        </main>
    )
}
