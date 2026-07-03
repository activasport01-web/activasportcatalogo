'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Plus, Search, Pencil, Trash2, X, Save, Ruler } from 'lucide-react'

interface GrupoTalla {
    id: string
    nombre: string
    rango_tallas: string | null
    orden: number
    activa: boolean
}

const emptyForm = { nombre: '', rango_tallas: '', orden: 1, activa: true }

export default function GruposPage() {
    const [grupos, setGrupos] = useState<GrupoTalla[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState<GrupoTalla | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)

    useEffect(() => { loadAll() }, [])

    const loadAll = async () => {
        setLoading(true)
        setLoadError(null)
        const { data, error: err } = await supabase
            .from('grupos_tallas')
            .select('*')
            .order('orden')
        if (err) { setLoadError(err.message); setLoading(false); return }
        setGrupos((data as GrupoTalla[]) || [])
        setLoading(false)
    }

    const filtered = grupos.filter(g =>
        g.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (g.rango_tallas ?? '').toLowerCase().includes(search.toLowerCase())
    )

    const openCreate = () => {
        setEditing(null)
        setForm({ ...emptyForm, orden: grupos.length + 1 })
        setError(null)
        setShowModal(true)
    }

    const openEdit = (g: GrupoTalla) => {
        setEditing(g)
        setForm({ nombre: g.nombre, rango_tallas: g.rango_tallas || '', orden: g.orden, activa: g.activa })
        setError(null)
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
        setSaving(true)
        setError(null)
        const payload = {
            nombre: form.nombre.trim(),
            rango_tallas: form.rango_tallas.trim() || null,
            orden: form.orden,
            activa: form.activa,
        }
        const { error: err } = editing
            ? await supabase.from('grupos_tallas').update(payload).eq('id', editing.id)
            : await supabase.from('grupos_tallas').insert([payload])
        if (err) { setError(err.message); setSaving(false); return }
        setSaving(false)
        setShowModal(false)
        loadAll()
    }

    const handleDelete = async (id: string, nombre: string) => {
        if (!confirm(`¿Eliminar el grupo "${nombre}"?`)) return
        setDeleting(id)
        const { error: err } = await supabase.from('grupos_tallas').delete().eq('id', id)
        if (err) alert(err.message)
        setDeleting(null)
        loadAll()
    }

    const toggleActiva = async (g: GrupoTalla) => {
        await supabase.from('grupos_tallas').update({ activa: !g.activa }).eq('id', g.id)
        loadAll()
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/dashboard" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
                            <ArrowLeft size={20} className="text-slate-400" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-white">Grupos de Tallas</h1>
                            <p className="text-xs text-slate-400">Niño (18-34), Juvenil (35-38), Adulto (39-46)...</p>
                        </div>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-orange-500/20"
                    >
                        <Plus size={16} />
                        Nuevo Grupo
                    </button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
                {loadError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
                        Error al cargar: {loadError}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'Total grupos', value: grupos.length },
                        { label: 'Activos', value: grupos.filter(g => g.activa).length },
                    ].map(s => (
                        <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-white">{s.value}</p>
                            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar grupos de tallas..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange transition-colors"
                    />
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Ruler size={44} className="mx-auto mb-3 text-slate-700" />
                        <p className="text-slate-500">No se encontraron grupos de tallas</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map(g => (
                            <div
                                key={g.id}
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors group"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                                        <Ruler size={16} className="text-purple-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-white">{g.nombre}</p>
                                        <p className="text-xs text-slate-500">
                                            {g.rango_tallas ? `Tallas: ${g.rango_tallas}` : 'Sin rango definido'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="text-xs text-slate-500 hidden sm:block">#{g.orden}</span>
                                    <button
                                        onClick={() => toggleActiva(g)}
                                        className={`w-9 h-5 rounded-full overflow-hidden transition-colors relative flex-shrink-0 ${g.activa ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                        title={g.activa ? 'Desactivar' : 'Activar'}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${g.activa ? 'translate-x-[14px]' : 'translate-x-0'}`} />
                                    </button>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEdit(g)}
                                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(g.id, g.nombre)}
                                            disabled={!!deleting}
                                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-30"
                                        >
                                            {deleting === g.id
                                                ? <div className="w-3.5 h-3.5 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                                : <Trash2 size={14} />
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h2 className="font-bold text-white">{editing ? 'Editar Grupo' : 'Nuevo Grupo de Tallas'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">{error}</div>
                            )}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre *</label>
                                <input
                                    type="text"
                                    value={form.nombre}
                                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors"
                                    placeholder="ej. Niño, Juvenil, Adulto..."
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rango de Tallas</label>
                                <input
                                    type="text"
                                    value={form.rango_tallas}
                                    onChange={e => setForm(f => ({ ...f, rango_tallas: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors"
                                    placeholder="ej. 18-34, 35-38, 39-46..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Orden</label>
                                    <input
                                        type="number"
                                        value={form.orden}
                                        onChange={e => setForm(f => ({ ...f, orden: parseInt(e.target.value) || 0 }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</label>
                                    <div className="flex items-center gap-3 pt-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, activa: !f.activa }))}
                                            className={`w-11 h-6 rounded-full overflow-hidden transition-colors relative flex-shrink-0 ${form.activa ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                        >
                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${form.activa ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                                        </button>
                                        <span className="text-sm text-slate-300">{form.activa ? 'Activo' : 'Inactivo'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 p-5 border-t border-slate-800">
                            <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
                            >
                                {saving
                                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <Save size={15} />
                                }
                                {editing ? 'Guardar cambios' : 'Crear Grupo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
