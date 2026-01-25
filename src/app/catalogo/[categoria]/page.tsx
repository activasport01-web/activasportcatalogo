import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CatalogView from '@/components/CatalogView'

export const revalidate = 0

interface Props {
    params: Promise<{
        categoria: string
    }>
}

export default async function CategoriaPage({ params }: Props) {
    const { categoria } = await params

    // Normalizar slug (ej: "ninos" -> "nino" si fuera necesario, o directo)
    // Asumimos que el slug coincide con la DB o hacemos map si no
    let dbCategoria = categoria.toLowerCase()

    // Pequeño map para casos especiales de URL vs DB
    if (dbCategoria === 'ninos') dbCategoria = 'nino'
    if (dbCategoria === 'adultos') dbCategoria = 'adulto'

    // Fetch productos filtrados por Categoría
    const { data: zapatos } = await supabase
        .from('zapatos')
        .select('*')
        .eq('disponible', true)
        // Usamos 'ilike' para que no importe mayúsculas/minúsculas o coincidencia parcial
        // Usamos 'ilike' con comodines % para coincidencia parcial (ej: "deportivo" encuentra "Deportivos")
        .ilike('categoria', `%${dbCategoria}%`)
        .order('fecha_creacion', { ascending: false })

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />

            {/* Header de Categoría */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                    <span className="text-orange-500 font-bold tracking-widest uppercase text-sm mb-2 block">
                        Categoría
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight capitalize">
                        {categoria.replace('-', ' ')}
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Encuentra los mejores modelos en {categoria}, diseñados para estilo y confort.
                    </p>
                </div>
            </div>

            {/* La vista recibe SOLO los productos de esta categoría */}
            <CatalogView initialProducts={zapatos || []} />

            <Footer />
        </main>
    )
}
