'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, X, Home, Search, Ruler } from 'lucide-react'

interface GrupoTalla {
    id: string
    nombre: string
    rango_tallas?: string
    orden: number
    activa: boolean
}

export default function GruposAdmin() {
    const router = useRouter()
    const [grupos, setGrupos] = useState<GrupoTalla[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingItem, setEditingItem] = useState<GrupoTalla | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const [formData, setFormData] = useState({
        nombre: '',
        rango_tallas: '',
        orden: 0,
        activa: true
    })

    useEffect(() => {
        checkAuth()
        loadGrupos()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/admin/login')
        }
    }

    const loadGrupos = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('grupos_tallas')
            .select('*')
            .order('orden', { ascending: true })

        if (data) {
            setGrupos(data)
        }
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const payload = {
            nombre: formData.nombre,
            rango_tallas: formData.rango_tallas,
            orden: formData.orden,
            activa: formData.activa
        }

        if (editingItem) {
            const { error } = await supabase
                .from('grupos_tallas')
                .update(payload)
                .eq('id', editingItem.id)
            if (!error) {
                closeModal()
                loadGrupos()
            } else {
                alert('Error al actualizar: ' + error.message)
            }
        } else {
            const { error } = await supabase
                .from('grupos_tallas')
                .insert([payload])
            if (!error) {
                closeModal()
                loadGrupos()
            } else {
                alert('Error al crear: ' + error.message)
            }
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar este grupo de tallas?')) {
            const { error } = await supabase.from('grupos_tallas').delete().eq('id', id)
            if (!error) loadGrupos()
        }
    }

    const openModal = (item?: GrupoTalla) => {
        if (item) {
            setEditingItem(item)
            setFormData({
                nombre: item.nombre,
                rango_tallas: item.rango_tallas || '',
                orden: item.orden,
                activa: item.activa
            })
        } else {
            setEditingItem(null)
            setFormData({
                nombre: '',
                rango_tallas: '',
                orden: grupos.length + 1,
                activa: true
            })
        }
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingItem(null)
    }

    const filteredItems = grupos.filter(s =>
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950 border-b border-slate-700 dark:border-slate-800 shadow-lg text-white transition-colors">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-start gap-4">
                            <Link href="/admin/dashboard" className="mt-1 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm">
                                <ArrowLeft size={20} className="text-orange-400" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-3">
                                    Grupos de Tallas
                                    <span className="text-xs bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full border border-orange-500/30">Admin</span>
                                </h1>
                                <p className="text-slate-400 mt-2 flex items-center gap-2"><Home size={14} /> / Admin / Grupos</p>
                            </div>
                        </div>
                        <button onClick={() => openModal()} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2">
                            <Plus size={20} /> Nuevo Grupo
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map(item => (
                        <div key={item.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400"><Ruler size={24} /></div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${item.activa ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                    {item.activa ? 'ACTIVO' : 'INACTIVO'}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{item.nombre}</h3>
                            <p className="text-sm text-slate-400 mb-4">{item.rango_tallas ? `Tallas: ${item.rango_tallas}` : 'Sin rango definido'}</p>

                            <div className="mt-auto flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button onClick={() => openModal(item)} className="flex-1 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                                    <Edit size={16} /> Editar
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-0 overflow-hidden shadow-2xl border dark:border-slate-800">
                        <div className="bg-slate-800 dark:bg-slate-950 px-6 py-4 flex justify-between items-center text-white border-b border-slate-700 dark:border-slate-800">
                            <h2 className="font-bold text-lg">{editingItem ? 'Editar Grupo' : 'Nuevo Grupo'}</h2>
                            <button onClick={closeModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                                <input type="text" required value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej. Niño, Juvenil, Adulto" className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Rango de Tallas (Opcional)</label>
                                <input type="text" value={formData.rango_tallas} onChange={e => setFormData({ ...formData, rango_tallas: e.target.value })} placeholder="Ej. 18-34, 35-45" className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400" />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Orden</label>
                                    <input type="number" value={formData.orden} onChange={e => setFormData({ ...formData, orden: parseInt(e.target.value) })} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-slate-900 dark:text-slate-100" />
                                </div>
                                <div className="flex-1 flex items-center pt-6">
                                    <input type="checkbox" id="active_check" checked={formData.activa} onChange={e => setFormData({ ...formData, activa: e.target.checked })} className="mr-2 w-5 h-5 text-orange-500 focus:ring-orange-500 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" />
                                    <label htmlFor="active_check" className="font-bold text-slate-700 dark:text-slate-300">Activo</label>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 shadow-md">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
