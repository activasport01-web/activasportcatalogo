import Link from 'next/link'
import { supabase } from '@/lib/supabase'

import ProductCard from '@/components/ProductCard'

export const revalidate = 0

export default async function NuevosPage() {
    // Obtener zapatos con etiqueta "nuevo"
    const { data: zapatos } = await supabase
        .from('zapatos')
        .select('*')
        .eq('disponible', true)
        .contains('etiquetas', ['nuevo'])
        .order('fecha_creacion', { ascending: false })

    return (
        <main className="min-h-screen bg-gray-50">


            {/* Hero */}
            <section className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="text-6xl mb-4">✨</div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-4">Nuevos Arrivals</h1>
                    <p className="text-xl text-blue-100">Las últimas tendencias en calzado</p>
                </div>
            </section>

            {/* Productos */}
            <section className="max-w-7xl mx-auto px-4 py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">
                        {zapatos?.length || 0} Productos Nuevos
                    </h2>
                    <p className="text-gray-600 mt-1">Recién llegados a nuestra tienda</p>
                </div>

                {zapatos && zapatos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {zapatos.map((zapato) => (
                            <ProductCard key={zapato.id} zapato={zapato} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Pronto habrá nuevos productos</h3>
                        <p className="text-gray-600">Estamos preparando nuevas sorpresas para ti</p>
                    </div>
                )}
            </section>


        </main>
    )
}
