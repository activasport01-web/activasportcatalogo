import { supabase } from '@/lib/supabase'

import CatalogView from '@/components/CatalogView'

export const revalidate = 0 // Datos frescos siempre

export default async function CatalogoPage() {
    // 1. Fetch de TODOS los productos disponibles
    // La estrategia es traer todos (~X00 items) y filtrar en cliente para velocidad instantánea.
    const productsPromise = supabase
        .from('zapatos')
        .select('*')
        .eq('disponible', true)
        .order('fecha_creacion', { ascending: false })

    // 2. Fetch de Listas Maestras para Filtros (Independiente de si hay productos o no)
    const activeCatsPromise = supabase.from('categorias').select('*').eq('activa', true).order('orden')
    const activeSubcatsPromise = supabase.from('subcategorias').select('*').eq('activa', true).order('orden')
    const activeBrandsPromise = supabase.from('marcas').select('*').eq('active', true).order('nombre')

    const [
        { data: zapatos },
        { data: categorias },
        { data: subcategorias },
        { data: marcas }
    ] = await Promise.all([
        productsPromise,
        activeCatsPromise,
        activeSubcatsPromise,
        activeBrandsPromise
    ])

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">


            {/* Header del Catálogo (Estático) */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                        Catálogo Completo
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                        Explora nuestra colección mayorista. Calidad premium, precios de fábrica y envíos a todo el país.
                    </p>
                </div>
            </div>

            {/* Vista Interactiva (Filtros + Grid) */}
            <CatalogView
                initialProducts={zapatos || []}
                availCategorias={categorias || []}
                availSubcategorias={subcategorias || []}
                availMarcas={marcas || []}
            />


        </main>
    )
}
