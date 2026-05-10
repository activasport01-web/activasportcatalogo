import { Metadata } from 'next'
import { supabase, proxyImageUrl } from '@/lib/supabase'

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
        .select('*')
        .eq('id', id)
        .single()

    if (!producto) {
        notFound()
    }

    // Fetch Productos Relacionados (Misma Categoría, excluyendo el actual)
    // Buscamos hasta 4 productos similares para mostrar abajo
    const { data: relacionados } = await supabase
        .from('zapatos')
        .select('*')
        .eq('categoria', producto.categoria)
        .eq('disponible', true)
        .neq('id', id) // Excluir el actual
        .limit(4)

    return (
        <main className="bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col transition-colors duration-300">

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
