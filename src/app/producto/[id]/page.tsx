import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'

import { notFound } from 'next/navigation'
import ProductView from '@/components/ProductView'

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

            <div className="flex-grow pt-28 pb-12">
                <ProductView producto={producto} />

                {/* Sección Productos Relacionados */}
                {relacionados && relacionados.length > 0 && (
                    <section className="max-w-7xl mx-auto px-4 mt-16">
                        <div className="flex items-center gap-4 mb-8">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                También te podría interesar
                            </h2>
                            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-grow"></div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relacionados.map((item) => (
                                <div key={item.id} className="group relative">
                                    <a href={`/producto/${item.id}`} className="block bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all border border-slate-100 dark:border-slate-800">
                                        <div className="relative aspect-square mb-4 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden">
                                            <img
                                                src={item.url_imagen}
                                                alt={item.nombre}
                                                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                                            />
                                            {item.etiquetas?.includes('nuevo') && (
                                                <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NUEVO</span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1 mb-1 group-hover:text-brand-orange transition-colors">
                                            {item.nombre}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            {item.categoria}
                                        </p>
                                    </a>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

        </main>
    )
}
