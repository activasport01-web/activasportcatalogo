'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
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
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)

    useEffect(() => {
        loadMarcas()
    }, [])

    const loadMarcas = async () => {
        const { data, error } = await supabase
            .from('marcas')
            .select('*')
            .eq('active', true)
            .not('logo_url', 'is', null)
            .order('nombre')

        if (data) {
            setMarcas(data)
        }
    }

    // Auto-play carousel
    useEffect(() => {
        if (!isAutoPlaying || marcas.length === 0) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % marcas.length)
        }, 4000)

        return () => clearInterval(interval)
    }, [isAutoPlaying, marcas.length])

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % marcas.length)
        setIsAutoPlaying(false)
    }

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + marcas.length) % marcas.length)
        setIsAutoPlaying(false)
    }

    const goToSlide = (index: number) => {
        setCurrentIndex(index)
        setIsAutoPlaying(false)
    }

    if (marcas.length === 0) return null

    const currentMarca = marcas[currentIndex]

    return (
        <section className="py-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="max-w-7xl mx-auto md:px-4">
                {/* Header */}
                <div className="flex items-center justify-between px-4 mb-4 md:mb-6">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            Nuestras Marcas
                        </h2>
                    </div>
                    <div className="text-xs font-bold text-slate-400">
                        {currentIndex + 1} / {marcas.length}
                    </div>
                </div>

                {/* Carousel Container */}
                <div className="relative px-2 md:px-0">
                    {/* Navigation Buttons (Hidden on mobile for clean look, visible on desktop) */}
                    <button
                        onClick={prevSlide}
                        className="flex absolute left-2 md:-left-4 top-1/2 -translate-y-1/2 z-20 bg-white/40 backdrop-blur-md md:bg-white dark:bg-black/30 md:dark:bg-slate-800 hover:bg-slate-50 border border-white/20 md:border-slate-200 dark:border-slate-700 p-1.5 md:p-3 rounded-full shadow-sm md:shadow-lg transition-all hover:scale-110"
                        aria-label="Anterior"
                    >
                        <ChevronLeft size={18} className="text-slate-900 dark:text-white md:w-6 md:h-6" />
                    </button>

                    <button
                        onClick={nextSlide}
                        className="flex absolute right-2 md:-right-4 top-1/2 -translate-y-1/2 z-20 bg-white/40 backdrop-blur-md md:bg-white dark:bg-black/30 md:dark:bg-slate-800 hover:bg-slate-50 border border-white/20 md:border-slate-200 dark:border-slate-700 p-1.5 md:p-3 rounded-full shadow-sm md:shadow-lg transition-all hover:scale-110"
                        aria-label="Siguiente"
                    >
                        <ChevronRight size={18} className="text-slate-900 dark:text-white md:w-6 md:h-6" />
                    </button>

                    {/* Main Slide */}
                    <Link
                        href={`/catalogo?marca=${encodeURIComponent(currentMarca.nombre)}`}
                        className="block group"
                    >
                        <div className="relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 shadow-sm transition-all hover:shadow-md h-[250px] md:h-[350px]">
                            {/* Logo Area - FULL WIDTH/HEIGHT BACKGROUND */}
                            <div className="absolute inset-0 flex items-center justify-center bg-white">
                                {currentMarca.logo_url ? (
                                    <img
                                        src={currentMarca.logo_url}
                                        alt={currentMarca.nombre}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-6xl font-black text-slate-300">
                                        {currentMarca.nombre.charAt(0)}
                                    </div>
                                )}
                            </div>

                            {/* Brand Name & CTA Bar - Overlay at bottom */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 md:p-6 flex justify-between items-end">
                                <div>
                                    <h3 className="text-white text-xl md:text-3xl font-black uppercase tracking-wider drop-shadow-md">
                                        {currentMarca.nombre}
                                    </h3>
                                    <p className="text-white/80 text-xs md:text-sm font-medium mt-1">Colección 2024</p>
                                </div>
                                <span className="bg-white text-black text-xs font-bold px-4 py-2 rounded-full uppercase shadow-lg transform translate-y-0 group-hover:-translate-y-1 transition-transform">
                                    Ver Todo
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Puntos (Dots) para navegación minimalista */}
                <div className="flex justify-center gap-1.5 mt-4">
                    {marcas.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex
                                ? 'bg-slate-800 dark:bg-white w-6'
                                : 'bg-slate-300 dark:bg-slate-700 w-1.5'
                                }`}
                            aria-label={`Ir a marca ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}
