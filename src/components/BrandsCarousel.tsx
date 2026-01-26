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
        <section className="py-12 bg-white">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-slate-900 mb-2">
                        Nuestras Marcas
                    </h2>
                    <p className="text-slate-500 text-sm">
                        Explora productos de las mejores marcas
                    </p>
                </div>

                {/* Carousel Container */}
                <div className="relative">
                    {/* Navigation Buttons */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
                        aria-label="Anterior"
                    >
                        <ChevronLeft size={24} className="text-slate-700" />
                    </button>

                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
                        aria-label="Siguiente"
                    >
                        <ChevronRight size={24} className="text-slate-700" />
                    </button>

                    {/* Main Slide */}
                    <Link
                        href={`/catalogo?marca=${encodeURIComponent(currentMarca.nombre)}`}
                        className="block group"
                    >
                        <div className="relative overflow-hidden rounded-2xl bg-slate-50 transition-all hover:shadow-xl">
                            {/* Logo - Aspect ratio 16:9 */}
                            <div className="aspect-video flex items-center justify-center p-12">
                                {currentMarca.logo_url ? (
                                    <img
                                        src={currentMarca.logo_url}
                                        alt={currentMarca.nombre}
                                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="text-8xl font-black text-slate-200">
                                        {currentMarca.nombre.charAt(0)}
                                    </div>
                                )}
                            </div>

                            {/* Brand Name Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                                <h3 className="text-white text-2xl font-black mb-1">
                                    {currentMarca.nombre}
                                </h3>
                                <p className="text-white/80 text-sm">
                                    Ver todos los modelos →
                                </p>
                            </div>
                        </div>
                    </Link>

                    {/* Counter */}
                    <div className="text-center mt-4 text-slate-400 text-sm font-medium">
                        {currentIndex + 1} / {marcas.length}
                    </div>
                </div>

                {/* Dots */}
                <div className="flex justify-center gap-2 mt-6">
                    {marcas.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`h-2 rounded-full transition-all ${index === currentIndex
                                    ? 'bg-orange-500 w-8'
                                    : 'bg-slate-300 hover:bg-slate-400 w-2'
                                }`}
                            aria-label={`Ir a marca ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Thumbnails */}
                <div className="flex justify-center gap-3 mt-8">
                    {marcas.map((marca, index) => (
                        <button
                            key={marca.id}
                            onClick={() => goToSlide(index)}
                            className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === currentIndex
                                    ? 'border-orange-500 scale-110 shadow-md'
                                    : 'border-slate-200 opacity-50 hover:opacity-100 hover:border-slate-300'
                                }`}
                        >
                            <div className="w-full h-full bg-white p-1.5 flex items-center justify-center">
                                {marca.logo_url ? (
                                    <img
                                        src={marca.logo_url}
                                        alt={marca.nombre}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="text-lg font-black text-slate-300">
                                        {marca.nombre.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    )
}
