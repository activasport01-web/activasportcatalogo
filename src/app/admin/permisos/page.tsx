'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Plus, Search, Pencil, Trash2, X, Save, Key, Shield, ChevronRight } from 'lucide-react'

interface Permiso {
    id: string
    codigo: string
    descripcion: string | null
}

interface Rol {
    id: string
    nombre: string
    descripcion: string | null
}

export default function PermisosPage() {
    const [roles, setRoles] = useState<Rol[]>([])
    const [permisos, setPermisos] = useState<Permiso[]>([])
    const [selectedRolId, setSelectedRolId] = useState<string | null>(null)
    const [asignados, setAsignados] = useState<Set<string>>(new Set())
    const [toggling, setToggling] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadingAsig, setLoadingAsig] = useState(false)
    const [search, setSearch] = useState('')

    // Modal CRUD de permisos
    const [showModal, setShowModal] = useState(false)
    const [editingPerm, setEditingPerm] = useState<Permiso | null>(null)
    const [form, setForm] = useState({ codigo: '', descripcion: '' })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => { loadAll() }, [])

    useEffect(() => {
        if (selectedRolId) loadAsignados(selectedRolId)
    }, [selectedRolId])

    const loadAll = async () => {
        setLoading(true)
        const [{ data: rols }, { data: perms }] = await Promise.all([
            supabase.from('roles').select('*').order('nombre'),
            supabase.from('permisos').select('*').order('codigo'),
        ])
        const rolsList = (rols as Rol[]) || []
        const permsList = (perms as Permiso[]) || []
        setRoles(rolsList)
        setPermisos(permsList)
        if (rolsList.length > 0 && !selectedRolId) setSelectedRolId(rolsList[0].id)
        setLoading(false)
    }

    const loadAsignados = async (rolId: string) => {
        setLoadingAsig(true)
        const { data } = await supabase.from('roles_permisos').select('permiso_id').eq('rol_id', rolId)
        setAsignados(new Set((data || []).map((r: any) => r.permiso_id as string)))
        setLoadingAsig(false)
    }

    const togglePermiso = async (permisoId: string) => {
        if (!selectedRolId || toggling) return
        setToggling(permisoId)
        const tiene = asignados.has(permisoId)
        const { error: err } = tiene
            ? await supabase.rpc('admin_remover_permiso', { p_rol_id: selectedRolId, p_permiso_id: permisoId })
            : await supabase.rpc('admin_asignar_permiso', { p_rol_id: selectedRolId, p_permiso_id: permisoId })
        if (!err) {
            const next = new Set(asignados)
            tiene ? next.delete(permisoId) : next.add(permisoId)
            setAsignados(next)
        }
        setToggling(null)
    }

    const filteredPerms = permisos.filter(p =>
        p.codigo.toLowerCase().includes(search.toLowerCase()) ||
        p.descripcion?.toLowerCase().includes(search.toLowerCase())
    )

    const openCreatePerm = () => {
        setEditingPerm(null)
        setForm({ codigo: '', descripcion: '' })
        setError(null)
        setShowModal(true)
    }

    const openEditPerm = (p: Permiso) => {
        setEditingPerm(p)
        setForm({ codigo: p.codigo, descripcion: p.descripcion || '' })
        setError(null)
        setShowModal(true)
    }

    const handleSavePerm = async () => {
        if (!form.codigo.trim()) { setError('El código del permiso es obligatorio'); return }
        setSaving(true)
        setError(null)
        const { error: err } = editingPerm
            ? await supabase.rpc('admin_actualizar_permiso', { p_id: editingPerm.id, p_codigo: form.codigo.trim(), p_descripcion: form.descripcion })
            : await supabase.rpc('admin_crear_permiso', { p_codigo: form.codigo.trim(), p_descripcion: form.descripcion })
        if (err) { setError(err.message); setSaving(false); return }
        setSaving(false)
        setShowModal(false)
        loadAll()
        if (selectedRolId) loadAsignados(selectedRolId)
    }

    const handleDeletePerm = async (p: Permiso) => {
        if (!confirm(`¿Eliminar el permiso "${p.codigo}"? Se quitará de todos los roles.`)) return
        const { error: err } = await supabase.rpc('admin_eliminar_permiso', { p_id: p.id })
        if (err) { alert(err.message); return }
        loadAll()
        if (selectedRolId) loadAsignados(selectedRolId)
    }

    const selectedRol = roles.find(r => r.id === selectedRolId)

    const rolColors: Record<string, string> = {
        'Administrador': 'bg-rose-500 text-white shadow-rose-500/30',
        'Empleado':      'bg-blue-500 text-white shadow-blue-500/30',
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/dashboard" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
                            <ArrowLeft size={20} className="text-slate-400" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-white">Permisos por Rol</h1>
                            <p className="text-xs text-slate-400">Controla qué puede hacer cada rol en el sistema</p>
                        </div>
                    </div>
                    <button
                        onClick={openCreatePerm}
                        className="flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-orange-500/20"
                    >
                        <Plus size={16} />
                        Nuevo Permiso
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
                </div>
            ) : (
                <div className="max-w-7xl mx-auto px-4 py-6 flex gap-5">

                    {/* Sidebar roles */}
                    <div className="w-52 flex-shrink-0">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Roles</p>
                        <div className="space-y-2">
                            {roles.map(r => {
                                const active = selectedRolId === r.id
                                return (
                                    <button
                                        key={r.id}
                                        onClick={() => setSelectedRolId(r.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                                            active
                                                ? `${rolColors[r.nombre] || 'bg-brand-orange text-white'} shadow-lg`
                                                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Shield size={14} className="flex-shrink-0" />
                                            <span className="truncate">{r.nombre}</span>
                                        </div>
                                        <ChevronRight size={14} className={active ? 'opacity-80' : 'opacity-20'} />
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Panel permisos */}
                    <div className="flex-1 min-w-0 space-y-4">
                        {/* Resumen del rol seleccionado */}
                        {selectedRol && (
                            <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center">
                                        <Shield size={18} className="text-brand-orange" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{selectedRol.nombre}</p>
                                        <p className="text-sm text-slate-400">{selectedRol.descripcion || 'Sin descripción'}</p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-3xl font-black text-brand-orange">{asignados.size}</p>
                                    <p className="text-xs text-slate-500">de {permisos.length} permisos</p>
                                </div>
                            </div>
                        )}

                        {/* Barra de progreso */}
                        {permisos.length > 0 && (
                            <div className="bg-slate-900 rounded-xl border border-slate-800 px-4 py-3">
                                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                                    <span>Cobertura de permisos</span>
                                    <span>{Math.round((asignados.size / permisos.length) * 100)}%</span>
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-brand-orange to-orange-400 rounded-full transition-all duration-500"
                                        style={{ width: `${(asignados.size / permisos.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Búsqueda */}
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar permisos..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange transition-colors"
                            />
                        </div>

                        {/* Lista de permisos */}
                        {loadingAsig ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-6 h-6 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
                            </div>
                        ) : filteredPerms.length === 0 ? (
                            <div className="text-center py-16">
                                <Key size={40} className="mx-auto mb-3 text-slate-700" />
                                <p className="text-slate-500">No se encontraron permisos</p>
                                <button onClick={openCreatePerm} className="mt-3 text-brand-orange text-sm underline underline-offset-2">
                                    Crear el primero
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredPerms.map(p => {
                                    const tiene = asignados.has(p.id)
                                    const isToggling = toggling === p.id
                                    return (
                                        <div
                                            key={p.id}
                                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                                                tiene
                                                    ? 'bg-emerald-500/5 border-emerald-500/25'
                                                    : 'bg-slate-900 border-slate-800'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tiene ? 'bg-emerald-500/15' : 'bg-slate-800'}`}>
                                                    <Key size={15} className={tiene ? 'text-emerald-400' : 'text-slate-500'} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-mono font-semibold text-white truncate">{p.codigo}</p>
                                                    <p className="text-xs text-slate-400 truncate">{p.descripcion || <span className="italic">Sin descripción</span>}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                                <button
                                                    onClick={() => openEditPerm(p)}
                                                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
                                                    title="Editar permiso"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePerm(p)}
                                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                                                    title="Eliminar permiso"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                                {/* Toggle switch */}
                                                <button
                                                    onClick={() => togglePermiso(p.id)}
                                                    disabled={isToggling}
                                                    className={`w-11 h-6 rounded-full overflow-hidden transition-colors relative flex-shrink-0 ${
                                                        tiene ? 'bg-emerald-500' : 'bg-slate-700'
                                                    } ${isToggling ? 'opacity-50' : ''}`}
                                                    title={tiene ? 'Quitar permiso' : 'Asignar permiso'}
                                                >
                                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${tiene ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal CRUD Permisos */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h2 className="font-bold text-white">{editingPerm ? 'Editar Permiso' : 'Nuevo Permiso'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">{error}</div>
                            )}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Código del Permiso *</label>
                                <input
                                    type="text"
                                    value={form.codigo}
                                    onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-brand-orange transition-colors"
                                    placeholder="ej. gestionar_catalogo, ver_reportes..."
                                    autoFocus
                                />
                                <p className="text-xs text-slate-500 px-1">Usa guiones bajos, sin espacios. Se usa en el código para verificar acceso.</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Descripción</label>
                                <input
                                    type="text"
                                    value={form.descripcion}
                                    onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors"
                                    placeholder="Qué permite hacer este permiso..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 p-5 border-t border-slate-800">
                            <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSavePerm}
                                disabled={saving}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
                            >
                                {saving
                                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <Save size={15} />
                                }
                                {editingPerm ? 'Guardar cambios' : 'Crear Permiso'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
