'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react'

interface Slide {
    id: string;
    title: string;
    description: string;
    image_url: string;
    product_link: string;
    tag?: string;
}

interface HeroProps {
    slides: Slide[]
}

export default function HeroSection({ slides }: HeroProps) {
    const [current, setCurrent] = useState(0)
    const [isHovered, setIsHovered] = useState(false)

    // Si no hay slides, mostrar fallback
    if (!slides || slides.length === 0) return (
        <div className="py-20 flex justify-center text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-900">
            <p className="text-sm">Portada no configurada.</p>
        </div>
    );

    // Auto-advance
    useEffect(() => {
        if (isHovered) return
        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [slides.length, isHovered])

    const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length)
    const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)

    const activeSlide = slides[current]

    return (
        <section
            className="relative w-full h-[65vh] min-h-[450px] md:h-[550px] overflow-hidden bg-slate-100 dark:bg-slate-950 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* BACKGROUND / IMAGE LAYER */}
            {slides.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                    {/* Fondo base oscuro/color para evitar espacios blancos feos si la imagen no carga o es transparente */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900" />

                    <img
                        src={slide.image_url}
                        alt={slide.title}
                        className="absolute inset-0 w-full h-full object-cover md:object-contain md:scale-90"
                        style={{ objectPosition: 'center' }}
                    />

                    {/* Overlay Gradiente SUPERIOR e INFERIOR para leer textos (Estilo Instagram/TikTok) */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 z-20" />
                </div>
            ))}

            {/* CONTENT LAYER (OVERLAY) */}
            <div className="absolute inset-0 z-30 flex flex-col justify-end pb-12 px-6 md:justify-center md:items-start md:px-16 md:pb-0 pointer-events-none">
                <div className="max-w-xl text-center md:text-left mx-auto md:mx-0 pointer-events-auto">

                    {/* Tag pequeña */}
                    {activeSlide.tag && (
                        <span className="inline-block text-[10px] font-bold tracking-[0.2em] uppercase text-white/90 mb-2 border border-white/20 px-2 py-1 rounded bg-black/20 backdrop-blur-sm">
                            {activeSlide.tag}
                        </span>
                    )}

                    {/* Título Principal */}
                    <h1 className="text-3xl md:text-5xl font-black text-white leading-tight drop-shadow-xl mb-2 text-balance">
                        {activeSlide.title}
                    </h1>

                    {/* Descripción Corta */}
                    <p className="text-slate-200 text-sm md:text-lg font-medium mb-6 line-clamp-2 md:line-clamp-3 drop-shadow-md">
                        {activeSlide.description}
                    </p>

                    {/* Botones de Acción */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                        <Link href={activeSlide.product_link} className="w-full sm:w-auto">
                            <button className="w-full sm:w-auto bg-brand-orange hover:bg-orange-600 text-white text-sm font-bold py-3 px-8 rounded shadow-lg shadow-orange-900/50 transition-all transform active:scale-95 flex items-center justify-center gap-2">
                                VER OFERTA
                                <ArrowRight size={16} />
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* CONTROLES (Flechas Minimalistas) */}
            <button
                onClick={(e) => { e.stopPropagation(); prevSlide() }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white hover:bg-black/30 rounded-full transition-all z-40"
            >
                <ChevronLeft size={32} />
            </button>

            <button
                onClick={(e) => { e.stopPropagation(); nextSlide() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white hover:bg-black/30 rounded-full transition-all z-40"
            >
                <ChevronRight size={32} />
            </button>

            {/* Indicadores (Puntos) */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-40">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrent(idx)}
                        className={`transition-all duration-300 rounded-full shadow-sm ${idx === current
                            ? 'bg-white w-6 h-1.5'
                            : 'bg-white/40 w-1.5 h-1.5 hover:bg-white/70'
                            }`}
                    />
                ))}
            </div>
        </section>
    )
}
