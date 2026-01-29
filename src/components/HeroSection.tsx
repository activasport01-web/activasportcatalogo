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
        <div className="py-20 flex justify-center text-gray-400 dark:text-slate-500 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-slate-900 dark:to-slate-950">
            <p className="text-lg">Bienvenido. El administrador aún no configura la portada.</p>
        </div>
    );

    // Auto-advance
    useEffect(() => {
        if (isHovered) return // Pausar si el mouse está encima

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
            className="relative bg-gradient-to-br from-slate-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-950 overflow-hidden min-h-[600px] flex items-center transition-colors duration-500"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="max-w-7xl mx-auto px-4 w-full pt-10 pb-20 md:py-10">
                <div className="grid md:grid-cols-2 gap-12 items-center">

                    {/* LADO IZQUIERDO: Texto con transición */}
                    <div className="space-y-8 z-10 animate-fade-in" key={`text-${current}`}>
                        {activeSlide.tag && (
                            <span className="inline-block text-white font-black tracking-widest uppercase text-xs bg-brand-orange px-4 py-2 rounded-full ring-2 ring-orange-400/50 animate-pulse border border-brand-black/10 shadow-lg shadow-orange-500/30">
                                {activeSlide.tag}
                            </span>
                        )}

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-slate-100 leading-tight drop-shadow-sm transition-colors duration-300">
                            {activeSlide.title}
                        </h1>

                        <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl leading-relaxed max-w-lg font-medium transition-colors duration-300">
                            {activeSlide.description}
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link href={activeSlide.product_link}>
                                <button className="bg-brand-black hover:bg-brand-orange hover:text-white text-brand-orange font-bold py-4 px-10 rounded-full shadow-xl transition-all transform hover:scale-105 hover:shadow-2xl flex items-center gap-3 group border border-brand-orange/50">
                                    Ver Ahora
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </Link>
                            <Link href="/catalogo">
                                <button className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold py-4 px-8 rounded-full shadow-md border-2 border-slate-200 dark:border-slate-700 transition-all hover:border-brand-orange/50 dark:hover:border-slate-600">
                                    Explorar Todo
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* LADO DERECHO: Imagen con transición */}
                    <div className="relative h-[400px] md:h-[500px] w-full flex items-center justify-center">
                        {/* Círculo decorativo dinámico */}
                        <div className={`absolute inset-0 rounded-full blur-3xl opacity-30 dark:opacity-20 scale-110 transition-colors duration-1000 ${current % 2 === 0 ? 'bg-gradient-to-tr from-brand-orange to-slate-300 dark:to-slate-700' : 'bg-gradient-to-tr from-slate-900 dark:from-black to-orange-600'}`}></div>

                        {/* Imagen del producto con bordes suaves */}
                        <div className="relative z-10 w-full h-full flex items-center justify-center p-6" key={`img-${current}`}>
                            <div className="relative group/img">
                                {/* Efecto de resplandor detrás de la imagen */}
                                <div className="absolute inset-0 bg-black/10 dark:bg-white/5 rounded-[3rem] blur-xl transform translate-y-4 scale-95 opacity-0 group-hover/img:opacity-100 transition-opacity duration-500"></div>

                                <img
                                    src={activeSlide.image_url}
                                    alt={activeSlide.title}
                                    className="relative max-w-full max-h-[450px] object-contain rounded-[3rem] shadow-2xl animate-slide-up hover:scale-105 transition-all duration-700"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTROLES DE NAVEGACIÓN */}

            {/* Flechas (Solo visibles en desktop o hover) */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-slate-800 dark:text-white transition-all hover:scale-110 z-20 md:opacity-0 md:group-hover:opacity-100"
            >
                <ChevronLeft size={24} />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-slate-800 dark:text-white transition-all hover:scale-110 z-20 md:opacity-0 md:group-hover:opacity-100"
            >
                <ChevronRight size={24} />
            </button>

            {/* Dots (Indicadores inferiores) */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 z-20">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrent(idx)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${idx === current
                            ? 'bg-brand-black dark:bg-white w-8 border border-brand-orange'
                            : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-500'
                            }`}
                        aria-label={`Ir a diapositiva ${idx + 1}`}
                    />
                ))}
            </div>

            {/* Decoración de ondas inferior */}
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
                <svg viewBox="0 0 1440 100" fill="none" className="w-full text-white dark:text-slate-950 transition-colors duration-300" preserveAspectRatio="none">
                    <path d="M0 100L60 90C120 80 240 60 360 50C480 40 600 40 720 45C840 50 960 60 1080 65C1200 70 1320 70 1380 70L1440 70V100H1380C1320 100 1200 100 1080 100C960 100 840 100 720 100C600 100 480 100 360 100C240 100 120 100 60 100H0Z" fill="currentColor" />
                </svg>
            </div>
        </section>
    )
}
