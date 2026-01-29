'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, X, Upload, Home, Search, Layers, Check } from 'lucide-react'

interface Subcategoria {
    id: string
    nombre: string
    categoria_relacionada: string | null
    orden: number
    activa: boolean
    imagen_url?: string
}

export default function SubcategoriasAdmin() {
    const router = useRouter()
    const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingSub, setEditingSub] = useState<Subcategoria | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)

    const [formData, setFormData] = useState({
        nombre: '',
        categoria_relacionada: 'Deportivo', // Default
        orden: 0,
        activa: true,
        imagen_url: ''
    })

    useEffect(() => {
        checkAuth()
        loadSubcategorias()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/admin/login')
        }
    }

    const loadSubcategorias = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('subcategorias')
            .select('*')
            .order('orden', { ascending: true })

        if (data) {
            setSubcategorias(data)
        }
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        let imagen_url = editingSub?.imagen_url || ''

        // Subir imagen
        if (imageFile) {
            const fileName = `subcat_${Date.now()}_${imageFile.name}`
            const { error: uploadError } = await supabase.storage
                .from('imagenes-zapatos') // Reusing same bucket
                .upload(fileName, imageFile)

            if (!uploadError) {
                const { data } = supabase.storage
                    .from('imagenes-zapatos')
                    .getPublicUrl(fileName)
                imagen_url = data.publicUrl
            }
        }

        const payload = {
            nombre: formData.nombre,
            categoria_relacionada: formData.categoria_relacionada,
            orden: formData.orden,
            activa: formData.activa,
            imagen_url
        }

        if (editingSub) {
            const { error } = await supabase
                .from('subcategorias')
                .update(payload)
                .eq('id', editingSub.id)
            if (!error) {
                closeModal()
                loadSubcategorias()
            } else {
                alert('Error al actualizar: ' + error.message)
            }
        } else {
            const { error } = await supabase
                .from('subcategorias')
                .insert([payload])
            if (!error) {
                closeModal()
                loadSubcategorias()
            } else {
                alert('Error al crear: ' + error.message)
            }
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar esta subcategoría / tipo de planta?')) {
            const { error } = await supabase.from('subcategorias').delete().eq('id', id)
            if (!error) loadSubcategorias()
        }
    }

    const openModal = (item?: Subcategoria) => {
        if (item) {
            setEditingSub(item)
            setFormData({
                nombre: item.nombre,
                categoria_relacionada: item.categoria_relacionada || 'Deportivo',
                orden: item.orden,
                activa: item.activa,
                imagen_url: item.imagen_url || ''
            })
        } else {
            setEditingSub(null)
            setFormData({
                nombre: '',
                categoria_relacionada: 'Deportivo',
                orden: subcategorias.length + 1,
                activa: true,
                imagen_url: ''
            })
        }
        setImageFile(null)
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingSub(null)
        setImageFile(null)
    }

    const filteredItems = subcategorias.filter(s =>
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.categoria_relacionada && s.categoria_relacionada.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950 border-b border-slate-700 dark:border-slate-800 shadow-lg text-white transition-colors">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-start gap-4">
                            <Link
                                href="/admin/dashboard"
                                className="mt-1 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
                            >
                                <ArrowLeft size={20} className="text-orange-400" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-3">
                                    Tipos de Planta
                                    <span className="text-xs bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full border border-orange-500/30">
                                        Subcategorías
                                    </span>
                                </h1>
                                <p className="text-slate-400 mt-2 flex items-center gap-2">
                                    <Home size={14} /> / Admin / Subcategorías
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => openModal()}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
                        >
                            <Plus size={20} /> Nuevo Tipo
                        </button>
                    </div>

                    {/* Barra de Búsqueda Integrada */}
                    <div className="mt-8 max-w-2xl px-1">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar tipo de planta..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/10 rounded-xl focus:bg-white/20 focus:border-orange-500/50 outline-none text-white placeholder-slate-400 transition-all backdrop-blur-md"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map(item => (
                        <div key={item.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                                    <Layers size={24} />
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${item.activa ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                    {item.activa ? 'ACTIVO' : 'INACTIVO'}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{item.nombre}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{item.categoria_relacionada || 'Todas las categorías'}</p>

                            <div className="mt-auto flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => openModal(item)}
                                    className="flex-1 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit size={16} /> Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredItems.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-400">
                            No hay tipos de planta registrados.
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-0 overflow-hidden shadow-2xl border dark:border-slate-800">
                        <div className="bg-slate-800 dark:bg-slate-950 px-6 py-4 flex justify-between items-center text-white border-b border-slate-700 dark:border-slate-800">
                            <h2 className="font-bold text-lg">{editingSub ? 'Editar Tipo' : 'Nuevo Tipo'}</h2>
                            <button onClick={closeModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    placeholder="Ej. Turf, Salonera..."
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Categoría Principal</label>
                                <select
                                    value={formData.categoria_relacionada || ''}
                                    onChange={e => setFormData({ ...formData, categoria_relacionada: e.target.value })}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-slate-900 dark:text-slate-100"
                                >
                                    <option value="Deportivo">Deportivo</option>
                                    <option value="Casual">Casual</option>
                                    <option value="">Ambas / General</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Orden</label>
                                    <input
                                        type="number"
                                        value={formData.orden}
                                        onChange={e => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-slate-900 dark:text-slate-100"
                                    />
                                </div>
                                <div className="flex-1 flex items-center pt-6">
                                    <input
                                        type="checkbox"
                                        id="active_check"
                                        checked={formData.activa}
                                        onChange={e => setFormData({ ...formData, activa: e.target.checked })}
                                        className="mr-2 w-5 h-5 text-orange-500 focus:ring-orange-500 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                                    />
                                    <label htmlFor="active_check" className="font-bold text-slate-700 dark:text-slate-300">Activo</label>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 shadow-md">
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
