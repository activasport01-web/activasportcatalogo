'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import {
    ArrowLeft, Plus, Trash2, Save, Warehouse, Search,
    AlertTriangle, CheckCircle, X, ChevronDown, ChevronUp
} from 'lucide-react'

interface Sucursal {
    id: string
    sucursal: string   // campo 'color' de la tabla, usado como nombre de sucursal
    cantidad: number
    ultima_actualizacion: string
    usuario_id: string | null
}

interface Producto {
    id: string
    nombre: string
    codigo: string | null
    caja: string | null
    stock_bultos: number
    url_imagen: string
    cat_obj: { nombre: string } | null
}

const SUCURSALES_PREDETERMINADAS = ['Principal', 'Sucursal 2', 'Bodega', 'Depósito']

export default function InventarioPage() {
    const { profile } = useAuth()
    const [productos, setProductos] = useState<Producto[]>([])
    const [inventario, setInventario] = useState<{ [productoId: string]: Sucursal[] }>({})
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [saving, setSaving] = useState<string | null>(null)
    const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
    const dataLoaded = useRef(false)

    useEffect(() => {
        if (profile && !dataLoaded.current) {
            dataLoaded.current = true
            loadAll()
        }
    }, [profile])

    const showToast = (msg: string, type: 'success' | 'error') => {
        setNotification({ msg, type })
        setTimeout(() => setNotification(null), 3000)
    }

    const loadAll = async () => {
        setLoading(true)
        const { data: prods } = await supabase
            .from('zapatos')
            .select('id, nombre, codigo, caja, stock_bultos, url_imagen, cat_obj:categorias(nombre)')
            .order('nombre')

        const { data: invRows } = await supabase
            .from('inventario')
            .select('id, producto_id, color, cantidad, ultima_actualizacion, usuario_id')

        if (prods) setProductos(prods as any)

        // Agrupar inventario por producto_id
        const grouped: { [id: string]: Sucursal[] } = {}
        if (invRows) {
            invRows.forEach((row: any) => {
                const pid = String(row.producto_id)
                if (!grouped[pid]) grouped[pid] = []
                grouped[pid].push({
                    id: row.id,
                    sucursal: row.color || '',
                    cantidad: row.cantidad ?? 0,
                    ultima_actualizacion: row.ultima_actualizacion,
                    usuario_id: row.usuario_id
                })
            })
        }
        setInventario(grouped)
        setLoading(false)
    }

    const loadInventarioProducto = async (productoId: string) => {
        const { data } = await supabase
            .from('inventario')
            .select('id, producto_id, color, cantidad, ultima_actualizacion, usuario_id')
            .eq('producto_id', productoId)

        if (data) {
            setInventario(prev => ({
                ...prev,
                [productoId]: data.map((row: any) => ({
                    id: row.id,
                    sucursal: row.color || '',
                    cantidad: row.cantidad ?? 0,
                    ultima_actualizacion: row.ultima_actualizacion,
                    usuario_id: row.usuario_id
                }))
            }))
        }
    }

    const agregarSucursal = (productoId: string) => {
        setInventario(prev => ({
            ...prev,
            [productoId]: [
                ...(prev[productoId] || []),
                { id: `new_${Date.now()}`, sucursal: '', cantidad: 0, ultima_actualizacion: '', usuario_id: null }
            ]
        }))
    }

    const actualizarFila = (productoId: string, idx: number, field: 'sucursal' | 'cantidad', value: string | number) => {
        setInventario(prev => {
            const filas = [...(prev[productoId] || [])]
            filas[idx] = { ...filas[idx], [field]: value }
            return { ...prev, [productoId]: filas }
        })
    }

    const eliminarFila = async (productoId: string, idx: number) => {
        const fila = inventario[productoId]?.[idx]
        if (!fila) return

        if (!fila.id.startsWith('new_')) {
            const { error } = await supabase.from('inventario').delete().eq('id', fila.id)
            if (error) { showToast('Error al eliminar', 'error'); return }
        }

        setInventario(prev => {
            const filas = [...(prev[productoId] || [])]
            filas.splice(idx, 1)
            return { ...prev, [productoId]: filas }
        })
    }

    const guardarInventario = async (productoId: string) => {
        const filas = inventario[productoId] || []
        if (filas.some(f => !f.sucursal.trim())) {
            showToast('Completa el nombre de todas las sucursales', 'error')
            return
        }

        setSaving(productoId)
        let hayError = false

        for (const fila of filas) {
            const payload = {
                producto_id: Number(productoId),
                color: fila.sucursal.trim(),
                cantidad: Number(fila.cantidad) || 0,
                ultima_actualizacion: new Date().toISOString(),
                usuario_id: profile?.id ?? null
            }

            if (fila.id.startsWith('new_')) {
                const { error } = await supabase.from('inventario').insert(payload)
                if (error) { hayError = true; break }
            } else {
                const { error } = await supabase.from('inventario').update(payload).eq('id', fila.id)
                if (error) { hayError = true; break }
            }
        }

        if (!hayError) {
            showToast('Inventario guardado correctamente', 'success')
            await loadInventarioProducto(productoId)
        } else {
            showToast('Error al guardar el inventario', 'error')
        }
        setSaving(null)
    }

    const totalSucursales = (productoId: string) =>
        (inventario[productoId] || []).reduce((sum, f) => sum + (Number(f.cantidad) || 0), 0)

    const filteredProductos = productos.filter(p => {
        const term = searchTerm.toLowerCase()
        return (
            p.nombre.toLowerCase().includes(term) ||
            (p.codigo || '').toLowerCase().includes(term) ||
            (p.caja || '').toLowerCase().includes(term)
        )
    })

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">

            {/* Toast */}
            {notification && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-bold transition-all
                    ${notification.type === 'success'
                        ? 'bg-white dark:bg-slate-900 border-green-400 text-green-700 dark:text-green-400'
                        : 'bg-white dark:bg-slate-900 border-red-400 text-red-700 dark:text-red-400'}`}>
                    {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                    {notification.msg}
                </div>
            )}

            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 sticky top-0 z-30 shadow-lg text-white">
                <div className="max-w-5xl mx-auto px-4 py-4 md:px-6 md:py-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Link href="/admin/dashboard"
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                                <ArrowLeft size={18} className="text-orange-400" />
                            </Link>
                            <div>
                                <h1 className="text-lg md:text-2xl font-bold flex items-center gap-2">
                                    <Warehouse size={22} className="text-orange-400" />
                                    Inventario por Sucursal
                                </h1>
                                <p className="text-slate-400 text-xs mt-0.5">
                                    Stock de cada producto distribuido por sucursal o bodega
                                </p>
                            </div>
                        </div>
                        <span className="text-xs bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full border border-orange-500/30 font-bold">
                            {productos.length} productos
                        </span>
                    </div>

                    {/* Buscador */}
                    <div className="relative mt-4 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar producto, código o caja..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder-slate-400 focus:bg-white/20 focus:border-orange-500/50 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Lista de productos */}
            <div className="max-w-5xl mx-auto px-4 py-6 md:px-6 space-y-3">

                {filteredProductos.length === 0 && (
                    <div className="text-center py-16 text-slate-400">
                        <Warehouse size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-bold">No se encontraron productos</p>
                    </div>
                )}

                {filteredProductos.map(producto => {
                    const pid = String(producto.id)
                    const filas = inventario[pid] || []
                    const totalInv = totalSucursales(pid)
                    const stockGlobal = producto.stock_bultos || 0
                    const isExpanded = expandedId === pid
                    const hayDiferencia = filas.length > 0 && totalInv !== stockGlobal

                    return (
                        <div key={pid}
                            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">

                            {/* Cabecera del producto */}
                            <button
                                onClick={() => setExpandedId(isExpanded ? null : pid)}
                                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left gap-4"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <img
                                        src={producto.url_imagen}
                                        alt={producto.nombre}
                                        className="w-10 h-10 object-contain rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{producto.nombre}</p>
                                        <p className="text-xs text-slate-400">
                                            {producto.codigo || producto.caja || '—'} · {producto.cat_obj?.nombre || '—'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    {/* Stock global */}
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Stock Global</p>
                                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">{stockGlobal} bultos</p>
                                    </div>

                                    {/* Stock en sucursales */}
                                    {filas.length > 0 && (
                                        <div className={`text-right px-2 py-1 rounded-lg ${hayDiferencia ? 'bg-amber-100 dark:bg-amber-900/20' : 'bg-green-100 dark:bg-green-900/20'}`}>
                                            <p className="text-[10px] uppercase font-bold text-slate-500">Por sucursal</p>
                                            <p className={`text-sm font-black ${hayDiferencia ? 'text-amber-600' : 'text-green-600'}`}>
                                                {totalInv} bultos
                                            </p>
                                        </div>
                                    )}

                                    {hayDiferencia && (
                                        <span title="El total por sucursal no coincide con el stock global">
                                            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                                        </span>
                                    )}

                                    {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                                </div>
                            </button>

                            {/* Panel expandido */}
                            {isExpanded && (
                                <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 bg-slate-50/50 dark:bg-slate-800/20">

                                    {/* Alerta de diferencia */}
                                    {hayDiferencia && (
                                        <div className="mb-4 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                                            <AlertTriangle size={14} />
                                            El total por sucursal ({totalInv}) difiere del stock global ({stockGlobal} bultos). Actualiza el stock global desde la página de Productos.
                                        </div>
                                    )}

                                    {/* Filas de sucursales */}
                                    <div className="space-y-2 mb-4">
                                        {filas.length === 0 && (
                                            <p className="text-sm text-slate-400 text-center py-4">
                                                Sin sucursales registradas. Agrega la primera.
                                            </p>
                                        )}

                                        {filas.map((fila, idx) => (
                                            <div key={fila.id} className="flex items-center gap-2">
                                                {/* Nombre de sucursal */}
                                                <div className="flex-1 relative">
                                                    <input
                                                        list={`sucursales-${pid}`}
                                                        type="text"
                                                        placeholder="Nombre de sucursal o bodega"
                                                        value={fila.sucursal}
                                                        onChange={e => actualizarFila(pid, idx, 'sucursal', e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 outline-none"
                                                    />
                                                    <datalist id={`sucursales-${pid}`}>
                                                        {SUCURSALES_PREDETERMINADAS.map(s => (
                                                            <option key={s} value={s} />
                                                        ))}
                                                    </datalist>
                                                </div>

                                                {/* Cantidad */}
                                                <div className="w-28 flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step={0.5}
                                                        value={fila.cantidad}
                                                        onChange={e => actualizarFila(pid, idx, 'cantidad', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 text-sm border-2 border-orange-200 dark:border-orange-500/40 rounded-lg bg-orange-50/30 dark:bg-orange-500/10 text-slate-900 dark:text-slate-100 font-bold text-center focus:ring-2 focus:ring-orange-500 outline-none"
                                                    />
                                                    <span className="text-xs text-slate-400 whitespace-nowrap">blt.</span>
                                                </div>

                                                {/* Eliminar */}
                                                <button
                                                    onClick={() => eliminarFila(pid, idx)}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Eliminar sucursal"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Total parcial */}
                                    {filas.length > 0 && (
                                        <div className="mb-3 flex justify-end">
                                            <span className="text-xs text-slate-500 font-bold">
                                                Total sucursales: <span className="text-orange-500 font-black">{totalInv} bultos</span>
                                            </span>
                                        </div>
                                    )}

                                    {/* Acciones */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => agregarSucursal(pid)}
                                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <Plus size={14} /> Agregar Sucursal
                                        </button>

                                        <button
                                            onClick={() => guardarInventario(pid)}
                                            disabled={saving === pid || filas.length === 0}
                                            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                        >
                                            <Save size={14} />
                                            {saving === pid ? 'Guardando...' : 'Guardar'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
