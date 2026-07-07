'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { compressImage } from '@/lib/imageCompression'
import Link from 'next/link'
import {
    ArrowLeft, Plus, Edit, Trash2, X, Upload, Check,
    Search, Layers, Save, Pencil
} from 'lucide-react'

/* ─── Tipos ─────────────────────────────────────────────── */
interface Categoria {
    id: string
    nombre: string
    slug: string
    descripcion: string
    emoji: string
    imagen_url: string
    orden: number
    activa: boolean
}

interface Subcategoria {
    id: string
    nombre: string
    categoria_id: string | null
    orden: number
    activa: boolean
}

/* ─── Helpers ────────────────────────────────────────────── */
const generateSlug = (nombre: string) =>
    nombre.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const emptyCatForm = { nombre: '', slug: '', descripcion: '', emoji: '👟', orden: 0, activa: true }
const emptySubForm = { nombre: '', categoria_id: '', orden: 1, activa: true }

/* ─── Componente ─────────────────────────────────────────── */
export default function CategoriasPage() {
    const [tab, setTab] = useState<'categorias' | 'subcategorias'>('categorias')

    /* ── Estado Categorías ── */
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [loadingCat, setLoadingCat] = useState(true)
    const [searchCat, setSearchCat] = useState('')
    const [showCatModal, setShowCatModal] = useState(false)
    const [editingCat, setEditingCat] = useState<Categoria | null>(null)
    const [catForm, setCatForm] = useState(emptyCatForm)
    const [imageFile, setImageFile] = useState<File | null>(null)

    /* ── Estado Subcategorías ── */
    const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
    const [loadingSub, setLoadingSub] = useState(true)
    const [searchSub, setSearchSub] = useState('')
    const [showSubModal, setShowSubModal] = useState(false)
    const [editingSub, setEditingSub] = useState<Subcategoria | null>(null)
    const [subForm, setSubForm] = useState(emptySubForm)
    const [savingSub, setSavingSub] = useState(false)
    const [subError, setSubError] = useState<string | null>(null)
    const [deletingSub, setDeletingSub] = useState<string | null>(null)

    const loadedRef = useRef(false)

    useEffect(() => {
        if (loadedRef.current) return
        loadedRef.current = true
        loadCategorias()
        loadSubcategorias()
    }, [])

    /* ─── Cargar datos ─────────────────────────────────────── */
    const loadCategorias = async () => {
        setLoadingCat(true)
        const { data } = await supabase.from('categorias').select('*').order('orden')
        if (data) setCategorias(data as Categoria[])
        setLoadingCat(false)
    }

    const loadSubcategorias = async () => {
        setLoadingSub(true)
        const { data } = await supabase
            .from('subcategorias')
            .select('id, nombre, categoria_id, orden, activa')
            .order('orden')
        if (data) setSubcategorias(data as Subcategoria[])
        setLoadingSub(false)
    }

    /* ─── CRUD Categorías ──────────────────────────────────── */
    const openCatModal = (cat?: Categoria) => {
        setEditingCat(cat || null)
        setCatForm(cat
            ? { nombre: cat.nombre, slug: cat.slug, descripcion: cat.descripcion, emoji: cat.emoji, orden: cat.orden, activa: cat.activa }
            : { ...emptyCatForm, orden: categorias.length + 1 }
        )
        setImageFile(null)
        setShowCatModal(true)
    }

    const handleCatSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        let imagen_url = editingCat?.imagen_url || ''

        if (imageFile) {
            const compressed = await compressImage(imageFile)
            const fileName = `categoria_${Date.now()}_${compressed.name}`
            const { error: upErr } = await supabase.storage.from('imagenes-zapatos').upload(fileName, compressed)
            if (!upErr) {
                const { data } = supabase.storage.from('imagenes-zapatos').getPublicUrl(fileName)
                imagen_url = data.publicUrl
            }
        }

        const payload = { nombre: catForm.nombre, slug: catForm.slug, descripcion: catForm.descripcion, emoji: catForm.emoji, imagen_url, orden: catForm.orden, activa: catForm.activa }

        if (editingCat) {
            const { error } = await supabase.from('categorias').update(payload).eq('id', editingCat.id)
            if (error) { alert('Error: ' + error.message); return }
        } else {
            const { error } = await supabase.from('categorias').insert([payload])
            if (error) { alert('Error: ' + error.message); return }
        }
        setShowCatModal(false)
        loadCategorias()
        loadSubcategorias() // refrescar lista para dropdown
    }

    const handleCatDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta categoría? Las subcategorías vinculadas quedarán sin categoría.')) return
        await supabase.from('categorias').delete().eq('id', id)
        loadCategorias()
    }

    const toggleCatActiva = async (cat: Categoria) => {
        await supabase.from('categorias').update({ activa: !cat.activa }).eq('id', cat.id)
        loadCategorias()
    }

    /* ─── CRUD Subcategorías ───────────────────────────────── */
    const openSubModal = (sub?: Subcategoria) => {
        setEditingSub(sub || null)
        setSubForm(sub
            ? { nombre: sub.nombre, categoria_id: sub.categoria_id || '', orden: sub.orden, activa: sub.activa }
            : { ...emptySubForm, orden: subcategorias.length + 1 }
        )
        setSubError(null)
        setShowSubModal(true)
    }

    const handleSubSave = async () => {
        if (!subForm.nombre.trim()) { setSubError('El nombre es obligatorio'); return }
        setSavingSub(true)
        setSubError(null)
        const payload = {
            nombre: subForm.nombre.trim(),
            categoria_id: subForm.categoria_id || null,
            orden: subForm.orden,
            activa: subForm.activa,
        }
        const { error } = editingSub
            ? await supabase.from('subcategorias').update(payload).eq('id', editingSub.id)
            : await supabase.from('subcategorias').insert([payload])
        if (error) { setSubError(error.message); setSavingSub(false); return }
        setSavingSub(false)
        setShowSubModal(false)
        loadSubcategorias()
    }

    const handleSubDelete = async (id: string, nombre: string) => {
        if (!confirm(`¿Eliminar la subcategoría "${nombre}"?`)) return
        setDeletingSub(id)
        await supabase.from('subcategorias').delete().eq('id', id)
        setDeletingSub(null)
        loadSubcategorias()
    }

    /* ─── Filtros ──────────────────────────────────────────── */
    const catNombre = (id: string | null) => categorias.find(c => c.id === id)?.nombre ?? '—'

    const filteredCats = categorias.filter(c =>
        c.nombre.toLowerCase().includes(searchCat.toLowerCase()) ||
        (c.descripcion || '').toLowerCase().includes(searchCat.toLowerCase())
    )

    const filteredSubs = subcategorias.filter(s =>
        s.nombre.toLowerCase().includes(searchSub.toLowerCase()) ||
        catNombre(s.categoria_id).toLowerCase().includes(searchSub.toLowerCase())
    )

    /* ─── Render ───────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-slate-950 text-white">

            {/* ── Header ── */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/dashboard" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
                            <ArrowLeft size={20} className="text-slate-400" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-white">Categorías y Subcategorías</h1>
                            <p className="text-xs text-slate-400">
                                {categorias.length} categorías · {subcategorias.length} subcategorías
                            </p>
                        </div>
                    </div>
                    {tab === 'categorias' ? (
                        <button
                            onClick={() => openCatModal()}
                            className="flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-orange-500/20"
                        >
                            <Plus size={16} /> Nueva Categoría
                        </button>
                    ) : (
                        <button
                            onClick={() => openSubModal()}
                            className="flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-orange-500/20"
                        >
                            <Plus size={16} /> Nueva Subcategoría
                        </button>
                    )}
                </div>

                {/* ── Tabs ── */}
                <div className="max-w-7xl mx-auto mt-4 flex gap-1 bg-slate-800/50 rounded-xl p-1 w-fit">
                    <button
                        onClick={() => setTab('categorias')}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'categorias' ? 'bg-brand-orange text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        Categorías
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === 'categorias' ? 'bg-white/20' : 'bg-slate-700'}`}>
                            {categorias.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setTab('subcategorias')}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'subcategorias' ? 'bg-brand-orange text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        Subcategorías
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === 'subcategorias' ? 'bg-white/20' : 'bg-slate-700'}`}>
                            {subcategorias.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                TAB: CATEGORÍAS
            ══════════════════════════════════════════════════ */}
            {tab === 'categorias' && (
                <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

                    {/* Search */}
                    <div className="relative max-w-xl">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar categorías..."
                            value={searchCat}
                            onChange={e => setSearchCat(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange transition-colors"
                        />
                    </div>

                    {loadingCat ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
                        </div>
                    ) : filteredCats.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-slate-500">No se encontraron categorías</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCats.map(cat => (
                                <div key={cat.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-slate-700 hover:shadow-xl hover:shadow-black/30 transition-all duration-300 group flex flex-col">
                                    {/* Imagen */}
                                    <div className="aspect-[16/9] bg-slate-800 relative overflow-hidden">
                                        {cat.imagen_url ? (
                                            <img src={cat.imagen_url} alt={cat.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-5xl">{cat.emoji || '📦'}</div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                        {/* Badge estado */}
                                        <div className="absolute top-3 right-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-md ${cat.activa ? 'bg-emerald-500/90 text-white' : 'bg-slate-600/90 text-slate-200'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${cat.activa ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                                                {cat.activa ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </div>

                                        {/* Emoji flotante */}
                                        <div className="absolute -bottom-5 right-5 w-12 h-12 bg-slate-900 border-2 border-slate-800 rounded-xl flex items-center justify-center text-2xl shadow-lg z-10 group-hover:scale-110 transition-transform">
                                            {cat.emoji || '📦'}
                                        </div>
                                    </div>

                                    <div className="p-5 pt-8 flex-1 flex flex-col">
                                        <h3 className="font-bold text-lg text-white mb-0.5 group-hover:text-brand-orange transition-colors">{cat.nombre}</h3>
                                        <p className="text-xs text-slate-500 font-mono mb-2">/{cat.slug}</p>
                                        <p className="text-sm text-slate-400 flex-1 line-clamp-2">{cat.descripcion || 'Sin descripción'}</p>

                                        {/* Subcategorías count */}
                                        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                                            <Layers size={12} />
                                            {subcategorias.filter(s => s.categoria_id === cat.id).length} subcategorías
                                        </div>

                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                                            <span className="text-xs text-slate-600">Orden: {cat.orden}</span>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => openCatModal(cat)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors" title="Editar">
                                                    <Edit size={15} />
                                                </button>
                                                <button onClick={() => toggleCatActiva(cat)} className={`p-2 rounded-lg transition-colors ${cat.activa ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-800'}`} title={cat.activa ? 'Desactivar' : 'Activar'}>
                                                    <Check size={15} />
                                                </button>
                                                <button onClick={() => handleCatDelete(cat.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors" title="Eliminar">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════
                TAB: SUBCATEGORÍAS
            ══════════════════════════════════════════════════ */}
            {tab === 'subcategorias' && (
                <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Total', value: subcategorias.length },
                            { label: 'Activas', value: subcategorias.filter(s => s.activa).length },
                            { label: 'Sin categoría', value: subcategorias.filter(s => !s.categoria_id).length },
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
                            placeholder="Buscar subcategorías o categoría..."
                            value={searchSub}
                            onChange={e => setSearchSub(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange transition-colors"
                        />
                    </div>

                    {loadingSub ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
                        </div>
                    ) : filteredSubs.length === 0 ? (
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
                                    {filteredSubs.map(s => (
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
                                                    <button onClick={() => openSubModal(s)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleSubDelete(s.id, s.nombre)}
                                                        disabled={!!deletingSub}
                                                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-30"
                                                    >
                                                        {deletingSub === s.id
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
            )}

            {/* ══════════════════════════════════════════════════
                MODAL: CATEGORÍA
            ══════════════════════════════════════════════════ */}
            {showCatModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCatModal(false)}>
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 flex justify-between items-center border-b border-slate-800">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    {editingCat ? <Edit size={18} className="text-brand-orange" /> : <Plus size={18} className="text-brand-orange" />}
                                    {editingCat ? 'Editar Categoría' : 'Nueva Categoría'}
                                </h2>
                                <p className="text-slate-400 text-xs mt-0.5">
                                    {editingCat ? 'Modifica los detalles de la categoría.' : 'Agrega una nueva categoría al catálogo.'}
                                </p>
                            </div>
                            <button onClick={() => setShowCatModal(false)} className="w-9 h-9 rounded-full bg-white/10 text-white hover:bg-red-500/80 flex items-center justify-center transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCatSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Izquierda */}
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre *</label>
                                        <input
                                            type="text" required
                                            value={catForm.nombre}
                                            onChange={e => setCatForm({ ...catForm, nombre: e.target.value, slug: generateSlug(e.target.value) })}
                                            placeholder="ej. Deportivos, Casual..."
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                                            Slug (URL) <span className="text-slate-600 font-normal normal-case">Automático</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">/</span>
                                            <input
                                                type="text" required
                                                value={catForm.slug}
                                                onChange={e => setCatForm({ ...catForm, slug: e.target.value })}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-7 pr-3 py-2.5 text-slate-400 text-sm font-mono focus:outline-none focus:border-brand-orange transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Emoji</label>
                                            <input
                                                type="text"
                                                value={catForm.emoji}
                                                onChange={e => setCatForm({ ...catForm, emoji: e.target.value })}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-2xl text-center focus:outline-none focus:border-brand-orange transition-colors"
                                                placeholder="👟"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Orden</label>
                                            <input
                                                type="number"
                                                value={catForm.orden}
                                                onChange={e => setCatForm({ ...catForm, orden: parseInt(e.target.value) })}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm font-mono text-center focus:outline-none focus:border-brand-orange transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Derecha */}
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Descripción</label>
                                        <textarea
                                            value={catForm.descripcion}
                                            onChange={e => setCatForm({ ...catForm, descripcion: e.target.value })}
                                            rows={2}
                                            placeholder="Breve descripción..."
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors resize-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                                            Imagen de Portada
                                            {editingCat && <span className="text-slate-600 font-normal normal-case">Opcional para cambiar</span>}
                                        </label>
                                        <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 cursor-pointer transition-colors ${imageFile ? 'border-brand-orange bg-orange-500/5' : 'border-slate-700 hover:border-slate-600'}`}>
                                            {imageFile
                                                ? <><Check size={28} className="text-brand-orange mb-1" /><p className="text-sm text-brand-orange font-medium truncate max-w-[180px]">{imageFile.name}</p></>
                                                : <><Upload size={28} className="text-slate-500 mb-1" /><p className="text-xs text-slate-500"><span className="text-brand-orange font-semibold">Clic para subir</span> o arrastra</p><p className="text-xs text-slate-600 mt-0.5">PNG, JPG (máx. 2MB)</p></>
                                            }
                                            <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl border border-slate-700">
                                        <button
                                            type="button"
                                            onClick={() => setCatForm(f => ({ ...f, activa: !f.activa }))}
                                            className={`w-11 h-6 rounded-full overflow-hidden transition-colors relative flex-shrink-0 ${catForm.activa ? 'bg-emerald-500' : 'bg-slate-600'}`}
                                        >
                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${catForm.activa ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                                        </button>
                                        <span className="text-sm text-slate-300">{catForm.activa ? 'Categoría visible en la tienda' : 'Categoría oculta'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6 pt-5 border-t border-slate-800">
                                <button type="button" onClick={() => setShowCatModal(false)} className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-1 px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                                    {editingCat ? <><Edit size={15} /> Guardar cambios</> : <><Plus size={15} /> Crear Categoría</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════
                MODAL: SUBCATEGORÍA
            ══════════════════════════════════════════════════ */}
            {showSubModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowSubModal(false)}>
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h2 className="font-bold text-white">{editingSub ? 'Editar Subcategoría' : 'Nueva Subcategoría'}</h2>
                            <button onClick={() => setShowSubModal(false)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {subError && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">{subError}</div>
                            )}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre *</label>
                                <input
                                    type="text"
                                    value={subForm.nombre}
                                    onChange={e => setSubForm(f => ({ ...f, nombre: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors"
                                    placeholder="ej. Turf, Salonera, Running..."
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoría Principal</label>
                                <select
                                    value={subForm.categoria_id}
                                    onChange={e => setSubForm(f => ({ ...f, categoria_id: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors"
                                >
                                    <option value="">— Sin categoría —</option>
                                    {categorias.map(c => (
                                        <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Orden</label>
                                    <input
                                        type="number"
                                        value={subForm.orden}
                                        onChange={e => setSubForm(f => ({ ...f, orden: parseInt(e.target.value) || 0 }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</label>
                                    <div className="flex items-center gap-3 pt-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setSubForm(f => ({ ...f, activa: !f.activa }))}
                                            className={`w-11 h-6 rounded-full overflow-hidden transition-colors relative flex-shrink-0 ${subForm.activa ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                        >
                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${subForm.activa ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                                        </button>
                                        <span className="text-sm text-slate-300">{subForm.activa ? 'Activa' : 'Inactiva'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 p-5 border-t border-slate-800">
                            <button onClick={() => setShowSubModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubSave}
                                disabled={savingSub}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
                            >
                                {savingSub
                                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <Save size={15} />
                                }
                                {editingSub ? 'Guardar cambios' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
