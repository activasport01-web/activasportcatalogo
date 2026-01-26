import { supabase } from '@/lib/supabase'

import CatalogView from '@/components/CatalogView'

export const revalidate = 0 // Datos frescos siempre

export default async function CatalogoPage() {
    // 1. Fetch de TODOS los productos disponibles
    // La estrategia es traer todos (~X00 items) y filtrar en cliente para velocidad instantánea.
    const { data: zapatos } = await supabase
        .from('zapatos')
        .select('*')
        .eq('disponible', true)
        .order('fecha_creacion', { ascending: false })

    return (
        <main className="min-h-screen bg-slate-50">


            {/* Header del Catálogo (Estático) */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                        Catálogo Completo
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Explora nuestra colección mayorista. Calidad premium, precios de fábrica y envíos a todo el país.
                    </p>
                </div>
            </div>

            {/* Vista Interactiva (Filtros + Grid) */}
            <CatalogView initialProducts={zapatos || []} />


        </main>
    )
}
