'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Link as LinkIcon, Eye, Heart, ShoppingBag } from 'lucide-react'
import { useFavorites } from '@/context/FavoritesContext'

export default function ProductCard({ zapato, onQuickView }: { zapato: any, onQuickView?: (product: any) => void }) {
    const [isHovered, setIsHovered] = useState(false)
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
                        src={zapato.url_imagen}
                        alt={zapato.nombre}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                    />

                    {/* Imagen Secundaria (Hover en Desktop) */}
                    {zapato.imagen_hover && (
                        <img
                            src={zapato.imagen_hover}
                            alt={`${zapato.nombre} vista 2`}
                            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out opacity-0 group-hover:opacity-100"
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

                    {/* Colores (Puntos pequeños) */}
                    {colores && colores.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                            {colores.slice(0, 3).map((c: any, i: number) => {
                                const colorHex = typeof c === 'object' ? c.color : c;
                                return (
                                    <div key={i} className="w-2 h-2 rounded-full border border-slate-200" style={{ backgroundColor: colorHex }}></div>
                                )
                            })}
                            {colores.length > 3 && <span className="text-[8px] text-slate-400">+{colores.length - 3}</span>}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    )
}
