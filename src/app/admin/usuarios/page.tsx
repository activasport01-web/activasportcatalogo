'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { ArrowLeft, Search, Pencil, X, Save, Users, UserCheck, UserX, ShieldCheck, Info, Plus, Eye, EyeOff, Trash2 } from 'lucide-react'

interface UsuarioAdmin {
    id: string
    nombre_completo: string | null
    email: string
    rol_id: string | null
    rol_nombre: string | null
    activo: boolean
    fecha_creacion: string
}

interface Rol {
    id: string
    nombre: string
}

export default function UsuariosPage() {
    const { profile } = useAuth()
    const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([])
    const [roles, setRoles] = useState<Rol[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    // Modal editar
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState<UsuarioAdmin | null>(null)
    const [form, setForm] = useState({ nombre_completo: '', rol_id: '', activo: true })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Modal crear
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [createForm, setCreateForm] = useState({ email: '', password: '', confirmar: '', nombre_completo: '', rol_id: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)

    // Eliminar
    const [deleting, setDeleting] = useState<string | null>(null)

    useEffect(() => { loadAll() }, [])

    const loadAll = async () => {
        setLoading(true)
        setLoadError(null)
        const [{ data: usrs, error: rpcErr }, { data: rols }] = await Promise.all([
            supabase.rpc('admin_listar_usuarios'),
            supabase.from('roles').select('id, nombre').order('nombre'),
        ])
        if (rpcErr) setLoadError(rpcErr.message)
        setUsuarios((usrs as UsuarioAdmin[]) || [])
        setRoles((rols as Rol[]) || [])
        setLoading(false)
    }

    const filtered = usuarios.filter(u => {
        const term = search.toLowerCase()
        return (
            u.nombre_completo?.toLowerCase().includes(term) ||
            u.email?.toLowerCase().includes(term) ||
            u.rol_nombre?.toLowerCase().includes(term)
        )
    })

    const openEdit = (u: UsuarioAdmin) => {
        setEditing(u)
        setForm({ nombre_completo: u.nombre_completo || '', rol_id: u.rol_id || '', activo: u.activo })
        setError(null)
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!editing) return
        setSaving(true)
        setError(null)
        const { error: err } = await supabase.rpc('admin_actualizar_usuario', {
            p_id: editing.id,
            p_nombre_completo: form.nombre_completo,
            p_rol_id: form.rol_id || null,
            p_activo: form.activo,
        })
        if (err) { setError(err.message); setSaving(false); return }
        setSaving(false)
        setShowModal(false)
        loadAll()
    }

    const openCreate = () => {
        setCreateForm({ email: '', password: '', confirmar: '', nombre_completo: '', rol_id: '' })
        setCreateError(null)
        setShowPassword(false)
        setShowCreateModal(true)
    }

    const handleCreate = async () => {
        if (!createForm.email.trim()) { setCreateError('El correo es obligatorio'); return }
        if (!createForm.password) { setCreateError('La contraseña es obligatoria'); return }
        if (createForm.password.length < 6) { setCreateError('La contraseña debe tener al menos 6 caracteres'); return }
        if (createForm.password !== createForm.confirmar) { setCreateError('Las contraseñas no coinciden'); return }

        setCreating(true)
        setCreateError(null)
        const res = await fetch('/api/admin/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: createForm.email,
                password: createForm.password,
                nombre_completo: createForm.nombre_completo,
                rol_id: createForm.rol_id || null,
            }),
        })
        const data = await res.json()
        if (!res.ok) { setCreateError(data.error || 'Error al crear el usuario'); setCreating(false); return }
        setCreating(false)
        setShowCreateModal(false)
        loadAll()
    }

    const handleDelete = async (u: UsuarioAdmin) => {
        if (!confirm(`¿Eliminar permanentemente la cuenta de ${u.email}?\n\nEsta acción no se puede deshacer.`)) return
        setDeleting(u.id)
        const res = await fetch(`/api/admin/usuarios?id=${u.id}`, { method: 'DELETE' })
        const data = await res.json()
        if (!res.ok) alert(data.error || 'Error al eliminar')
        setDeleting(null)
        loadAll()
    }

    const initials = (name: string | null) => {
        if (!name) return '?'
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    }

    const rolBadge: Record<string, string> = {
        'Administrador': 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
        'Empleado':      'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    }

    const stats = {
        total:    usuarios.length,
        activos:  usuarios.filter(u => u.activo).length,
        inactivos: usuarios.filter(u => !u.activo).length,
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/dashboard" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
                            <ArrowLeft size={20} className="text-slate-400" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-white">Gestión de Usuarios</h1>
                            <p className="text-xs text-slate-400">Administra accesos al panel administrativo</p>
                        </div>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-orange-500/20"
                    >
                        <Plus size={16} />
                        Nuevo Usuario
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-slate-800">
                                <Users size={18} className="text-brand-orange" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.total}</p>
                                <p className="text-xs text-slate-400">Total</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-500/10">
                                <UserCheck size={18} className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-emerald-400">{stats.activos}</p>
                                <p className="text-xs text-slate-400">Activos</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-red-500/10">
                                <UserX size={18} className="text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-400">{stats.inactivos}</p>
                                <p className="text-xs text-slate-400">Inactivos</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, correo o rol..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange transition-colors"
                    />
                </div>

                {/* Error de carga */}
                {loadError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                        <Info size={15} className="flex-shrink-0 mt-0.5" />
                        <span><strong>Error al cargar usuarios:</strong> {loadError}</span>
                    </div>
                )}

                {/* Table */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <Users size={44} className="mx-auto mb-3 text-slate-700" />
                            <p className="text-slate-500">No se encontraron usuarios</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-800">
                                        <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Usuario</th>
                                        <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Rol</th>
                                        <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Estado</th>
                                        <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Registrado</th>
                                        <th className="px-5 py-3 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/70">
                                    {filtered.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-800/40 transition-colors group">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-orange to-orange-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg shadow-orange-500/20">
                                                        {initials(u.nombre_completo)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-white text-sm truncate">
                                                            {u.nombre_completo || <span className="text-slate-500 italic font-normal">Sin nombre</span>}
                                                        </p>
                                                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {u.rol_nombre ? (
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${rolBadge[u.rol_nombre] || 'bg-slate-700/50 text-slate-300 border border-slate-700'}`}>
                                                        {u.rol_nombre}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-600 italic">Sin rol</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${u.activo ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                                    {u.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-slate-500 hidden md:table-cell">
                                                {new Date(u.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEdit(u)}
                                                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    {u.id !== profile?.id && (
                                                        <button
                                                            onClick={() => handleDelete(u)}
                                                            disabled={!!deleting}
                                                            className="p-2 rounded-lg hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-40"
                                                            title="Eliminar permanentemente"
                                                        >
                                                            {deleting === u.id
                                                                ? <div className="w-3.5 h-3.5 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                                                : <Trash2 size={14} />
                                                            }
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Crear Usuario */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <div>
                                <h2 className="font-bold text-white">Nuevo Usuario</h2>
                                <p className="text-xs text-slate-400 mt-0.5">La cuenta se activa inmediatamente, sin email de confirmación</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {createError && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                                    <Info size={14} className="flex-shrink-0 mt-0.5" />
                                    {createError}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Correo Electrónico *</label>
                                <input
                                    type="email"
                                    value={createForm.email}
                                    onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors"
                                    placeholder="usuario@ejemplo.com"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contraseña *</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={createForm.password}
                                            onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 pr-9 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors"
                                            placeholder="Mín. 6 caracteres"
                                        />
                                        <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirmar *</label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={createForm.confirmar}
                                        onChange={e => setCreateForm(f => ({ ...f, confirmar: e.target.value }))}
                                        className={`w-full bg-slate-800 border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors ${createForm.confirmar && createForm.password !== createForm.confirmar ? 'border-red-500/50' : 'border-slate-700'}`}
                                        placeholder="Repetir contraseña"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={createForm.nombre_completo}
                                    onChange={e => setCreateForm(f => ({ ...f, nombre_completo: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors"
                                    placeholder="Nombre completo del usuario"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol</label>
                                <select
                                    value={createForm.rol_id}
                                    onChange={e => setCreateForm(f => ({ ...f, rol_id: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors"
                                >
                                    <option value="">Sin rol asignado</option>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 p-5 border-t border-slate-800">
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={creating}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
                            >
                                {creating
                                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <Plus size={15} />
                                }
                                Crear Usuario
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Editar */}
            {showModal && editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h2 className="font-bold text-white">Editar Usuario</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Avatar header */}
                            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-orange to-orange-700 flex items-center justify-center text-white font-bold text-sm">
                                    {initials(editing.nombre_completo)}
                                </div>
                                <div>
                                    <p className="font-medium text-white text-sm">{editing.email}</p>
                                    <p className="text-xs text-slate-500 font-mono">ID: {editing.id.slice(0, 16)}…</p>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                                    <ShieldCheck size={15} className="flex-shrink-0 mt-0.5" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={form.nombre_completo}
                                    onChange={e => setForm(f => ({ ...f, nombre_completo: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors"
                                    placeholder="Nombre completo del usuario"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol Asignado</label>
                                <select
                                    value={form.rol_id}
                                    onChange={e => setForm(f => ({ ...f, rol_id: e.target.value }))}
                                    disabled={editing?.id === profile?.id}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">Sin rol</option>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.nombre}</option>
                                    ))}
                                </select>
                                {editing?.id === profile?.id && (
                                    <p className="text-xs text-amber-400 flex items-center gap-1 px-1">
                                        <Info size={11} /> No puedes cambiar tu propio rol.
                                    </p>
                                )}
                            </div>

                            <div className={`flex items-center justify-between p-3.5 rounded-xl border ${form.activo ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-800 border-slate-700'}`}>
                                <div>
                                    <p className="text-sm font-semibold text-white">Cuenta activa</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {form.activo ? 'Puede iniciar sesión en el panel' : 'No puede acceder al sistema'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (editing.id !== profile?.id) setForm(f => ({ ...f, activo: !f.activo }))
                                    }}
                                    disabled={editing.id === profile?.id}
                                    className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 overflow-hidden ${form.activo ? 'bg-emerald-500' : 'bg-slate-600'} disabled:opacity-40 disabled:cursor-not-allowed`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.activo ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            {editing.id === profile?.id && (
                                <p className="text-xs text-amber-400 flex items-center gap-1.5">
                                    <Info size={12} /> No puedes desactivar tu propia cuenta.
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3 p-5 border-t border-slate-800">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors"
                            >
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
                                Guardar cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
