'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
    ArrowLeft,
    Search,
    Filter,
    ChevronDown,
    Eye,
    CheckCircle,
    Clock,
    Truck,
    XCircle,
    Package,
    Calendar,
    DollarSign,
    User,
    MessageCircle
} from 'lucide-react'

// Definimos los tipos
type Pedido = {
    id: string
    created_at: string // Supabase genera timestamp como string
    fecha_creacion: string
    cliente_nombre: string
    cliente_telefono: string | null
    total: number
    estado: 'pendiente' | 'pagado' | 'enviado' | 'entregado' | 'cancelado'
    metodo_pago: string
}

type DetallePedido = {
    id: string
    nombre_producto: string
    cantidad_pares: number
    tipo_curva: string
    color: string
    subtotal: number
    nombre_marca?: string // Opcional si lo cruzamos
}

export default function AdminPedidosPage() {
    const [pedidos, setPedidos] = useState<Pedido[]>([])
    const [loading, setLoading] = useState(true)
    const [filtroEstado, setFiltroEstado] = useState<string>('todos')
    const [busqueda, setBusqueda] = useState('')

    // Modal de Detalles
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null)
    const [detalles, setDetalles] = useState<DetallePedido[]>([])
    const [cargandoDetalles, setCargandoDetalles] = useState(false)
    const [modalAbierto, setModalAbierto] = useState(false)

    useEffect(() => {
        fetchPedidos()
    }, [])

    const fetchPedidos = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('pedidos')
            .select('*')
            .order('fecha_creacion', { ascending: false })

        if (data) setPedidos(data)
        setLoading(false)
    }

    const fetchDetalles = async (pedido: Pedido) => {
        setPedidoSeleccionado(pedido)
        setModalAbierto(true)
        setCargandoDetalles(true)

        const { data, error } = await supabase
            .from('detalle_pedidos')
            .select('*')
            .eq('pedido_id', pedido.id)

        if (data) setDetalles(data)
        setCargandoDetalles(false)
    }

    const actualizarEstado = async (id: string, nuevoEstado: string) => {
        const { error } = await supabase
            .from('pedidos')
            .update({ estado: nuevoEstado })
            .eq('id', id)

        if (!error) {
            // Actualizar localmente
            setPedidos(pedidos.map(p => p.id === id ? { ...p, estado: nuevoEstado as any } : p))
            if (pedidoSeleccionado?.id === id) {
                setPedidoSeleccionado({ ...pedidoSeleccionado, estado: nuevoEstado as any })
            }
        }
    }

    // Filtrado
    const pedidosFiltrados = pedidos.filter(p => {
        const cumpleEstado = filtroEstado === 'todos' || p.estado === filtroEstado
        const cumpleBusqueda = p.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.id.toLowerCase().includes(busqueda.toLowerCase())
        return cumpleEstado && cumpleBusqueda
    })

    // Colores de estado
    const getStatusColor = (estado: string) => {
        switch (estado) {
            case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'pagado': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'enviado': return 'bg-purple-100 text-purple-800 border-purple-200'
            case 'entregado': return 'bg-green-100 text-green-800 border-green-200'
            case 'cancelado': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors font-sans">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link href="/admin/dashboard" className="text-sm text-slate-500 hover:text-orange-500 flex items-center gap-1 mb-2 transition-colors">
                        <ArrowLeft size={16} /> Volver al Dashboard
                    </Link>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <Package className="text-brand-orange" /> Gestión de Pedidos
                    </h1>
                </div>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar cliente o ID..."
                            className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm w-full focus:ring-2 focus:ring-brand-orange outline-none"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            className="pl-10 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm appearance-none focus:ring-2 focus:ring-brand-orange outline-none cursor-pointer"
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                        >
                            <option value="todos">Todos los Estados</option>
                            <option value="pendiente">Pendientes</option>
                            <option value="pagado">Pagados</option>
                            <option value="enviado">Enviados</option>
                            <option value="entregado">Entregados</option>
                            <option value="cancelado">Cancelados</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            {/* Tabla de Pedidos */}
            <div className="max-w-7xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID Pedido</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">Cargando pedidos...</td>
                                </tr>
                            ) : pedidosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">No se encontraron pedidos.</td>
                                </tr>
                            ) : (
                                pedidosFiltrados.map((pedido) => (
                                    <tr key={pedido.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                                            #{pedido.id.slice(0, 8)}
                                        </td>
                                        <td className="p-4 text-sm text-slate-700 dark:text-slate-300">
                                            {new Date(pedido.fecha_creacion).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                    <User size={12} />
                                                </div>
                                                <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                                                    {pedido.cliente_nombre || 'Invitado'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                                            ${pedido.total}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getStatusColor(pedido.estado)}`}>
                                                {pedido.estado}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => fetchDetalles(pedido)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-brand-orange hover:text-white dark:hover:bg-brand-orange rounded-lg text-xs font-bold transition-all text-slate-600 dark:text-slate-300"
                                            >
                                                <Eye size={14} /> Ver
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Detalles */}
            {modalAbierto && pedidoSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

                        {/* Header Modal */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-950/50">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    Pedido #{pedidoSeleccionado.id.slice(0, 8)}
                                </h2>
                                <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                    <Calendar size={14} />
                                    {new Date(pedidoSeleccionado.fecha_creacion).toLocaleString()}
                                </p>
                            </div>
                            <button onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>

                        {/* Body Modal */}
                        <div className="p-6 overflow-y-auto flex-1">

                            {/* Panel de Estado y Acciones */}
                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                                <label className="block text-xs font-bold text-blue-800 dark:text-blue-300 uppercase mb-2">
                                    Gestión de Estado
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'].map((est) => (
                                        <button
                                            key={est}
                                            onClick={() => actualizarEstado(pedidoSeleccionado.id, est)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize
                                                ${pedidoSeleccionado.estado === est
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                                                }`}
                                        >
                                            {est}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Package size={18} className="text-brand-orange" /> Productos ({detalles.length})
                            </h3>

                            {cargandoDetalles ? (
                                <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto"></div></div>
                            ) : (
                                <div className="space-y-3">
                                    {detalles.map((detalle) => (
                                        <div key={detalle.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center font-bold text-slate-400 border border-slate-100 dark:border-slate-700">
                                                    {detalle.cantidad_pares}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-800 dark:text-white line-clamp-1">{detalle.nombre_producto}</p>
                                                    <p className="text-xs text-slate-500">
                                                        Curva: {detalle.tipo_curva} • Color: {detalle.color}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-slate-900 dark:text-white">${detalle.subtotal}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Totales */}
                            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
                                <div className="text-sm text-slate-500">
                                    <p>Cliente: <span className="font-bold text-slate-800 dark:text-white">{pedidoSeleccionado.cliente_nombre}</span></p>
                                    <p>Método: <span className="capitalize">{pedidoSeleccionado.metodo_pago}</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-500">Total a pagar</p>
                                    <p className="text-3xl font-black text-brand-orange">${pedidoSeleccionado.total}</p>
                                </div>
                            </div>

                        </div>

                        {/* Footer Modal */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                            <a
                                href={`https://wa.me/591${pedidoSeleccionado.cliente_telefono || ''}?text=Hola ${pedidoSeleccionado.cliente_nombre}, te escribo sobre tu pedido #${pedidoSeleccionado.id.slice(0, 6)}...`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
                            >
                                <MessageCircle size={18} /> Contactar Cliente
                            </a>
                            <button
                                onClick={() => setModalAbierto(false)}
                                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-bold text-sm transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
