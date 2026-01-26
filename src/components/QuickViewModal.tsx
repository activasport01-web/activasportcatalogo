'use client'

import { useState, useEffect } from 'react'
import { X, ShoppingBag, Check, ArrowRight, Info } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import Link from 'next/link'

interface QuickViewProps {
    producto: any
    isOpen: boolean
    onClose: () => void
}

export default function QuickViewModal({ producto, isOpen, onClose }: QuickViewProps) {
    const [selectedImage, setSelectedImage] = useState('')
    const [cantidadPares, setCantidadPares] = useState<6 | 12>(12)
    const { addToCart } = useCart()
    const [isAdded, setIsAdded] = useState(false)

    // Lógica de Tallas (Igual a ProductView)
    const tipoCurva = producto?.tallas && producto.tallas.length > 2
        ? producto.tallas
        : (producto?.categoria === 'nino' || producto?.categoria === 'niño' || producto?.categoria === 'infantil')
            ? 'Niño (27-32)'
            : 'Adulto (38-43)'

    // Resetear estados cuando abre
    useEffect(() => {
        if (isOpen && producto) {
            setSelectedImage(producto.url_imagen)
            setCantidadPares(12)
            setIsAdded(false)
        }
    }, [isOpen, producto])

    if (!isOpen || !producto) return null

    // Manejo de Colores (Nuevo formato)
    const coloresDisponibles = producto.colores && producto.colores.length > 0 ? producto.colores : []

    // Helpers de color
    const getColorImage = (colorData: any) => (typeof colorData === 'object' && colorData.imagen) ? colorData.imagen : producto.url_imagen
    const getColorHex = (colorData: any) => (typeof colorData === 'object' && colorData.color) ? colorData.color : colorData
    const getColorName = (colorData: any) => (typeof colorData === 'object' && colorData.nombre) ? colorData.nombre : 'Color'

    const handleAddToCart = () => {
        addToCart({
            id_producto: producto.id,
            nombre: producto.nombre,
            precio_unitario: producto.precio,
            imagen: selectedImage || producto.url_imagen,
            tipo_curva: tipoCurva,
            cantidad_pares: cantidadPares,
            color: 'Colores Variados',
            marca: producto.marca,
            total_item: producto.precio * cantidadPares
        })

        setIsAdded(true)
        setTimeout(() => onClose(), 1500)
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden relative animate-scale-up flex flex-col md:flex-row max-h-[90vh]">

                <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <X size={24} className="text-slate-500" />
                </button>

                {/* Imagen Principal */}
                <div className="w-full md:w-1/2 bg-slate-50 relative flex items-center justify-center p-8">
                    <img
                        src={selectedImage || producto.url_imagen}
                        alt={producto.nombre}
                        className="w-full h-full object-contain mix-blend-multiply max-h-[300px] md:max-h-[400px]"
                    />
                    {producto.etiquetas?.includes('nuevo') && (
                        <div className="absolute top-6 left-6">
                            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg tracking-wider">NUEVO</span>
                        </div>
                    )}
                </div>

                {/* Panel Derecho */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto bg-white">
                    <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{producto.categoria}</span>
                        {producto.marca && <span className="text-xs font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-1 rounded">{producto.marca}</span>}
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 mb-2 leading-tight">{producto.nombre}</h2>

                    {/* Detalles compactos */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                            <span className="text-[10px] text-slate-400 uppercase block font-bold">Tallas</span>
                            <span className="text-sm font-bold text-slate-700">{tipoCurva}</span>
                        </div>
                        {producto.subcategoria && (
                            <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                                <span className="text-[10px] text-slate-400 uppercase block font-bold">Tipo</span>
                                <span className="text-sm font-bold text-slate-700 capitalize">{producto.subcategoria}</span>
                            </div>
                        )}
                    </div>

                    {/* Selector de Colores (Solo visualización/cambio de imagen) */}
                    {coloresDisponibles.length > 0 && (
                        <div className="mb-6">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-3 flex items-center gap-2">
                                <Info size={12} /> Colores Disponibles
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {coloresDisponibles.map((colorData: any, idx: number) => {
                                    const img = getColorImage(colorData)
                                    const hex = getColorHex(colorData)
                                    const isSel = selectedImage === img
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(img)}
                                            className={`w-10 h-10 rounded-full border-2 shadow-sm relative transition-all ${isSel ? 'border-orange-500 scale-110 ring-2 ring-orange-100' : 'border-slate-200 hover:scale-105'}`}
                                            title={getColorName(colorData)}
                                            style={{ backgroundColor: hex }}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Selector Cantidad */}
                    <div className="mb-6">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-3">Cantidad del Paquete</span>
                        <div className="flex gap-3">
                            <button onClick={() => setCantidadPares(6)} className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${cantidadPares === 6 ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-100 text-slate-500 hover:border-slate-300'}`}>Media (6)</button>
                            <button onClick={() => setCantidadPares(12)} className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${cantidadPares === 12 ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-100 text-slate-500 hover:border-slate-300'}`}>Docena (12)</button>
                        </div>
                    </div>

                    <div className="mt-auto space-y-3">
                        <button
                            onClick={handleAddToCart}
                            disabled={isAdded}
                            className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 ${isAdded ? 'bg-green-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                        >
                            {isAdded ? <><Check size={24} /> ¡Agregado!</> : <><ShoppingBag size={24} /> Agregar al Pedido</>}
                        </button>

                        <Link href={`/producto/${producto.id}`} className="block text-center">
                            <span className="text-xs font-bold text-slate-500 hover:text-orange-600 transition-colors flex items-center justify-center gap-1">
                                Ver detalles completos <ArrowRight size={14} />
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
