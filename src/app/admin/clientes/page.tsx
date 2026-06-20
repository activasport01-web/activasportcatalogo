'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import {
    ArrowLeft, Plus, Search, Pencil, Trash2, X, Save,
    Phone, User, Users, CreditCard, ChevronDown, ChevronUp
} from 'lucide-react'

interface Cliente {
    id: string
    nombre: string
    telefono: string | null
    notas: string | null
    activo: boolean
    created_at: string
}

const emptyForm = { nombre: '', telefono: '', notas: '', activo: true }

export default function ClientesPage() {
    const { profile } = useAuth()
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [filtered, setFiltered] = useState<Cliente[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState<Cliente | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [historial, setHistorial] = useState<{ [id: string]: any[] }>({})
    const [resumen, setResumen] = useState<{ [id: string]: { total: number; porCobrar: number } }>({})

    useEffect(() => { loadClientes() }, [])

    useEffect(() => {
        const term = search.toLowerCase()
        setFiltered(
            term
                ? clientes.filter(c =>
                    c.nombre.toLowerCase().includes(term) ||
                    c.telefono?.toLowerCase().includes(term)
                )
                : clientes
        )
    }, [search, clientes])

    const loadClientes = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('nombre')
        if (!error) setClientes(data || [])
        setLoading(false)
    }

    const cargarHistorial = async (clienteId: string) => {
        const { data } = await supabase
            .from('movimientos_kardex')
            .select('id, cantidad, precio_total, estado_pago, fecha, detalle, zapatos(nombre)')
            .eq('cliente_id', clienteId)
            .eq('tipo', 'VENTA')
            .order('fecha', { ascending: false })

        const rows = data || []
        setHistorial(prev => ({ ...prev, [clienteId]: rows }))

        const total = rows.reduce((s, r: any) => s + (r.precio_total || 0), 0)
        const porCobrar = rows
            .filter((r: any) => r.estado_pago === 'credito')
            .reduce((s, r: any) => s + (r.precio_total || 0), 0)
        setResumen(prev => ({ ...prev, [clienteId]: { total, porCobrar } }))
    }

    const toggleExpand = (id: string) => {
        if (expandedId === id) {
            setExpandedId(null)
        } else {
            setExpandedId(id)
            if (!historial[id]) cargarHistorial(id)
        }
    }

    const openNew = () => {
        setEditing(null)
        setForm(emptyForm)
        setShowModal(true)
    }

    const openEdit = (c: Cliente) => {
        setEditing(c)
        setForm({
            nombre: c.nombre,
            telefono: c.telefono || '',
            notas: c.notas || '',
            activo: c.activo
        })
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!form.nombre.trim()) return alert('El nombre es obligatorio.')
        setSaving(true)

        if (editing) {
            const { error } = await supabase
                .from('clientes')
                .update({ nombre: form.nombre.trim(), telefono: form.telefono || null, notas: form.notas || null, activo: form.activo })
                .eq('id', editing.id)
            if (!error) { setShowModal(false); loadClientes() }
            else alert('Error al actualizar: ' + error.message)
        } else {
            const { error } = await supabase
                .from('clientes')
                .insert({ nombre: form.nombre.trim(), telefono: form.telefono || null, notas: form.notas || null, activo: true, usuario_id: profile?.id ?? null })
            if (!error) { setShowModal(false); loadClientes() }
            else alert('Error al crear: ' + error.message)
        }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este cliente? El historial de ventas pasadas no se borra, solo deja de estar vinculado a un cliente.')) return
        const { error } = await supabase.from('clientes').delete().eq('id', id)
        if (!error) loadClientes()
        else alert('Error al eliminar: ' + error.message)
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black uppercase flex items-center gap-2">
                                <Users className="text-orange-500" size={26} />
                                Clientes
                            </h1>
                            <p className="text-slate-500 text-sm">Historial y saldo pendiente por cliente</p>
                        </div>
                    </div>
                    <button
                        onClick={openNew}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-md transition-all"
                    >
                        <Plus size={16} /> Nuevo Cliente
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar cliente por nombre o teléfono..."
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                        <Users size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-bold">No hay clientes registrados</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(c => {
                            const isExpanded = expandedId === c.id
                            const res = resumen[c.id]
                            return (
                                <div key={c.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                    <button
                                        onClick={() => toggleExpand(c.id)}
                                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left gap-4"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                                                <User size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{c.nombre}</p>
                                                {c.telefono && (
                                                    <p className="text-xs text-slate-400 flex items-center gap-1">
                                                        <Phone size={11} /> {c.telefono}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            {res && res.porCobrar > 0 && (
                                                <div className="text-right px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/20">
                                                    <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                        <CreditCard size={10} /> Le debe
                                                    </p>
                                                    <p className="text-sm font-black text-amber-600 dark:text-amber-400">{res.porCobrar.toFixed(2)} Bs</p>
                                                </div>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); openEdit(c) }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id) }} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                <Trash2 size={15} />
                                            </button>
                                            {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 bg-slate-50/50 dark:bg-slate-800/20">
                                            {!historial[c.id] ? (
                                                <p className="text-sm text-slate-400 text-center py-4">Cargando historial...</p>
                                            ) : historial[c.id].length === 0 ? (
                                                <p className="text-sm text-slate-400 text-center py-4">Sin ventas registradas a este cliente todavía.</p>
                                            ) : (
                                                <>
                                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-3 px-1">
                                                        <span>Total histórico: <span className="text-slate-800 dark:text-white">{(resumen[c.id]?.total || 0).toFixed(2)} Bs</span></span>
                                                        <span>{historial[c.id].length} venta{historial[c.id].length > 1 ? 's' : ''}</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {historial[c.id].map((h: any) => (
                                                            <div key={h.id} className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-800 text-sm">
                                                                <div>
                                                                    <p className="font-bold text-slate-700 dark:text-slate-200">{h.zapatos?.nombre || 'Producto eliminado'}</p>
                                                                    <p className="text-xs text-slate-400">{new Date(h.fecha).toLocaleDateString('es-BO')} · {h.cantidad} bultos</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-black text-slate-800 dark:text-white">{(h.precio_total || 0).toFixed(2)} Bs</p>
                                                                    <span className={`text-[10px] font-bold uppercase ${h.estado_pago === 'credito' ? 'text-amber-600' : 'text-green-600'}`}>
                                                                        {h.estado_pago === 'credito' ? 'Crédito' : 'Pagado'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="font-black text-lg">{editing ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nombre *</label>
                                <input
                                    value={form.nombre}
                                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                                    placeholder="Ej: Margarita López"
                                    className="w-full px-3 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Teléfono</label>
                                <input
                                    value={form.telefono}
                                    onChange={e => setForm({ ...form, telefono: e.target.value })}
                                    placeholder="Ej: 70000000"
                                    className="w-full px-3 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Notas</label>
                                <textarea
                                    value={form.notas}
                                    onChange={e => setForm({ ...form, notas: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-800 resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                <Save size={15} /> {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
