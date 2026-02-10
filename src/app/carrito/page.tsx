'use client'

import { supabase } from '@/lib/supabase'

import { useCart } from '@/context/CartContext'
import Link from 'next/link'
import { Trash2, MessageCircle, ArrowLeft, Package, ShoppingBag, ArrowRight } from 'lucide-react'

// Número de WhatsApp para recibir pedidos
const WHATSAPP_NUMBER = '59173643433'

export default function CarritoPage() {
    const { items, removeFromCart, cartTotal, clearCart, cartCount } = useCart()

    const handleWhatsAppOrder = async () => {
        if (items.length === 0) return

        try {
            // 1. Obtener Usuario (si existe)
            const { data: { user } } = await supabase.auth.getUser()

            // 2. Insertar Cabecera del Pedido en Supabase
            const { data: pedidoData, error: pedidoError } = await supabase
                .from('pedidos')
                .insert({
                    total: cartTotal,
                    cliente_id: user?.id || null, // Relacionar si está logueado
                    cliente_nombre: user?.user_metadata?.nombre || 'Cliente Web',
                    cliente_telefono: null, // Podríamos pedirlo en un input antes, pero por ahora opcional
                    estado: 'pendiente',
                    metodo_pago: 'whatsapp'
                })
                .select()
                .single()

            if (pedidoError) throw pedidoError

            const pedidoId = pedidoData.id

            // 3. Preparar y Insertar Detalles
            const detalles = items.map(item => ({
                pedido_id: pedidoId,
                producto_id: item.id_producto, // UUID
                nombre_producto: item.nombre,
                cantidad_pares: item.cantidad_pares,
                tipo_curva: item.tipo_curva,
                color: item.color || 'No especificado',
                precio_unitario: item.total_item ? (item.total_item / item.cantidad_pares) : 0,
                subtotal: item.total_item
            }))

            const { error: detallesError } = await supabase
                .from('detalle_pedidos')
                .insert(detalles)

            if (detallesError) throw detallesError

            // 4. Guardar copia local por si acaso (Historial Local)
            try {
                const nuevoPedidoLocal = {
                    id: pedidoId, // Usamos el ID real de la BD
                    fecha: new Date().toISOString(),
                    items: items.map(i => ({
                        nombre: i.nombre,
                        tipo_curva: i.tipo_curva,
                        cantidad_pares: i.cantidad_pares,
                        total_item: i.total_item,
                        color: i.color
                    })),
                    total: cartTotal,
                    estado: 'enviado'
                }
                const historialPrevio = localStorage.getItem('historial_pedidos')
                const pedidos = historialPrevio ? JSON.parse(historialPrevio) : []
                pedidos.push(nuevoPedidoLocal)
                localStorage.setItem('historial_pedidos', JSON.stringify(pedidos))
            } catch (localError) {
                console.error("Error al guardar historial local", localError)
            }

            // 5. Generar Mensaje WhatsApp PRO con ID de Pedido
            const fecha = new Date().toLocaleDateString('es-BO', { day: 'numeric', month: 'long' })
            let mensaje = `📋 *NUEVO PEDIDO MAYORISTA* \n`
            mensaje += `🆔 Pedido ID: #${pedidoId.slice(0, 8)}\n` // ID corto para referencia rápida
            mensaje += `📅 Fecha: ${fecha}\n`
            mensaje += `👤 Cliente: ${user?.user_metadata?.nombre || 'Invitado'}\n`
            mensaje += `--------------------------------\n\n`

            items.forEach((item, index) => {
                const tipoPaquete = item.cantidad_pares === 6 ? 'Media Docena' : 'Docena'
                mensaje += `👟 *MODELO ${index + 1}: ${item.nombre.toUpperCase()}*\n`
                if (item.marca) mensaje += `🏷️ Marca: ${item.marca}\n`
                mensaje += `📏 Curva: ${item.tipo_curva}\n`
                if (item.color) mensaje += `🎨 Color: ${item.color}\n`
                mensaje += `📦 Cantidad: ${item.cantidad_pares} pares (${tipoPaquete})\n`
                const productUrl = `${window.location.origin}/producto/${item.id_producto}`
                mensaje += `🔗 Ver Modelo: ${productUrl}\n`
                mensaje += `\n`
            })

            mensaje += `--------------------------------\n`
            mensaje += `📊 *RESUMEN*\n`
            mensaje += `📦 Bultos: ${items.length}\n`
            mensaje += `👟 Total Pares: ${items.reduce((acc, i) => acc + i.cantidad_pares, 0)}\n`
            mensaje += `💰 *TOTAL ESTIMADO: $${cartTotal}*\n\n`
            mensaje += `✅ *Ya se registró mi pedido en su sistema. Quedo a la espera de coordinar envío y pago.*`

            // 6. Enviar y Limpiar
            const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`
            window.open(url, '_blank')

            clearCart() // Limpiamos el carrito SOLO si todo salió bien

        } catch (error) {
            console.error('Error procesando pedido:', error)
            alert('Hubo un pequeño error guardando el pedido en el sistema, pero redirigiremos a WhatsApp para no perder la venta.')

            // Fallback: Enviar a WhatsApp aunque falle la BD
            const mensajeFallback = `Hola, quiero hacer un pedido manual (Error Sistema): \n\n` +
                items.map(i => `- ${i.nombre} (${i.cantidad_pares} pares)`).join('\n')

            const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensajeFallback)}`
            window.open(url, '_blank')
        }
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 flex flex-col items-center justify-center text-center px-4 transition-colors duration-300">
                <div className="w-24 h-24 bg-orange-100/50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag size={48} className="text-orange-300 dark:text-orange-500" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Tu pedido está vacío</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">Aún no has agregado ninguna caja de zapatos a tu pedido mayorista.</p>
                <Link href="/catalogo">
                    <button className="bg-slate-900 dark:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-black dark:hover:bg-slate-700 transition-all flex items-center gap-2">
                        <ArrowLeft size={20} /> Ir al Catálogo
                    </button>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-28 pb-12 transition-colors duration-300">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <Package className="text-orange-500" />
                        Resumen de Pedido
                    </h1>
                    <Link href="/catalogo" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-orange-500 flex items-center gap-1">
                        <ArrowLeft size={16} /> Seguir comprando
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Lista de Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex gap-4 transition-all hover:shadow-md">
                                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-800">
                                    <img src={item.imagen} alt={item.nombre} className="w-full h-full object-contain mix-blend-multiply" />
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white line-clamp-1">{item.nombre}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                                            {item.cantidad_pares} Pares • {item.tipo_curva}
                                        </p>
                                    </div>
                                    <div className="flex items-end justify-between">
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
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 sticky top-24 transition-colors">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-6 text-lg">Total Estimado</h3>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-slate-500 dark:text-slate-400 text-sm">
                                    <span>Cantidad de Bultos:</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{cartCount} Cajas</span>
                                </div>
                                <div className="flex justify-between text-slate-500 dark:text-slate-400 text-sm">
                                    <span>Total Pares:</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">
                                        {items.reduce((acc, item) => acc + item.cantidad_pares, 0)} Pares
                                    </span>
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-800 my-2 pt-2">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center">Pedido listo para enviar</p>
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
