'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Link as LinkIcon, Eye, Heart, ShoppingBag } from 'lucide-react'
import { useFavorites } from '@/context/FavoritesContext'
import { proxyImageUrl } from '@/lib/supabase'

export default function ProductCard({ zapato, onQuickView }: { zapato: any, onQuickView?: (product: any) => void }) {
    const [isHovered, setIsHovered] = useState(false)
    const [activeColorIdx, setActiveColorIdx] = useState<number | null>(null)
    const [hoveredColorIdx, setHoveredColorIdx] = useState<number | null>(null)
    const { toggleFavorite, isFavorite } = useFavorites()
    const liked = isFavorite(zapato.id)

    const handleQuickView = (e: React.MouseEvent) => {
        e.preventDefault() // Evitar ir al link
        e.stopPropagation()
        if (onQuickView) onQuickView(zapato)
    }

    const handleLike = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        toggleFavorite({
            id: zapato.id,
            nombre: zapato.nombre,
            precio: zapato.precio,
            url_imagen: zapato.url_imagen,
            categoria: zapato.categoria || '',
            disponible: zapato.disponible ?? true
        })
    }

    // Colores de ejemplo si no hay en la BD
    const colores = zapato.colores || ['#000000', '#FFFFFF', '#1E40AF', '#DC2626']

    const currentDisplayColorIdx = hoveredColorIdx !== null ? hoveredColorIdx : activeColorIdx;
    const currentDisplayColor = currentDisplayColorIdx !== null ? colores[currentDisplayColorIdx] : null;

    let displayImage = zapato.url_imagen;
    if (currentDisplayColor && typeof currentDisplayColor === 'object' && currentDisplayColor.imagen) {
        displayImage = currentDisplayColor.imagen;
    }

    return (
        <Link href={`/producto/${zapato.id}`} className="group block h-full">
            <div className="flex flex-col h-full bg-white dark:bg-slate-900/50 rounded-xl overflow-hidden border border-transparent dark:border-slate-800 p-2 transition-all hover:shadow-lg">
                {/* Contenedor Imagen (Cuadrado Universal) */}
                <div className="relative aspect-square overflow-hidden mb-2 rounded-lg bg-slate-100 dark:bg-slate-800">

                    {/* Badges (Esquina Superior Izquierda) */}
                    <div className="absolute top-0 left-0 z-20 flex flex-col gap-1 p-1">
                        {/* Badges de Estado */}
                        {zapato.etiquetas?.includes('ultimos_pares') && (
                            <span className="bg-yellow-400 text-black text-[9px] uppercase font-bold px-1.5 py-0.5 shadow-sm animate-pulse border border-yellow-500/20">
                                ÚLTIMOS
                            </span>
                        )}
                        {zapato.etiquetas?.includes('proximamente') && (
                            <span className="bg-blue-600 text-white text-[9px] uppercase font-bold px-1.5 py-0.5 shadow-sm border border-blue-500/20">
                                PRONTO
                            </span>
                        )}
                        {zapato.etiquetas?.includes('nuevo') && (
                            <span className="bg-white/90 text-black text-[9px] uppercase font-bold px-1.5 py-0.5 shadow-sm border border-black/5">
                                NEW
                            </span>
                        )}
                        {zapato.etiquetas?.includes('oferta') && (
                            <span className="bg-red-600 text-white text-[9px] uppercase font-bold px-1.5 py-0.5 shadow-sm">
                                SALE
                            </span>
                        )}
                        {!zapato.disponible && (
                            <span className="bg-black text-white text-[9px] uppercase font-bold px-1.5 py-0.5 shadow-sm">
                                AGOTADO
                            </span>
                        )}
                    </div>

                    {/* Botón Favorito (Flotando arriba derecha) - Más pequeño */}
                    <button
                        onClick={handleLike}
                        className="absolute top-1 right-1 z-20 p-1.5 rounded-full bg-white/50 backdrop-blur-sm hover:bg-white text-slate-900 transition-all active:scale-95"
                    >
                        <Heart size={16} className={liked ? "fill-red-500 text-red-500" : "text-slate-900"} strokeWidth={1.5} />
                    </button>

                    {/* Imagen Principal */}
                    <img
                        src={proxyImageUrl(displayImage)}
                        alt={zapato.nombre}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                    />

                    {/* Imagen Secundaria (Hover en Desktop) solo si no se ha seleccionado/mirado otra variante */}
                    {zapato.imagen_hover && (
                        <img
                            src={proxyImageUrl(zapato.imagen_hover)}
                            alt={`${zapato.nombre} vista 2`}
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out opacity-0 ${currentDisplayColorIdx === null ? 'group-hover:opacity-100' : ''}`}
                        />
                    )}
                </div>

                {/* Info del Producto (Ultra Compacto Mobile) */}
                <div className="flex flex-col gap-0.5 px-0.5">
                    <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate">
                        {zapato.marca || zapato.categoria || 'Genérico'}
                    </h3>
                    <h2 className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-medium leading-tight line-clamp-2 min-h-[2.5em]">
                        {zapato.nombre}
                    </h2>

                    <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {zapato.precio ? `$${Number(zapato.precio).toLocaleString('es-AR')}` : 'Consultar'}
                        </span>

                        <button className="text-brand-orange hover:text-orange-600 transition-colors">
                            <div className="text-[9px] font-bold border border-brand-orange px-1.5 py-0.5 rounded-sm uppercase">
                                +
                            </div>
                        </button>
                    </div>

                    {/* Colores (Miniaturas Interactivas) */}
                    {colores && colores.length > 0 && (
                        <div className="flex gap-2 mt-2 py-1 overflow-x-auto no-scrollbar" onMouseLeave={() => setHoveredColorIdx(null)}>
                            {colores.slice(0, 4).map((c: any, i: number) => {
                                const colorHex = typeof c === 'object' ? c.color : c;
                                const hasImage = typeof c === 'object' && c.imagen;
                                const isSelected = activeColorIdx === i;

                                return (
                                    <button
                                        key={i}
                                        title={typeof c === 'object' ? c.nombre : colorHex}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setActiveColorIdx(i);
                                            setHoveredColorIdx(null); // Clear hover so click takes priority
                                        }}
                                        onMouseEnter={() => {
                                            if (hasImage) setHoveredColorIdx(i);
                                        }}
                                        onMouseLeave={() => {
                                            setHoveredColorIdx(null);
                                        }}
                                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-md overflow-hidden shrink-0 transition-all cursor-pointer ${
                                            isSelected
                                                ? 'border-2 border-slate-900 dark:border-white shadow-md ring-2 ring-slate-200 dark:ring-slate-800 scale-105 relative z-10'
                                                : 'border border-slate-200 dark:border-slate-700 hover:border-slate-400 hover:shadow-sm'
                                        }`}
                                    >
                                        {hasImage ? (
                                            <img
                                                src={proxyImageUrl(c.imagen)}
                                                alt={c.nombre || 'Variante'}
                                                className="w-full h-full object-cover bg-white"
                                            />
                                        ) : (
                                            <div
                                                className="w-full h-full"
                                                style={{ backgroundColor: colorHex }}
                                            ></div>
                                        )}
                                    </button>
                                );
                            })}
                            {colores.length > 4 && (
                                <span className="text-xs text-slate-400 font-bold self-center ml-1">
                                    +{colores.length - 4}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    )
}
