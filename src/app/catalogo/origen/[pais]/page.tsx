import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CatalogView from '@/components/CatalogView'
import { notFound } from 'next/navigation'

export const revalidate = 0

interface Props {
    params: Promise<{
        pais: string
    }>
}

export default async function OrigenPage({ params }: Props) {
    const { pais } = await params

    // Mapear slug a nombre en DB
    // Ej: "brazilero" -> "Brazilero"
    const origenMap: { [key: string]: string } = {
        'brazilero': 'Brazilero',
        'peruano': 'Peruano',
        'nacional': 'Nacional'
    }

    const dbOrigen = origenMap[pais.toLowerCase()]

    if (!dbOrigen) {
        return notFound()
    }

    const titulos: { [key: string]: string } = {
        'Brazilero': 'Colección Brasilera 🇧🇷',
        'Peruano': 'Moda Peruana 🇵🇪',
        'Nacional': 'Calidad Nacional 🇧🇴'
    }

    // Fetch productos filtrados por Origen
    const { data: zapatos } = await supabase
        .from('zapatos')
        .select('*')
        .eq('disponible', true)
        .eq('origen', dbOrigen)
        .order('fecha_creacion', { ascending: false })

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />

            {/* Header Específico */}
            <div className="bg-slate-900 border-b border-slate-800 text-white">
                <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                    <span className="text-orange-500 font-bold tracking-widest uppercase text-sm mb-2 block">
                        Origen Garantizado
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                        {titulos[dbOrigen]}
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Explora nuestra selección exclusiva de zapatos de fabricación {dbOrigen.toLowerCase()}.
                    </p>
                </div>
            </div>

            {/* Reutilizamos el CatalogView pero ya vendrá con los productos filtrados */}
            <CatalogView initialProducts={zapatos || []} />

            <Footer />
        </main>
    )
}
