'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase, proxyImageUrl } from '@/lib/supabase'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Marca {
    id: string
    nombre: string
    logo_url: string | null
    active: boolean
}

export default function BrandsCarousel() {
    const [marcas, setMarcas] = useState<Marca[]>([])
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

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

    const checkScroll = () => {
        const el = scrollRef.current
        if (!el) return
        setCanScrollLeft(el.scrollLeft > 5)
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5)
    }

    useEffect(() => {
        checkScroll()
        const el = scrollRef.current
        if (el) {
            el.addEventListener('scroll', checkScroll, { passive: true })
            window.addEventListener('resize', checkScroll)
        }
        return () => {
            el?.removeEventListener('scroll', checkScroll)
            window.removeEventListener('resize', checkScroll)
        }
    }, [marcas])

    const scroll = (direction: 'left' | 'right') => {
        const el = scrollRef.current
        if (!el) return
        const scrollAmount = el.clientWidth * 0.6
        el.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        })
    }

    if (marcas.length === 0) return null

    return (
        <section className="py-10 md:py-14 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/50">
            <div className="max-w-7xl mx-auto px-4">
                {/* Título */}
                <h2 className="text-center text-sm md:text-base font-black uppercase tracking-[0.25em] text-slate-800 dark:text-white mb-8 md:mb-10">
                    Nuestras Marcas
                </h2>

                {/* Container con navegación */}
                <div className="relative">
                    {/* Flecha Izquierda */}
                    {canScrollLeft && (
                        <button
                            onClick={() => scroll('left')}
                            className="absolute -left-2 md:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110 transition-all duration-200"
                            aria-label="Anterior"
                        >
                            <ChevronLeft size={20} className="text-slate-700 dark:text-white" />
                        </button>
                    )}

                    {/* Flecha Derecha */}
                    {canScrollRight && (
                        <button
                            onClick={() => scroll('right')}
                            className="absolute -right-2 md:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110 transition-all duration-200"
                            aria-label="Siguiente"
                        >
                            <ChevronRight size={20} className="text-slate-700 dark:text-white" />
                        </button>
                    )}

                    {/* Fade edges */}
                    {canScrollLeft && (
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-slate-950 to-transparent z-10 pointer-events-none" />
                    )}
                    {canScrollRight && (
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10 pointer-events-none" />
                    )}

                    {/* Scroll Container — fila de círculos */}
                    <div
                        ref={scrollRef}
                        className="flex gap-6 md:gap-8 overflow-x-auto scroll-smooth px-4 py-2 justify-center flex-wrap md:flex-nowrap"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
                    >
                        {marcas.map((marca) => (
                            <Link
                                key={marca.id}
                                href={`/catalogo?marca=${encodeURIComponent(marca.nombre)}`}
                                className="flex-shrink-0 group flex flex-col items-center gap-3 transition-transform duration-200 hover:-translate-y-1"
                            >
                                {/* Círculo del logo */}
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center overflow-hidden border-2 border-slate-800 dark:border-slate-300 shadow-md group-hover:shadow-xl group-hover:shadow-orange-500/20 group-hover:border-orange-500 dark:group-hover:border-orange-400 transition-all duration-300">
                                    {marca.logo_url ? (
                                        <img
                                            src={proxyImageUrl(marca.logo_url)}
                                            alt={marca.nombre}
                                            className="w-[65%] h-[65%] object-contain brightness-0 invert dark:invert-0 dark:brightness-0 group-hover:scale-110 transition-transform duration-300"
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
                </div>
            </div>
        </section>
    )
}
