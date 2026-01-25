import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'

export const revalidate = 0

export default async function OfertasPage() {
    // Obtener zapatos con etiqueta "oferta"
    const { data: zapatos } = await supabase
        .from('zapatos')
        .select('*')
        .eq('disponible', true)
        .contains('etiquetas', ['oferta'])
        .order('fecha_creacion', { ascending: false })

    return (
        <main className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Hero */}
            <section className="bg-gradient-to-r from-red-500 to-orange-600 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="text-6xl mb-4">🔥</div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-4">Ofertas Especiales</h1>
                    <p className="text-xl text-orange-100">Hasta 50% de descuento en productos seleccionados</p>
                </div>
            </section>

            {/* Productos */}
            <section className="max-w-7xl mx-auto px-4 py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">
                        {zapatos?.length || 0} Productos en Oferta
                    </h2>
                    <p className="text-gray-600 mt-1">¡Aprovecha estos precios increíbles!</p>
                </div>

                {zapatos && zapatos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {zapatos.map((zapato) => (
                            <ProductCard key={zapato.id} zapato={zapato} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🎁</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No hay ofertas activas en este momento</h3>
                        <p className="text-gray-600">Suscríbete para recibir notificaciones de nuestras próximas ofertas</p>
                    </div>
                )}
            </section>

            <Footer />
        </main>
    )
}
