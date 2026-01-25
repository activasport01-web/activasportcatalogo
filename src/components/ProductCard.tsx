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
        <Link href={`/producto/${zapato.id}`} className="group block">
            <div
                className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 relative border border-slate-100 h-full flex flex-col"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Imagen */}
                <div className="relative h-64 overflow-hidden bg-slate-50 flex items-center justify-center p-6">
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/5 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>

                    {/* Imagen Principal */}
                    <img
                        src={zapato.url_imagen}
                        alt={zapato.nombre}
                        className={`absolute inset-0 w-full h-full object-contain mix-blend-multiply p-6 transition-all duration-700 ease-out ${isHovered && zapato.imagen_hover ? 'opacity-0' : 'opacity-100 scale-100'} ${isHovered && !zapato.imagen_hover ? 'scale-110' : ''}`}
                    />

                    {/* Imagen Secundaria (Hover) - Solo si existe */}
                    {zapato.imagen_hover && (
                        <img
                            src={zapato.imagen_hover}
                            alt={`${zapato.nombre} vista 2`}
                            className={`absolute inset-0 w-full h-full object-contain mix-blend-multiply p-6 transition-all duration-700 ease-out ${isHovered ? 'opacity-100 scale-110' : 'opacity-0 scale-95'}`}
                        />
                    )}

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {zapato.etiquetas?.includes('nuevo') && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                                Nuevo
                            </span>
                        )}
                        {/* Badge de Origen (Solo si es importado para destacar) */}
                        {zapato.origen && zapato.origen !== 'Nacional' && (
                            <span className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                                <span className="text-sm">{zapato.origen === 'Brazilero' ? '🇧🇷' : '🇵🇪'}</span>
                                {zapato.origen}
                            </span>
                        )}
                        {!zapato.disponible && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                                Agotado
                            </span>
                        )}
                        {/* Badge de Oferta (simulado si precio es bajo o tiene tag) */}
                        {zapato.precio < 150 && (
                            <span className="bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                                Oferta
                            </span>
                        )}
                    </div>

                    {/* Acciones Rápidas (Overlay) */}
                    <div className={`absolute bottom-4 left-0 right-0 flex justify-center gap-3 transition-all duration-300 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                        <button
                            onClick={handleQuickView}
                            className="bg-brand-black text-neon-500 p-3 rounded-full shadow-lg hover:bg-neon-500 hover:text-brand-black transition-colors flex items-center justify-center group/btn border border-neon-500/50"
                            title="Vista Rápida"
                        >
                            <Eye size={20} />
                        </button>
                    </div>
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col flex-grow">
                    <div className="mb-2">
                        <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">{zapato.categoria}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight group-hover:text-neon-600 transition-colors line-clamp-2">
                        {zapato.nombre}
                    </h3>

                    <div className="flex items-center gap-2 mb-4">
                        {/* Puntos de colores */}
                        <div className="flex -space-x-1.5 overflow-hidden p-1">
                            {colores.slice(0, 3).map((color: string, i: number) => (
                                <div key={i} className="inline-block h-4 w-4 rounded-full ring-2 ring-white" style={{ backgroundColor: color }}></div>
                            ))}
                            {colores.length > 3 && (
                                <div className="inline-block h-4 w-4 rounded-full bg-slate-100 ring-2 ring-white flex items-center justify-center text-[8px] font-bold text-slate-500">+{colores.length - 3}</div>
                            )}
                        </div>
                    </div>

                    <div className="mt-auto flex items-end justify-between border-t border-slate-50 pt-4">
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-400 font-medium line-through">
                                {zapato.precio > 200 ? `Bs ${Math.round(zapato.precio * 1.2)}` : ''}
                            </span>
                            <span className="text-xl font-black text-slate-900">
                                Bs {zapato.precio}
                            </span>
                        </div>

                        {/* Botón Detalles Real */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleLike}
                                className={`p-3 rounded-full hover:bg-slate-50 transition-colors shadow-sm ${liked ? 'bg-red-50 text-red-500' : 'bg-white text-slate-400 hover:text-red-400'}`}
                                title={liked ? "Quitar de favoritos" : "Guardar en favoritos"}
                            >
                                <Heart size={20} className={liked ? "fill-current" : ""} />
                            </button>

                            <span
                                className={`p-3 rounded-full bg-brand-black text-neon-500 border border-neon-500 shadow-lg transition-transform duration-300 flex items-center justify-center ${isHovered ? 'scale-110 rotate-3 bg-neon-500 text-brand-black' : ''}`}
                            >
                                <ShoppingBag size={20} />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
