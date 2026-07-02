'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Plus, Search, Pencil, Trash2, X, Save, Shield, Users, Info } from 'lucide-react'

interface Rol {
    id: string
    nombre: string
    descripcion: string | null
}

const emptyForm = { nombre: '', descripcion: '' }

export default function RolesPage() {
    const [roles, setRoles] = useState<Rol[]>([])
    const [usuariosPorRol, setUsuariosPorRol] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState<Rol | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)

    useEffect(() => { loadAll() }, [])

    const loadAll = async () => {
        setLoading(true)
        const [{ data: rols }, { data: usrs }] = await Promise.all([
            supabase.from('roles').select('*').order('nombre'),
            supabase.rpc('admin_listar_usuarios'),
        ])
        setRoles((rols as Rol[]) || [])
        const conteo: Record<string, number> = {}
        for (const u of (usrs || []) as any[]) {
            if (u.rol_id) conteo[u.rol_id] = (conteo[u.rol_id] || 0) + 1
        }
        setUsuariosPorRol(conteo)
        setLoading(false)
    }

    const filtered = roles.filter(r =>
        r.nombre.toLowerCase().includes(search.toLowerCase()) ||
        r.descripcion?.toLowerCase().includes(search.toLowerCase())
    )

    const openCreate = () => {
        setEditing(null)
        setForm(emptyForm)
        setError(null)
        setShowModal(true)
    }

    const openEdit = (r: Rol) => {
        setEditing(r)
        setForm({ nombre: r.nombre, descripcion: r.descripcion || '' })
        setError(null)
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!form.nombre.trim()) { setError('El nombre del rol es obligatorio'); return }
        setSaving(true)
        setError(null)
        const { error: err } = editing
            ? await supabase.rpc('admin_actualizar_rol', { p_id: editing.id, p_nombre: form.nombre.trim(), p_descripcion: form.descripcion })
            : await supabase.rpc('admin_crear_rol', { p_nombre: form.nombre.trim(), p_descripcion: form.descripcion })
        if (err) { setError(err.message); setSaving(false); return }
        setSaving(false)
        setShowModal(false)
        loadAll()
    }

    const handleDelete = async (id: string, nombre: string) => {
        if (!confirm(`¿Eliminar el rol "${nombre}"? Esta acción no se puede deshacer.`)) return
        setDeleting(id)
        const { error: err } = await supabase.rpc('admin_eliminar_rol', { p_id: id })
        if (err) alert(err.message)
        setDeleting(null)
        loadAll()
    }

    const rolColors: Record<string, { bg: string; icon: string; border: string }> = {
        'Administrador': { bg: 'bg-rose-500/10', icon: 'text-rose-400', border: 'border-rose-500/20' },
        'Empleado':      { bg: 'bg-blue-500/10',  icon: 'text-blue-400',  border: 'border-blue-500/20' },
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
                            <h1 className="text-xl font-bold text-white">Gestión de Roles</h1>
                            <p className="text-xs text-slate-400">Define los niveles de acceso del sistema</p>
                        </div>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-orange-500/20"
                    >
                        <Plus size={16} />
                        Nuevo Rol
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
                {/* Info hint */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-400 text-sm">
                    <Info size={14} className="flex-shrink-0 text-brand-orange" />
                    <span>Los permisos que tiene cada rol se configuran en la sección <Link href="/admin/permisos" className="text-brand-orange underline underline-offset-2">Permisos</Link>.</span>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar roles..."
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
                        <Shield size={44} className="mx-auto mb-3 text-slate-700" />
                        <p className="text-slate-500">No se encontraron roles</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(r => {
                            const colors = rolColors[r.nombre] || { bg: 'bg-slate-800', icon: 'text-slate-400', border: 'border-slate-700' }
                            const numUsuarios = usuariosPorRol[r.id] || 0
                            return (
                                <div
                                    key={r.id}
                                    className={`bg-slate-900 border ${colors.border} rounded-xl p-5 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors group`}
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className={`w-11 h-11 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                                            <Shield size={20} className={colors.icon} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-white">{r.nombre}</p>
                                            <p className="text-sm text-slate-400 truncate">
                                                {r.descripcion || <span className="italic text-slate-600">Sin descripción</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5 flex-shrink-0">
                                        <div className="flex items-center gap-1.5 text-slate-400 text-sm hidden sm:flex">
                                            <Users size={14} />
                                            <span>{numUsuarios} {numUsuarios === 1 ? 'usuario' : 'usuarios'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openEdit(r)}
                                                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(r.id, r.nombre)}
                                                disabled={!!deleting || numUsuarios > 0 || r.nombre.toLowerCase() === 'administrador'}
                                                className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                title={
                                                    r.nombre.toLowerCase() === 'administrador'
                                                        ? 'El rol Administrador no puede eliminarse'
                                                        : numUsuarios > 0
                                                            ? 'Tiene usuarios asignados, no se puede eliminar'
                                                            : 'Eliminar rol'
                                                }
                                            >
                                                {deleting === r.id
                                                    ? <div className="w-3.5 h-3.5 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                                    : <Trash2 size={15} />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h2 className="font-bold text-white">{editing ? 'Editar Rol' : 'Nuevo Rol'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">{error}</div>
                            )}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre del Rol *</label>
                                <input
                                    type="text"
                                    value={form.nombre}
                                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors"
                                    placeholder="ej. Vendedor, Supervisor..."
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Descripción</label>
                                <textarea
                                    value={form.descripcion}
                                    onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                                    rows={3}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors resize-none"
                                    placeholder="Describe las responsabilidades de este rol..."
                                />
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
                                {editing ? 'Guardar cambios' : 'Crear Rol'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
