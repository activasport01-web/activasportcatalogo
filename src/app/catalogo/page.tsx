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


            {/* Header eliminado para dar paso a la UI dinámica en CatalogView */}


            {/* Vista Interactiva (Filtros + Grid) */}
            <CatalogView
                initialProducts={zapatos || []}
                availCategorias={categorias || []}
                availSubcategorias={subcategorias || []}
                availMarcas={marcas?.filter(m => m.nombre !== 'Pito') || []}
            />


        </main>
    )
}
