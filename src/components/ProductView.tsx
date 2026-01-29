'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, ShieldCheck, Truck, Package, Info, ShoppingBag, Check, ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import ProductCard from '@/components/ProductCard' // Asegurar import
import { useCart } from '@/context/CartContext'
import { useFavorites } from '@/context/FavoritesContext'

const WHATSAPP_NUMBER = '59163448209'

interface ProductViewProps {
    producto: any
    productosRelacionados?: any[]
}

export default function ProductView({ producto, productosRelacionados }: ProductViewProps) {
    const router = useRouter()
    const { addToCart } = useCart()
    const { toggleFavorite, isFavorite } = useFavorites()

    // Imagen
    const [selectedImage, setSelectedImage] = useState(producto.url_imagen)

    // Lógica Mayorista
    // Lógica Mayorista
    // Lógica Mayorista
    // Si el administrador definió una curva de tallas específica, usarla. Si no, estimar por categoría.
    const [tipoCurva] = useState<string>(() => {
        if (producto.tallas && producto.tallas.length > 2) return producto.tallas

        // Fallback lógica antigua
        if (producto.categoria === 'nino' || producto.categoria === 'niño' || producto.categoria === 'infantil') return 'Niño (27-32)'
        return 'Adulto (38-43)'
    })
    const [cantidadCajon, setCantidadCajon] = useState<6 | 12>(12)

    // Colores disponibles - Soporte para formato nuevo y viejo
    // Formato nuevo: [{ color: "#000", nombre: "Negro", imagen: "url" }]
    // Formato viejo: ["#000000", "#FFFFFF"]
    const coloresDisponibles = producto.colores && producto.colores.length > 0
        ? producto.colores
        : []

    // Detectar si es formato nuevo (objetos con nombre/imagen) o viejo (strings hex)
    const isNewFormat = coloresDisponibles.length > 0 &&
        typeof coloresDisponibles[0] === 'object' &&
        (coloresDisponibles[0].nombre || coloresDisponibles[0].imagen)

    // Función auxiliar para nombres de colores (simple)
    const getColorName = (colorData: any) => {
        if (typeof colorData === 'object' && colorData.nombre) {
            return colorData.nombre
        }
        const hex = typeof colorData === 'string' ? colorData : colorData?.color || '#000000'
        const names: { [key: string]: string } = {
            '#000000': 'Negro', '#FFFFFF': 'Blanco', '#5D4037': 'Café',
            '#1E40AF': 'Azul', '#DC2626': 'Rojo', '#F59E0B': 'Mostaza'
        }
        return names[hex] || 'Color'
    }

    // Función para obtener la imagen de un color
    const getColorImage = (colorData: any) => {
        if (typeof colorData === 'object' && colorData.imagen) {
            return colorData.imagen
        }
        return producto.url_imagen // Fallback a imagen principal
    }

    // Función para obtener el hex de un color
    const getColorHex = (colorData: any) => {
        if (typeof colorData === 'object' && colorData.color) {
            return colorData.color
        }
        return colorData // Ya es un string hex
    }

    // Carrusel automático de imágenes
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)

    // Obtener todas las imágenes disponibles
    const allImages = coloresDisponibles.length > 0
        ? coloresDisponibles.map((colorData: any) => getColorImage(colorData))
        : [producto.url_imagen]

    // Auto-play cada 3 segundos
    useEffect(() => {
        if (!isAutoPlaying || allImages.length <= 1) return

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
        }, 3000)

        return () => clearInterval(interval)
    }, [isAutoPlaying, allImages.length])

    // Actualizar imagen seleccionada cuando cambia el índice
    useEffect(() => {
        setSelectedImage(allImages[currentImageIndex])
    }, [currentImageIndex])

    // Funciones de navegación
    const nextImage = () => {
        setIsAutoPlaying(false)
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
    }

    const prevImage = () => {
        setIsAutoPlaying(false)
        setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
    }

    const handleWhatsAppClick = async () => {
        await supabase.rpc('incrementar_consulta_zapato', { zapato_id: producto.id })

        const texto = `Hola, tengo una duda sobre el modelo *${producto.nombre}*.\nLink: ${window.location.href}`
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`
        window.open(url, '_blank')
    }

    // Removed totalItem calculation since price is no longer displayed or used for user-facing totals locally
    const handleAddToCart = () => {
        // const totalItem = producto.precio * cantidadCajon // Removed

        addToCart({
            id_producto: producto.id,
            nombre: producto.nombre,
            precio_unitario: producto.precio, // Still passing to context for backend/whatsapp logic if needed
            imagen: selectedImage || producto.url_imagen,
            tipo_curva: tipoCurva as any,
            cantidad_pares: cantidadCajon,
            color: 'Colores Variados',
            marca: producto.marca,
            total_item: 0 // Set to 0 or internal value since we don't show price
        })

        // Notificación temporal
        const btn = document.getElementById('add-btn')
        if (btn) {
            const originalText = btn.innerHTML
            btn.innerHTML = '✅ ¡Agregado!'
            btn.classList.add('bg-green-600')
            setTimeout(() => {
                btn.innerHTML = originalText
                btn.classList.remove('bg-green-600')
            }, 2000)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-28 pb-12 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">

                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 mb-6 text-sm text-slate-500 dark:text-slate-400">
                    <Link href="/" className="hover:text-orange-500 flex items-center gap-1">
                        <ArrowLeft size={16} /> Volver al catálogo
                    </Link>
                    <span>/</span>
                    <span className="uppercase text-slate-800 dark:text-slate-200 font-semibold">{producto.categoria}</span>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

                        {/* Columna Izquierda: Imagen con Carrusel */}
                        <div className="bg-slate-50 dark:bg-slate-950/50 p-6 lg:p-12 flex flex-col items-center justify-center relative group">
                            <div className="relative w-full aspect-square max-w-lg mx-auto">
                                <img
                                    src={selectedImage}
                                    alt={producto.nombre}
                                    className="w-full h-full object-contain transition-all duration-500 hover:scale-105 drop-shadow-xl"
                                />

                                {/* Flechas de navegación (solo si hay múltiples imágenes) */}
                                {allImages.length > 1 && (
                                    <>
                                        {/* Flecha Izquierda */}
                                        <button
                                            onClick={prevImage}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                                            aria-label="Imagen anterior"
                                        >
                                            <ChevronLeft size={24} />
                                        </button>

                                        {/* Flecha Derecha */}
                                        <button
                                            onClick={nextImage}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                                            aria-label="Siguiente imagen"
                                        >
                                            <ChevronRight size={24} />
                                        </button>

                                        {/* Indicadores de posición */}
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                                            {allImages.map((_: any, index: number) => (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        setIsAutoPlaying(false)
                                                        setCurrentImageIndex(index)
                                                    }}
                                                    className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex
                                                        ? 'bg-orange-500 w-6'
                                                        : 'bg-slate-300 hover:bg-slate-400'
                                                        }`}
                                                    aria-label={`Ir a imagen ${index + 1}`}
                                                />
                                            ))}
                                        </div>

                                        {/* Contador de imágenes */}
                                        <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                                            {currentImageIndex + 1} / {allImages.length}
                                        </div>
                                    </>
                                )}
                                <div className="absolute top-0 right-0 flex flex-col gap-2 p-4 z-20">
                                    <button
                                        onClick={() => toggleFavorite({
                                            id: producto.id,
                                            nombre: producto.nombre,
                                            precio: producto.precio,
                                            url_imagen: producto.url_imagen,
                                            categoria: producto.categoria || '',
                                            disponible: producto.disponible ?? true
                                        })}
                                        className={`p-3 rounded-full shadow-lg transition-all transform hover:scale-110 ${isFavorite(producto.id)
                                            ? 'bg-red-50 dark:bg-red-900/20 text-red-500 shadow-red-100 dark:shadow-none'
                                            : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500'
                                            }`}
                                        title={isFavorite(producto.id) ? "Quitar de favoritos" : "Guardar en favoritos"}
                                    >
                                        <Heart size={24} className={isFavorite(producto.id) ? "fill-current" : ""} />
                                    </button>
                                </div>

                                <div className="absolute top-0 left-0 flex flex-col gap-2 p-4">
                                    {producto.etiquetas?.includes('nuevo') && (
                                        <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg tracking-wider">
                                            NUEVA COLECCIÓN
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Columna Derecha: Selección Mayorista */}
                        <div className="p-8 lg:p-12 flex flex-col">
                            <div className="mb-auto">
                                {producto.origen && (
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-2xl drop-shadow-sm filter">
                                            {producto.origen === 'Brazilero' ? '🇧🇷' : producto.origen === 'Peruano' ? '🇵🇪' : '🇧🇴'}
                                        </span>
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                            Calidad {producto.origen}
                                        </span>
                                    </div>
                                )}
                                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
                                    {producto.nombre}
                                </h1>

                                {/* Descripción del Producto */}
                                {producto.descripcion && (
                                    <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                                            <Info size={16} className="text-orange-500" />
                                            Descripción
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                            {producto.descripcion}
                                        </p>
                                    </div>
                                )}

                                {/* Detalles del Producto */}
                                <div className="mb-6 grid grid-cols-2 gap-3">
                                    {/* Categoría */}
                                    {producto.categoria && (
                                        <div className="bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <p className="text-xs text-slate-400 font-medium mb-1">Categoría</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize">{producto.categoria}</p>
                                        </div>
                                    )}

                                    {/* Subcategoría */}
                                    {producto.subcategoria && (
                                        <div className="bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <p className="text-xs text-slate-400 font-medium mb-1">Tipo</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize">{producto.subcategoria}</p>
                                        </div>
                                    )}

                                    {/* Marca */}
                                    {producto.marca && (
                                        <div className="bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <p className="text-xs text-slate-400 font-medium mb-1">Marca</p>
                                            <p className="text-sm font-bold text-orange-600 uppercase">{producto.marca}</p>
                                        </div>
                                    )}

                                    {/* Tallas Disponibles */}
                                    <div className="bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <p className="text-xs text-slate-400 font-medium mb-1">Tallas</p>
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{tipoCurva}</p>
                                    </div>
                                </div>

                                {/* Selección 1: Curva (Eliminada por solicitud - Mercadería China viene pre-definida) */}
                                {/* Se asume curva estándar según categoría para el pedido interno */}

                                {/* Selección 2: Cantidad */}
                                <div className="mb-6">
                                    <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">2. Elige Cantidad del Paquete</h3>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setCantidadCajon(6)}
                                            className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-between gap-2 transition-all ${cantidadCajon === 6
                                                ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/20 shadow-sm'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <span className={`font-bold ${cantidadCajon === 6 ? 'text-orange-800 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300'}`}>Media Docena</span>
                                            <span className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded font-medium text-slate-500 dark:text-slate-400">6 pares</span>
                                        </button>

                                        <button
                                            onClick={() => setCantidadCajon(12)}
                                            className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-between gap-2 transition-all ${cantidadCajon === 12
                                                ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/20 shadow-sm'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <span className={`font-bold ${cantidadCajon === 12 ? 'text-orange-800 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300'}`}>Docena</span>
                                            <span className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded font-medium text-slate-500 dark:text-slate-400">12 pares</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Colores Disponibles - Con Imágenes Clickeables */}
                                {coloresDisponibles && coloresDisponibles.length > 0 && (
                                    <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                                            <Info size={16} className="text-slate-400" />
                                            Colores disponibles - Haz clic para ver
                                        </h3>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                            {coloresDisponibles.map((colorData: any, idx: number) => {
                                                const imagen = getColorImage(colorData)
                                                const nombre = getColorName(colorData)
                                                const hex = getColorHex(colorData)
                                                const hex2 = typeof colorData === 'object' ? colorData.color2 : null
                                                const isSelected = selectedImage === imagen

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSelectedImage(imagen)}
                                                        className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${isSelected
                                                            ? 'border-orange-500 ring-2 ring-orange-200 dark:ring-orange-900 shadow-lg'
                                                            : 'border-slate-200 dark:border-slate-700 hover:border-orange-300'
                                                            }`}
                                                        title={nombre}
                                                    >
                                                        {/* Imagen del zapato */}
                                                        <img
                                                            src={imagen}
                                                            alt={nombre}
                                                            className="w-full h-full object-cover bg-white"
                                                        />

                                                        {/* Indicador de color en esquina */}
                                                        <div
                                                            className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-md"
                                                            style={{
                                                                background: hex2
                                                                    ? `linear-gradient(135deg, ${hex} 50%, ${hex2} 50%)`
                                                                    : hex
                                                            }}
                                                        />

                                                        {/* Overlay de selección */}
                                                        {isSelected && (
                                                            <div className="absolute inset-0 bg-orange-500/10 flex items-center justify-center">
                                                                <div className="bg-orange-500 text-white rounded-full p-1">
                                                                    <Check size={16} />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Nombre al hacer hover */}
                                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <p className="text-white text-xs font-bold text-center truncate">{nombre}</p>
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-3 text-center">
                                            El paquete incluye una mezcla de estos colores
                                        </p>
                                    </div>
                                )}

                                {/* Resumen del Pedido - PRECIO ELIMINADO */}
                            </div>

                            {/* Botones de Acción */}
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleWhatsAppClick}
                                    className="w-full py-4 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all bg-green-600 hover:bg-green-700 hover:shadow-green-500/30 hover:translate-y-[-2px] animate-pulse-slow"
                                >
                                    <MessageCircle size={24} />
                                    Hacer la consulta
                                </button>

                                <button
                                    id="add-btn"
                                    onClick={handleAddToCart}
                                    className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all border-2 ${true
                                        ? 'border-orange-200 text-orange-600 dark:border-orange-900/50 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                        : 'cursor-not-allowed grayscale bg-slate-100'
                                        }`}
                                >
                                    <ShoppingBag size={18} />
                                    Agregar al Pedido (Carrito)
                                </button>
                            </div>

                            {/* Garantías */}
                            <div className="flex items-center justify-around mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-medium">
                                <div className="flex items-center gap-2"><Truck size={14} /> Envíos Nacionales</div>
                                <div className="flex items-center gap-2"><Package size={14} /> Venta Mayorista</div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* PRODUCTOS RELACIONADOS */}
                {productosRelacionados && productosRelacionados.length > 0 && (
                    <div className="mt-16 animate-fade-in-up">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                                También te podría interesar
                            </h2>
                            <Link href="/catalogo" className="text-orange-600 font-bold text-sm hover:underline flex items-center gap-1">
                                Ver todo <ArrowLeft size={16} className="rotate-180" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {productosRelacionados.map((relacionado) => (
                                <ProductCard key={relacionado.id} zapato={relacionado} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
