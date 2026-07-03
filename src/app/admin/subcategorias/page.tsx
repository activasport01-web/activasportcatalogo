'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Plus, Search, Pencil, Trash2, X, Save, Layers } from 'lucide-react'

interface Subcategoria {
    id: string
    nombre: string
    categoria_id: string | null
    orden: number
    activa: boolean
}

interface Categoria {
    id: string
    nombre: string
}

const emptyForm = { nombre: '', categoria_id: '', orden: 1, activa: true }

export default function SubcategoriasPage() {
    const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState<Subcategoria | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)

    useEffect(() => { loadAll() }, [])

    const loadAll = async () => {
        setLoading(true)
        setLoadError(null)
        const [{ data: subs, error: subErr }, { data: cats }] = await Promise.all([
            supabase.from('subcategorias').select('id, nombre, categoria_id, orden, activa').order('orden'),
            supabase.from('categorias').select('id, nombre').order('nombre'),
        ])
        if (subErr) { setLoadError(subErr.message); setLoading(false); return }
        setSubcategorias((subs as Subcategoria[]) || [])
        setCategorias((cats as Categoria[]) || [])
        setLoading(false)
    }

    const catNombre = (id: string | null) =>
        categorias.find(c => c.id === id)?.nombre ?? '—'

    const filtered = subcategorias.filter(s =>
        s.nombre.toLowerCase().includes(search.toLowerCase()) ||
        catNombre(s.categoria_id).toLowerCase().includes(search.toLowerCase())
    )

    const openCreate = () => {
        setEditing(null)
        setForm({ ...emptyForm, orden: subcategorias.length + 1 })
        setError(null)
        setShowModal(true)
    }

    const openEdit = (s: Subcategoria) => {
        setEditing(s)
        setForm({ nombre: s.nombre, categoria_id: s.categoria_id || '', orden: s.orden, activa: s.activa })
        setError(null)
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
        setSaving(true)
        setError(null)
        const payload = {
            nombre: form.nombre.trim(),
            categoria_id: form.categoria_id || null,
            orden: form.orden,
            activa: form.activa,
        }
        const { error: err } = editing
            ? await supabase.from('subcategorias').update(payload).eq('id', editing.id)
            : await supabase.from('subcategorias').insert([payload])
        if (err) { setError(err.message); setSaving(false); return }
        setSaving(false)
        setShowModal(false)
        loadAll()
    }

    const handleDelete = async (id: string, nombre: string) => {
        if (!confirm(`¿Eliminar la subcategoría "${nombre}"?`)) return
        setDeleting(id)
        const { error: err } = await supabase.from('subcategorias').delete().eq('id', id)
        if (err) alert(err.message)
        setDeleting(null)
        loadAll()
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/dashboard" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
                            <ArrowLeft size={20} className="text-slate-400" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-white">Subcategorías</h1>
                            <p className="text-xs text-slate-400">Vinculadas a sus categorías principales</p>
                        </div>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-orange-500/20"
                    >
                        <Plus size={16} />
                        Nueva Subcategoría
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
                {loadError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
                        Error al cargar: {loadError}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Total', value: subcategorias.length },
                        { label: 'Activas', value: subcategorias.filter(s => s.activa).length },
                        { label: 'Categorías', value: categorias.length },
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
                        placeholder="Buscar subcategorías..."
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
                        <Layers size={44} className="mx-auto mb-3 text-slate-700" />
                        <p className="text-slate-500">No se encontraron subcategorías</p>
                    </div>
                ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">#</th>
                                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">Subcategoría</th>
                                    <th className="text-left px-4 py-3 text-slate-400 font-semibold hidden sm:table-cell">Categoría</th>
                                    <th className="text-center px-4 py-3 text-slate-400 font-semibold">Estado</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(s => (
                                    <tr key={s.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">{s.orden}</td>
                                        <td className="px-4 py-3 font-semibold text-white">{s.nombre}</td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-md">
                                                {catNombre(s.categoria_id)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.activa ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                                {s.activa ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEdit(s)}
                                                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(s.id, s.nombre)}
                                                    disabled={!!deleting}
                                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-30"
                                                >
                                                    {deleting === s.id
                                                        ? <div className="w-3.5 h-3.5 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                                        : <Trash2 size={14} />
                                                    }
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h2 className="font-bold text-white">{editing ? 'Editar Subcategoría' : 'Nueva Subcategoría'}</h2>
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
                                    placeholder="ej. Turf, Salonera, Running..."
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoría Principal</label>
                                <select
                                    value={form.categoria_id}
                                    onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors"
                                >
                                    <option value="">— Sin categoría —</option>
                                    {categorias.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
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
                                        <span className="text-sm text-slate-300">{form.activa ? 'Activa' : 'Inactiva'}</span>
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
                                {editing ? 'Guardar cambios' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
