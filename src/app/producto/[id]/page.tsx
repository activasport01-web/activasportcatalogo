import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import ProductView from '@/components/ProductView'
import Footer from '@/components/Footer'
import { notFound } from 'next/navigation'

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
            title: 'Producto no encontrado | Zapatería Moderna'
        }
    }

    const origen = producto.origen && producto.origen !== 'Nacional' ? `(${producto.origen})` : ''
    const titulo = `${producto.nombre} ${origen} - Bs ${producto.precio}`
    const descripcion = `Compra mayorista: ${producto.nombre}. ${producto.descripcion?.slice(0, 100) || 'Calidad garantizada'}...`

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

    const { data: producto } = await supabase
        .from('zapatos')
        .select('*')
        .eq('id', id)
        .single()

    if (!producto) {
        notFound()
    }

    return (
        <main className="bg-slate-50 min-h-screen flex flex-col">
            <Navbar />

            <div className="flex-grow pt-28 pb-12">
                <ProductView producto={producto} />
            </div>

            <Footer />
        </main>
    )
}
