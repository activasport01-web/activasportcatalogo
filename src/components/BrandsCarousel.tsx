'use client'

import { useEffect, useState } from 'react'
import { supabase, proxyImageUrl } from '@/lib/supabase'
import Link from 'next/link'

interface Marca {
    id: string
    nombre: string
    logo_url: string | null
    active: boolean
}

export default function BrandsCarousel() {
    const [marcas, setMarcas] = useState<Marca[]>([])

    useEffect(() => {
        loadMarcas()
    }, [])

    const loadMarcas = async () => {
        const { data } = await supabase
            .from('marcas')
            .select('*')
            .eq('active', true)
            .order('nombre')

        if (data) setMarcas(data)
    }

    if (marcas.length === 0) return null

    return (
        <section className="py-10 md:py-14 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/50">
            <div className="max-w-7xl mx-auto px-4">
                {/* Título */}
                <h2 className="text-center text-sm md:text-base font-black uppercase tracking-[0.25em] text-slate-800 dark:text-white mb-8 md:mb-10">
                    Nuestras Marcas
                </h2>

                <div className="relative">
                    {/* Fade edges */}
                    <div className="absolute left-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-r from-white dark:from-slate-950 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10 pointer-events-none" />

                    {/* Carrusel automático: la fila va dos veces y ambas se mueven juntas, así el bucle no tiene corte.
                        Se pausa con el mouse o el foco; sin animación si el usuario pidió reducir movimiento. */}
                    <div className="group/marcas flex overflow-hidden py-2 motion-reduce:overflow-x-auto">
                        {[0, 1].map((copia) => (
                            <div
                                key={copia}
                                aria-hidden={copia === 1 || undefined}
                                className={`flex min-w-full shrink-0 justify-around animate-marquee group-hover/marcas:[animation-play-state:paused] group-focus-within/marcas:[animation-play-state:paused] motion-reduce:animate-none ${copia ? 'motion-reduce:hidden' : ''}`}
                                style={{ animationDuration: `${marcas.length * 3}s` }}
                            >
                                {marcas.map((marca) => (
                                    <Link
                                        key={marca.id}
                                        href={`/catalogo?marca=${encodeURIComponent(marca.nombre)}`}
                                        tabIndex={copia ? -1 : undefined}
                                        className="flex-shrink-0 group flex flex-col items-center gap-3 px-3 md:px-4 transition-transform duration-200 hover:-translate-y-1"
                                    >
                                        {/* Círculo del logo */}
                                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center overflow-hidden border-2 border-slate-800 dark:border-slate-300 shadow-md group-hover:shadow-xl group-hover:shadow-orange-500/20 group-hover:border-orange-500 dark:group-hover:border-orange-400 transition-all duration-300">
                                            {marca.logo_url ? (
                                                <img
                                                    src={proxyImageUrl(marca.logo_url)}
                                                    alt={marca.nombre}
                                                    className="w-[75%] h-[75%] object-contain invert mix-blend-screen dark:invert-0 dark:mix-blend-multiply group-hover:scale-110 transition-transform duration-300"
                                                />
                                            ) : (
                                                <span className="text-2xl md:text-3xl font-black text-white dark:text-slate-900 select-none group-hover:scale-110 transition-transform duration-300">
                                                    {marca.nombre.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Nombre de la marca */}
                                        <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors duration-200 whitespace-nowrap">
                                            {marca.nombre}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
