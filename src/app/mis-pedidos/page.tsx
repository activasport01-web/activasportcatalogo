'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Calendar, Clock, ChevronDown, ChevronUp, ShoppingBag, ArrowRight } from 'lucide-react'

interface DetallePedido {
    nombre: string
    tipo_curva: string
    cantidad_pares: number
    total_item: number
    color?: string
}

interface Pedido {
    id: string
    fecha: string
    items: DetallePedido[]
    total: number
    estado: 'enviado' | 'pendiente'
}

export default function MisPedidosPage() {
    const [pedidos, setPedidos] = useState<Pedido[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Cargar pedidos del localStorage
        const storedPedidos = localStorage.getItem('historial_pedidos')
        if (storedPedidos) {
            try {
                const parsed = JSON.parse(storedPedidos)
                // Ordenar por fecha descendente (más nuevo primero)
                setPedidos(parsed.sort((a: Pedido, b: Pedido) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()))
            } catch (e) {
                console.error("Error al leer historial de pedidos", e)
            }
        }
        setLoading(false)
    }, [])

    const clearHistory = () => {
        if (confirm('¿Estás seguro de borrar todo el historial de pedidos?')) {
            localStorage.removeItem('historial_pedidos')
            setPedidos([])
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-28 pb-12 transition-colors duration-300">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <Package className="text-orange-500" />
                        Mis Pedidos
                    </h1>

                    <div className="flex gap-4">
                        {pedidos.length > 0 && (
                            <button
                                onClick={clearHistory}
                                className="text-red-400 hover:text-red-600 font-medium text-sm transition-colors"
                            >
                                Borrar Historial
                            </button>
                        )}
                        <Link href="/catalogo" className="text-sm font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1">
                            Nuevo Pedido <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>

                {pedidos.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-12 text-center transition-colors">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Clock className="text-slate-300 dark:text-slate-500" size={40} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No tienes historial de pedidos</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
                            Tus pedidos enviados por WhatsApp aparecerán aquí para que lleves un control.
                        </p>
                        <Link href="/catalogo" className="inline-block bg-slate-900 dark:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
                            Ir al Catálogo
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {pedidos.map((pedido) => (
                            <PedidoCard key={pedido.id} pedido={pedido} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}

function PedidoCard({ pedido }: { pedido: Pedido }) {
    const [isOpen, setIsOpen] = useState(false)
    const fecha = new Date(pedido.fecha).toLocaleDateString('es-BO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all hover:shadow-md">
            {/* Cabecera del Pedido */}
            <div
                className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="text-green-600 dark:text-green-400" size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pedido #{pedido.id.slice(-6)}</p>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{fecha}</h3>
                    </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 flex-1">
                    <div className={`px-4 py-2 rounded-full text-xs font-bold ${pedido.estado === 'enviado' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'}`}>
                        {pedido.estado === 'enviado' ? 'Enviado por WhatsApp' : 'Pendiente'}
                    </div>
                    <button className="text-slate-400 hover:text-orange-500 transition-colors">
                        {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </button>
                </div>
            </div>

            {/* Detalles Desplegables */}
            {isOpen && (
                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-6 animate-fade-in">
                    <h4 className="font-bold text-slate-800 dark:text-white mb-4 text-sm uppercase">Detalle de productos</h4>
                    <div className="space-y-3">
                        {pedido.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 last:border-0 pb-3 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-slate-500 dark:text-slate-400 w-6">x{item.cantidad_pares}</span>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200">{item.nombre}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Curva: {item.tipo_curva} {item.color ? `• Color: ${item.color}` : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 flex justify-end">
                        {/* Botón para volver a enviar mensaje (opcional, recrea el link) */}
                        {/* Podríamos implementarlo si el usuario quiere "recordar" el pedido al vendedor */}
                    </div>
                </div>
            )}
        </div>
    )
}
