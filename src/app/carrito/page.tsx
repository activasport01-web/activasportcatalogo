'use client'

import { useCart } from '@/context/CartContext'
import Link from 'next/link'
import { Trash2, MessageCircle, ArrowLeft, Package, ShoppingBag, ArrowRight } from 'lucide-react'

// Número de WhatsApp para recibir pedidos
const WHATSAPP_NUMBER = '59178303866'

export default function CarritoPage() {
    const { items, removeFromCart, cartTotal, clearCart, cartCount } = useCart()

    const handleWhatsAppOrder = () => {
        if (items.length === 0) return

        // 1. Guardar en Historial Local (LocalStorage)
        try {
            const nuevoPedido = {
                id: Date.now().toString(), // ID simple basado en timestamp
                fecha: new Date().toISOString(),
                items: items.map(i => ({
                    nombre: i.nombre,
                    tipo_curva: i.tipo_curva,
                    cantidad_pares: i.cantidad_pares,
                    total_item: i.total_item,
                    color: i.color // Guardar color seleccionado también
                })),
                total: cartTotal,
                estado: 'enviado'
            }

            const historialPrevio = localStorage.getItem('historial_pedidos')
            const pedidos = historialPrevio ? JSON.parse(historialPrevio) : []
            pedidos.push(nuevoPedido)
            localStorage.setItem('historial_pedidos', JSON.stringify(pedidos))
        } catch (error) {
            console.error("Error al guardar historial local", error)
        }

        // 2. Generar Mensaje WhatsApp
        let mensaje = `👋 *¡Hola! Quiero realizar un pedido Mayorista:*\n\n`

        items.forEach((item, index) => {
            mensaje += `📦 *ITEM ${index + 1}:* ${item.nombre}\n`
            mensaje += `   ├ Curva: ${item.tipo_curva}\n`
            if (item.color) mensaje += `   ├ Color: ${item.color}\n` // Incluir color en mensaje
            mensaje += `   ├ Cantidad: ${item.cantidad_pares} pares (${item.cantidad_pares === 6 ? 'Media Docena' : 'Docena'})\n`
            mensaje += `   └ Subtotal: Bs ${item.total_item}\n\n`
        })

        mensaje += `💰 *TOTAL A PAGAR: Bs ${cartTotal}*\n`
        mensaje += `📝 *Cantidad de Bultos:* ${items.length}\n\n`
        mensaje += `¿Me confirman disponibilidad y datos de pago?`

        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`
        window.open(url, '_blank')

        // Opcional: Limpiar carrito después de enviar o dejarlo
        // clearCart() 
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 pt-24 pb-12 flex flex-col items-center justify-center text-center px-4">
                <div className="w-24 h-24 bg-orange-100/50 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag size={48} className="text-orange-300" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Tu pedido está vacío</h1>
                <p className="text-slate-500 mb-8 max-w-sm">Aún no has agregado ninguna caja de zapatos a tu pedido mayorista.</p>
                <Link href="/catalogo">
                    <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2">
                        <ArrowLeft size={20} /> Ir al Catálogo
                    </button>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Package className="text-orange-500" />
                        Resumen de Pedido
                    </h1>
                    <Link href="/catalogo" className="text-sm font-medium text-slate-500 hover:text-orange-500 flex items-center gap-1">
                        <ArrowLeft size={16} /> Seguir comprando
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Lista de Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 transition-all hover:shadow-md">
                                <div className="w-24 h-24 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
                                    <img src={item.imagen} alt={item.nombre} className="w-full h-full object-contain mix-blend-multiply" />
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-slate-800 line-clamp-1">{item.nombre}</h3>
                                        <p className="text-sm text-slate-500 font-medium mt-1">
                                            {item.cantidad_pares} Pares • {item.tipo_curva}
                                        </p>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div className="text-orange-600 font-bold">
                                            Bs {item.total_item}
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(index)}
                                            className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar del pedido"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={clearCart}
                                className="text-xs font-medium text-red-500 hover:text-red-700 underline"
                            >
                                Vaciar todo el pedido
                            </button>
                        </div>
                    </div>

                    {/* Resumen Final */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 sticky top-24">
                            <h3 className="font-bold text-slate-900 mb-6 text-lg">Total Estimado</h3>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-slate-500 text-sm">
                                    <span>Cantidad de Bultos:</span>
                                    <span className="font-medium text-slate-800">{cartCount} Cajas</span>
                                </div>
                                <div className="flex justify-between text-slate-500 text-sm">
                                    <span>Total Pares:</span>
                                    <span className="font-medium text-slate-800">
                                        {items.reduce((acc, item) => acc + item.cantidad_pares, 0)} Pares
                                    </span>
                                </div>
                                <div className="border-t border-slate-100 my-2 pt-2 flex justify-between items-center">
                                    <span className="font-bold text-slate-800">Total a Pagar:</span>
                                    <span className="text-2xl font-black text-orange-600">Bs {cartTotal}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleWhatsAppOrder}
                                className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold shadow-lg hover:shadow-green-500/30 transition-all flex items-center justify-center gap-2 group mb-3"
                            >
                                <MessageCircle size={24} className="fill-current" />
                                Enviar Pedido por WhatsApp
                            </button>

                            <p className="text-xs text-center text-slate-400 leading-relaxed">
                                Al hacer clic, se abrirá WhatsApp con el detalle completo de tu pedido para coordinar el pago y envío.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
