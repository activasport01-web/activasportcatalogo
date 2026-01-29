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

    // Auto Play Logic
    useEffect(() => {
        if (promos.length > 1 && !showModal) {
            startAutoPlay()
        }
        return () => stopAutoPlay()
    }, [currentIndex, promos.length, showModal])

    const startAutoPlay = () => {
        stopAutoPlay()
        autoPlayRef.current = setTimeout(() => {
            nextSlide()
        }, 5000) // 5 seconds per slide
    }

    const stopAutoPlay = () => {
        if (autoPlayRef.current) {
            clearTimeout(autoPlayRef.current)
            autoPlayRef.current = null
        }
    }

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % promos.length)
    }

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + promos.length) % promos.length)
    }

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
        const message = `Hola! Estoy interesado en la oferta: *${promo.titulo}*. ¿Sigue disponible?`
        const url = `https://wa.me/59163448209?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
    }

    if (loading) return null
    if (promos.length === 0) return null

    const currentPromo = promos[currentIndex]

    return (
        <section className="relative z-20 max-w-7xl mx-auto px-4 py-4 -mt-6 mb-6">
            <div
                className={`
                    relative w-full overflow-hidden rounded-3xl shadow-2xl transition-all duration-500
                    bg-gradient-to-r ${currentPromo.color_fondo || 'from-slate-800 to-slate-900'}
                    group
                `}
                onMouseEnter={stopAutoPlay}
                onMouseLeave={startAutoPlay}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay pointer-events-none"></div>

                <div className="flex flex-col md:flex-row items-center relative z-10 min-h-[220px] md:min-h-[280px]">

                    {/* Contenido Texto (Izquierda) */}
                    <div className="flex-1 p-8 md:p-12 md:pr-4 flex flex-col justify-center items-start w-full text-center md:text-left">
                        <span className="inline-block bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] sm:text-xs font-black tracking-widest uppercase mb-3 border border-white/10 shadow-sm">
                            Oferta Especial
                        </span>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-3 drop-shadow-md cursor-pointer hover:underline decoration-brand-orange/50 underline-offset-4" onClick={() => handleOpenPromo(currentPromo)}>
                            {currentPromo.titulo}
                        </h2>
                        <p className="text-white/90 text-sm md:text-lg font-medium leading-relaxed mb-6 max-w-xl mx-auto md:mx-0">
                            {currentPromo.descripcion}
                        </p>

                        <button
                            onClick={() => handleOpenPromo(currentPromo)}
                            className="bg-white text-slate-900 text-sm font-bold px-8 py-3 rounded-full hover:bg-slate-100 hover:scale-105 transition-all shadow-xl flex items-center gap-2 group/btn mx-auto md:mx-0"
                        >
                            {currentPromo.texto_boton || 'Ver Detalles'}
                            <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Imagen Principal (Derecha) */}
                    <div className="md:w-1/2 h-full flex items-center justify-center p-6 md:p-0 relative cursor-pointer" onClick={() => handleOpenPromo(currentPromo)}>
                        {currentPromo.imagen_url ? (
                            <div className="relative w-full max-w-xs md:max-w-md aspect-square md:aspect-auto md:h-full flex items-center justify-center">
                                {/* Glow Effect behind image */}
                                <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full transform scale-75"></div>

                                <img
                                    src={currentPromo.imagen_url}
                                    alt="Promo"
                                    className="relative z-10 w-full h-auto object-contain max-h-[200px] md:max-h-[300px] drop-shadow-2xl transform hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                        ) : (
                            <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl">
                                <Gift size={80} className="text-white/80" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Controls (Only if > 1 slide) */}
                {promos.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.preventDefault(); prevSlide() }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); nextSlide() }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                        >
                            <ChevronRight size={24} />
                        </button>

                        {/* Dots */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {promos.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

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
