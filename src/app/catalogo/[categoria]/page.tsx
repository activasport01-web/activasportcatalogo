import { supabase } from '@/lib/supabase'
import { Suspense } from 'react'

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

    // Buscar la categoría en la tabla maestra por slug o nombre
    const { data: catRow } = await supabase
        .from('categorias')
        .select('id, nombre')
        .or(`slug.eq.${dbCategoria},nombre.ilike.%${dbCategoria}%`)
        .limit(1)
        .single()

    // Fetch productos filtrados por categoria_id (relacional)
    let zapatosQuery = supabase
        .from('zapatos')
        .select('*, marca_obj:marcas(nombre), cat_obj:categorias(nombre), gen_obj:generos(nombre), subcat_obj:subcategorias(nombre)')
        .eq('disponible', true)
        .order('fecha_creacion', { ascending: false })

    if (catRow?.id) {
        zapatosQuery = zapatosQuery.eq('categoria_id', catRow.id)
    }

    const { data: zapatos } = await zapatosQuery

    return (
        <main className="min-h-screen bg-slate-50">


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
            {/* Derivar filtros del resultado actual */}
            {(() => {
                const uniqueCategorias = Array.from(new Set((zapatos || []).map(z => z.cat_obj?.nombre || z.categoria).filter(Boolean))).map(c => ({ id: c, nombre: c }));

                const uniqueSubMap = new Map();
                (zapatos || []).forEach(z => {
                    const subNombre = z.subcat_obj?.nombre || z.subcategoria;
                    const catNombre = z.cat_obj?.nombre || z.categoria;
                    if (subNombre && !uniqueSubMap.has(subNombre)) {
                        uniqueSubMap.set(subNombre, { id: subNombre, nombre: subNombre, categoria_relacionada: catNombre });
                    }
                });
                const uniqueSubcategorias = Array.from(uniqueSubMap.values());

                const uniqueMarcas = Array.from(new Set((zapatos || []).map(z => z.marca_obj?.nombre || z.marca).filter(Boolean))).map(m => ({ id: m, nombre: m }));

                return (
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Cargando catálogo...</div>}>
                        <CatalogView
                            initialProducts={zapatos || []}
                            availCategorias={uniqueCategorias}
                            availSubcategorias={uniqueSubcategorias}
                            availMarcas={uniqueMarcas}
                        />
                    </Suspense>
                );
            })()}


        </main>
    )
}
