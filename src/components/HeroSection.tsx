'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronLeft, MessageCircle } from 'lucide-react'
import { proxyImageUrl } from '@/lib/supabase'

interface Slide {
    id: string;
    title: string;
    subtitle?: string;
    description: string;
    image_url: string | null;
    link: string;
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
        <div className="h-[60vh] flex items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900">
            <p className="text-sm">Portada no configurada. Ve a Admin → Portada.</p>
        </div>
    );

    // Auto-advance cada 6 segundos
    useEffect(() => {
        if (isHovered || slides.length <= 1) return
        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length)
        }, 6000)
        return () => clearInterval(interval)
    }, [slides.length, isHovered, current])

    const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length)
    const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)

    const activeSlide = slides[current]

    // WhatsApp
    const handleWhatsApp = () => {
        const message = 'Hola Activa Sport, me gustaría ver el catálogo de calzados y conocer más sobre ventas al por mayor.'
        window.open(`https://api.whatsapp.com/send?phone=59173643433&text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
    }

    return (
        <>

            <section
                className="relative w-full h-[70vh] md:h-[85vh] min-h-[480px] max-h-[900px] overflow-hidden bg-slate-950"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
            {/* ── SLIDES DE FONDO ── */}
            {slides.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`absolute inset-0 transition-all duration-[1200ms] ease-in-out ${
                        index === current
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-[1.05]'
                    }`}
                >
                    {slide.image_url ? (
                        slide.image_url.toLowerCase().includes('.mp4') ? (
                            <video
                                src={proxyImageUrl(slide.image_url)}
                                autoPlay
                                muted
                                loop
                                playsInline
                                disablePictureInPicture
                                preload="auto"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src={proxyImageUrl(slide.image_url)}
                                alt={slide.title}
                                className="absolute inset-0 w-full h-full object-cover"
                                loading="eager"
                                fetchPriority="high"
                                decoding="async"
                            />
                        )
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />
                    )}
                </div>
            ))}

            {/* ── OVERLAY GRADIENTE (estilo Nike: más oscuro abajo) ── */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5 z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 z-10" />

            {/* ── CONTENIDO CENTRAL (estilo Nike: centrado abajo) ── */}
            <div className="absolute inset-0 z-20 flex flex-col justify-end items-center text-center px-6 pb-20 md:pb-24">

                {/* Tag */}
                {activeSlide.tag && (
                    <span className="text-[11px] md:text-xs font-medium tracking-[0.25em] uppercase text-white/70 mb-3 transition-all duration-500">
                        {activeSlide.tag}
                    </span>
                )}

                {/* Título Principal */}
                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[0.95] mb-3 md:mb-4 max-w-4xl text-balance drop-shadow-2xl transition-all duration-500">
                    {activeSlide.title}
                </h1>

                {/* Descripción */}
                {activeSlide.description && (
                    <p className="text-white/60 text-xs sm:text-sm md:text-base font-medium mb-6 md:mb-8 max-w-lg line-clamp-2 transition-all duration-500">
                        {activeSlide.description}
                    </p>
                )}

                {/* Botones CTA (estilo Nike: pill buttons) */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 mt-2">
                    <button
                        onClick={handleWhatsApp}
                        className="bg-green-500 hover:bg-green-600 text-white text-xs md:text-sm font-bold py-3 md:py-3.5 px-8 md:px-10 rounded-full transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2"
                    >
                        <MessageCircle size={16} />
                        Consultar
                    </button>
                </div>
            </div>

            {/* ── FLECHAS DE NAVEGACIÓN ── */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); prevSlide() }}
                        className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-30 p-2 text-white/30 hover:text-white/80 transition-all"
                        aria-label="Anterior"
                    >
                        <ChevronLeft size={28} strokeWidth={1.5} className="md:w-9 md:h-9" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); nextSlide() }}
                        className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-30 p-2 text-white/30 hover:text-white/80 transition-all"
                        aria-label="Siguiente"
                    >
                        <ChevronRight size={28} strokeWidth={1.5} className="md:w-9 md:h-9" />
                    </button>
                </>
            )}

            {/* ── INDICADORES / DOTS (estilo Nike: barras pequeñas) ── */}
            {slides.length > 1 && (
                <div className="absolute bottom-8 md:bottom-10 left-0 right-0 flex justify-center gap-2 z-30">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrent(idx)}
                            className={`transition-all duration-500 rounded-full h-[3px] ${
                                idx === current
                                    ? 'bg-white w-8'
                                    : 'bg-white/30 w-4 hover:bg-white/60'
                            }`}
                        />
                    ))}
                </div>
            )}
        </section>
        </>
    )
}
