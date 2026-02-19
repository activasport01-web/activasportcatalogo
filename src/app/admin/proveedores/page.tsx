'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
    ArrowLeft, Plus, Search, Pencil, Trash2, X, Save,
    Phone, Mail, MapPin, User, FileText, Building2, CheckCircle2, XCircle
} from 'lucide-react'
import Link from 'next/link'

interface Proveedor {
    id: string
    nombre: string
    contacto: string | null
    telefono: string | null
    email: string | null
    pais: string | null
    ciudad: string | null
    notas: string | null
    activo: boolean
    created_at: string
}

const emptyForm = {
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    pais: 'Bolivia',
    ciudad: '',
    notas: '',
    activo: true,
}

export default function ProveedoresPage() {
    const [proveedores, setProveedores] = useState<Proveedor[]>([])
    const [filtered, setFiltered] = useState<Proveedor[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState<Proveedor | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)

    useEffect(() => { loadProveedores() }, [])

    useEffect(() => {
        const term = search.toLowerCase()
        setFiltered(
            term
                ? proveedores.filter(p =>
                    p.nombre.toLowerCase().includes(term) ||
                    p.pais?.toLowerCase().includes(term) ||
                    p.ciudad?.toLowerCase().includes(term) ||
                    p.contacto?.toLowerCase().includes(term)
                )
                : proveedores
        )
    }, [search, proveedores])

    const loadProveedores = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('proveedores')
            .select('*')
            .order('created_at', { ascending: false })
        if (!error) setProveedores(data || [])
        setLoading(false)
    }

    const openNew = () => {
        setEditing(null)
        setForm(emptyForm)
        setShowModal(true)
    }

    const openEdit = (p: Proveedor) => {
        setEditing(p)
        setForm({
            nombre: p.nombre,
            contacto: p.contacto || '',
            telefono: p.telefono || '',
            email: p.email || '',
            pais: p.pais || 'Bolivia',
            ciudad: p.ciudad || '',
            notas: p.notas || '',
            activo: p.activo,
        })
        setShowModal(true)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.nombre.trim()) return alert('El nombre del proveedor es obligatorio.')
        setSaving(true)
        const payload = {
            nombre: form.nombre.trim(),
            contacto: form.contacto || null,
            telefono: form.telefono || null,
            email: form.email || null,
            pais: form.pais || null,
            ciudad: form.ciudad || null,
            notas: form.notas || null,
            activo: form.activo,
        }
        if (editing) {
            await supabase.from('proveedores').update(payload).eq('id', editing.id)
        } else {
            await supabase.from('proveedores').insert(payload)
        }
        setSaving(false)
        setShowModal(false)
        loadProveedores()
    }

    const handleDelete = async (p: Proveedor) => {
        if (!confirm(`¿Eliminar al proveedor "${p.nombre}"? Esta acción no se puede deshacer.`)) return
        await supabase.from('proveedores').delete().eq('id', p.id)
        loadProveedores()
    }

    const toggleActivo = async (p: Proveedor) => {
        await supabase.from('proveedores').update({ activo: !p.activo }).eq('id', p.id)
        loadProveedores()
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black uppercase flex items-center gap-2">
                                <Building2 className="text-orange-500" size={26} />
                                Proveedores
                            </h1>
                            <p className="text-slate-500 text-sm">Gestiona a tus proveedores y contactos</p>
                        </div>
                    </div>
                    <button
                        onClick={openNew}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Nuevo Proveedor</span>
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, país, ciudad o contacto..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-orange-400 transition-all text-sm shadow-sm"
                    />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-md">
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Total</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white">{proveedores.length}</p>
                        <p className="text-sm text-slate-500">Proveedores</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-md">
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Activos</p>
                        <p className="text-3xl font-black text-green-600">{proveedores.filter(p => p.activo).length}</p>
                        <p className="text-sm text-slate-500">Trabajando</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-md">
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Países</p>
                        <p className="text-3xl font-black text-blue-600">{new Set(proveedores.map(p => p.pais)).size}</p>
                        <p className="text-sm text-slate-500">Distintos</p>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="text-center py-20 text-slate-400">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto mb-3"></div>
                        Cargando proveedores...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <Building2 size={48} className="mx-auto mb-3 opacity-20" />
                        <p className="font-bold">No hay proveedores registrados</p>
                        <p className="text-sm">Haz clic en "Nuevo Proveedor" para agregar uno.</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-950 text-xs uppercase text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4">Proveedor</th>
                                        <th className="px-6 py-4">Contacto</th>
                                        <th className="px-6 py-4">Ubicación</th>
                                        <th className="px-6 py-4">Teléfono / Email</th>
                                        <th className="px-6 py-4 text-center">Estado</th>
                                        <th className="px-6 py-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filtered.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-black text-slate-800 dark:text-white">{p.nombre}</p>
                                                {p.notas && <p className="text-xs text-slate-400 truncate max-w-xs">{p.notas}</p>}
                                            </td>
                                            <td className="px-6 py-4">
                                                {p.contacto
                                                    ? <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300"><User size={14} />{p.contacto}</span>
                                                    : <span className="text-slate-300 dark:text-slate-600">—</span>
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                                    <MapPin size={14} className="text-orange-400" />
                                                    {[p.ciudad, p.pais].filter(Boolean).join(', ') || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    {p.telefono && <a href={`tel:${p.telefono}`} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs"><Phone size={12} />{p.telefono}</a>}
                                                    {p.email && <a href={`mailto:${p.email}`} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs"><Mail size={12} />{p.email}</a>}
                                                    {!p.telefono && !p.email && <span className="text-slate-300 dark:text-slate-600">—</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={() => toggleActivo(p)} title="Cambiar estado">
                                                    {p.activo
                                                        ? <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full"><CheckCircle2 size={12} />Activo</span>
                                                        : <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 dark:bg-slate-800 text-xs font-bold px-2 py-1 rounded-full"><XCircle size={12} />Inactivo</span>
                                                    }
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => openEdit(p)} className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"><Pencil size={15} /></button>
                                                    <button onClick={() => handleDelete(p)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"><Trash2 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl font-black flex items-center gap-2">
                                <Building2 className="text-orange-500" size={22} />
                                {editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                            {/* Nombre */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Proveedor *</label>
                                <input
                                    required
                                    value={form.nombre}
                                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                                    placeholder="Ej: Importadora Chang"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 transition-all text-sm"
                                />
                            </div>

                            {/* Contacto */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1"><User size={12} className="inline mr-1" />Persona de Contacto</label>
                                <input
                                    value={form.contacto}
                                    onChange={e => setForm({ ...form, contacto: e.target.value })}
                                    placeholder="Ej: Juan Pérez"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 transition-all text-sm"
                                />
                            </div>

                            {/* Teléfono y Email */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1"><Phone size={12} className="inline mr-1" />Teléfono</label>
                                    <input
                                        value={form.telefono}
                                        onChange={e => setForm({ ...form, telefono: e.target.value })}
                                        placeholder="+591 7XXXXXXX"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1"><Mail size={12} className="inline mr-1" />Email</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        placeholder="proveedor@email.com"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {/* País y Ciudad */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1"><MapPin size={12} className="inline mr-1" />País</label>
                                    <input
                                        value={form.pais}
                                        onChange={e => setForm({ ...form, pais: e.target.value })}
                                        placeholder="Bolivia"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ciudad</label>
                                    <input
                                        value={form.ciudad}
                                        onChange={e => setForm({ ...form, ciudad: e.target.value })}
                                        placeholder="Santa Cruz"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {/* Notas */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1"><FileText size={12} className="inline mr-1" />Notas</label>
                                <textarea
                                    value={form.notas}
                                    onChange={e => setForm({ ...form, notas: e.target.value })}
                                    placeholder="Ej: Paga a 30 días, envía desde China, mínimo 10 docenas..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 transition-all text-sm resize-none"
                                />
                            </div>

                            {/* Activo toggle */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="activo"
                                    checked={form.activo}
                                    onChange={e => setForm({ ...form, activo: e.target.checked })}
                                    className="w-4 h-4 accent-orange-500"
                                />
                                <label htmlFor="activo" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Proveedor Activo</label>
                            </div>

                            {/* Botones */}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all disabled:opacity-60">
                                    <Save size={16} />
                                    {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
