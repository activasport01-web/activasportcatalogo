'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowRight, Gift, ChevronRight, ChevronLeft, X, MessageCircle } from 'lucide-react'

type Promocion = {
    id: string
    titulo: string
    descripcion: string
    imagen_url?: string
    color_fondo: string
    texto_boton?: string
    link_boton?: string // Not used for linking anymore, kept for compatibility
}

export default function PromoCarousel() {
    const [promos, setPromos] = useState<Promocion[]>([])
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [showModal, setShowModal] = useState(false)
    const [selectedPromo, setSelectedPromo] = useState<Promocion | null>(null)
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        fetchPromos()
    }, [])

    const fetchPromos = async () => {
        try {
            const { data, error } = await supabase
                .from('promociones')
                .select('*')
                .eq('activo', true)
                .order('orden', { ascending: true })

            if (data) {
                setPromos(data)
            }
        } catch (error) {
            console.error("Error cargando promos:", error)
        } finally {
            setLoading(false)
        }
    }

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % promos.length)
    }

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + promos.length) % promos.length)
    }

    const stopAutoPlay = () => {
        if (autoPlayRef.current) {
            clearTimeout(autoPlayRef.current)
            autoPlayRef.current = null
        }
    }

    const startAutoPlay = () => {
        stopAutoPlay()
        autoPlayRef.current = setTimeout(() => {
            nextSlide()
        }, 5000) // 5 seconds per slide
    }

    // Auto Play Logic
    useEffect(() => {
        if (promos.length > 1 && !showModal) {
            startAutoPlay()
        }
        return () => stopAutoPlay()
    }, [currentIndex, promos.length, showModal])

    const handleOpenPromo = (promo: Promocion) => {
        setSelectedPromo(promo)
        setShowModal(true)
        stopAutoPlay()
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setSelectedPromo(null)
        startAutoPlay()
    }

    const handleConsultar = (promo: Promocion) => {
        const message = `Hola Activa Sport, me interesa esta Oferta Especial:
${promo.imagen_url ? `*Imagen:* ${promo.imagen_url}\n` : ''}
🔥 *Promo:* ${promo.titulo}
📝 *Detalle:* ${promo.descripcion}

🔗 *Visto en:* ${window.location.href}`

        const url = `https://wa.me/59163448209?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
    }

    if (loading) return null
    if (promos.length === 0) return null

    const currentPromo = promos[currentIndex]

    return (
        <section className="relative z-20 max-w-7xl mx-auto px-4 mt-8 mb-12">
            {/* Contenedor Principal del Slide (Full Image Background) */}
            <div
                className="relative w-full overflow-hidden rounded-2xl shadow-lg transition-all duration-500 group min-h-[400px] md:min-h-[450px]"
                onMouseEnter={stopAutoPlay}
                onMouseLeave={startAutoPlay}
                onClick={() => handleOpenPromo(currentPromo)}
            >
                {/* 1. IMAGEN DE FONDO (FULL BLEED) */}
                {currentPromo.imagen_url ? (
                    <img
                        src={currentPromo.imagen_url}
                        alt="Promo"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    // Fallback si no hay imagen: Fondo de color sólido
                    <div className={`absolute inset-0 w-full h-full bg-gradient-to-r ${currentPromo.color_fondo || 'from-orange-500 to-orange-600'}`} />
                )}

                {/* 2. OVERLAY GRADIENTE (Para leer el texto) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                {/* 3. CONTENIDO (Texto Superpuesto Abajo) */}
                <div className="absolute inset-0 flex flex-col justify-end items-center text-center p-8 pb-12 z-10 pointer-events-none">
                    <span className="inline-block bg-brand-orange text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-3 shadow-lg pointer-events-auto">
                        Oferta Especial
                    </span>

                    <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-2 drop-shadow-xl pointer-events-auto">
                        {currentPromo.titulo}
                    </h2>

                    {currentPromo.descripcion && (
                        <p className="text-white/90 text-sm md:text-lg font-medium leading-relaxed mb-6 max-w-xl drop-shadow-md hidden md:block pointer-events-auto">
                            {currentPromo.descripcion}
                        </p>
                    )}

                    <div className="pointer-events-auto">
                        <button className="bg-white text-black text-xs md:text-sm font-bold px-8 py-3 rounded-full hover:bg-slate-100 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2 group/btn">
                            {currentPromo.texto_boton || 'Ver Oferta'}
                            <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Dots dentro del contenedor para móvil principalmente */}
                <div className="absolute top-4 right-4 flex gap-1.5 z-20 md:hidden bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
                    {promos.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-3' : 'bg-white/40'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Navigation Buttons (Outside Container - Clean Style) */}
            {promos.length > 1 && (
                <>
                    {/* Botón Izquierdo - Sutil en Móvil */}
                    <button
                        onClick={(e) => { e.preventDefault(); prevSlide() }}
                        className="flex absolute left-2 md:left-[-24px] top-1/2 -translate-y-1/2 w-8 h-8 md:w-14 md:h-14 bg-white/30 backdrop-blur-md md:bg-white text-white md:text-slate-700 rounded-full shadow-sm md:shadow-lg items-center justify-center border border-white/20 md:border-slate-100 z-30 hover:scale-110 transition-transform"
                        aria-label="Anterior"
                    >
                        <ChevronLeft size={18} className="md:w-8 md:h-8 drop-shadow-md md:drop-shadow-none" strokeWidth={2.5} />
                    </button>

                    {/* Botón Derecho */}
                    <button
                        onClick={(e) => { e.preventDefault(); nextSlide() }}
                        className="flex absolute right-2 md:right-[-24px] top-1/2 -translate-y-1/2 w-8 h-8 md:w-14 md:h-14 bg-white/30 backdrop-blur-md md:bg-white text-white md:text-slate-700 rounded-full shadow-sm md:shadow-lg items-center justify-center border border-white/20 md:border-slate-100 z-30 hover:scale-110 transition-transform"
                        aria-label="Siguiente"
                    >
                        <ChevronRight size={18} className="md:w-8 md:h-8 drop-shadow-md md:drop-shadow-none" strokeWidth={2.5} />
                    </button>
                </>
            )}

            {/* Modal de Detalle de Oferta */}
            {showModal && selectedPromo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCloseModal}></div>
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-slide-up border border-white/10">
                        {/* Header con Imagen de fondo difuminada */}
                        <div className="relative h-48 overflow-hidden">
                            {selectedPromo.imagen_url && (
                                <div className="absolute inset-0">
                                    <img src={selectedPromo.imagen_url} className="w-full h-full object-cover blur-xl opacity-50" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-slate-900"></div>
                                </div>
                            )}
                            <button onClick={handleCloseModal} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-20">
                                <X size={20} />
                            </button>
                            <div className="absolute -bottom-10 left-0 right-0 flex justify-center z-10">
                                {selectedPromo.imagen_url ? (
                                    <img
                                        src={selectedPromo.imagen_url}
                                        className="w-40 h-40 object-contain drop-shadow-xl hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-32 h-32 bg-brand-orange/20 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800">
                                        <Gift size={48} className="text-brand-orange" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Contenido */}
                        <div className="pt-14 pb-8 px-8 text-center">
                            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
                                {selectedPromo.titulo}
                            </h3>
                            <div className="w-16 h-1 bg-brand-orange mx-auto mb-6 rounded-full"></div>

                            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-8">
                                {selectedPromo.descripcion}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => handleConsultar(selectedPromo)}
                                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1"
                                >
                                    <MessageCircle size={24} />
                                    Consultar Disponibilidad
                                </button>
                                <button
                                    onClick={handleCloseModal}
                                    className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold py-4 px-8 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                            <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
                                * Se abrirá un chat de WhatsApp con el dueño
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}
