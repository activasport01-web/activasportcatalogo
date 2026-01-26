'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Plus,
    Edit,
    Trash2,
    CheckCircle,
    AlertCircle,
    X,
    Search,
    Tag
} from 'lucide-react'

interface Marca {
    id: string
    nombre: string
    logo_url: string | null
    active: boolean
    created_at: string
}

/*
    -- INSTRUCCIONES SQL PARA CREAR LA TABLA EN SUPABASE --
    
    create table marcas (
      id uuid default gen_random_uuid() primary key,
      nombre text not null unique,
      active boolean default true,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- Insertar marcas iniciales si se desea
    insert into marcas (nombre) values 
    ('Nike'), ('Adidas'), ('Puma'), ('Reebok'), ('Jordan'), ('Vans'), ('Under Armour'), ('New Balance'), ('Converse'), ('Fila'), ('Skechers'), ('Generico');
*/

export default function MarcasAdmin() {
    const router = useRouter()
    const [marcas, setMarcas] = useState<Marca[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingMarca, setEditingMarca] = useState<Marca | null>(null)
    const [formData, setFormData] = useState({ nombre: '', active: true })
    const [logoFile, setLogoFile] = useState<File | null>(null)

    // Notificaciones
    const [notification, setNotification] = useState({ message: '', type: 'success', show: false })
    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type, show: true })
        setTimeout(() => setNotification(n => ({ ...n, show: false })), 3000)
    }

    useEffect(() => {
        checkAuth()
        loadMarcas()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) router.push('/admin/login')
    }

    const loadMarcas = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('marcas')
            .select('*')
            .order('nombre', { ascending: true })

        if (!error && data) {
            setMarcas(data)
        } else {
            // Fallback si la tabla no existe (para no romper la UI mientras el usuario crea la tabla)
            console.error(error)
        }
        setLoading(false)
    }

    const sanitizeFileName = (fileName: string) => {
        return fileName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .toLowerCase()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.nombre.trim()) return

        try {
            let logoUrl = editingMarca?.logo_url || null

            // Subir logo si hay archivo nuevo
            if (logoFile) {
                const cleanName = sanitizeFileName(logoFile.name)
                const fileName = `marca_${Date.now()}_${cleanName}`

                const { error: uploadError } = await supabase.storage
                    .from('imagenes-zapatos')
                    .upload(fileName, logoFile)

                if (uploadError) throw uploadError

                const { data } = supabase.storage
                    .from('imagenes-zapatos')
                    .getPublicUrl(fileName)

                logoUrl = data.publicUrl
            }

            const marcaData = {
                nombre: formData.nombre,
                logo_url: logoUrl,
                active: formData.active
            }

            if (editingMarca) {
                const { error } = await supabase
                    .from('marcas')
                    .update(marcaData)
                    .eq('id', editingMarca.id)
                if (error) throw error
                showNotification('Marca actualizada')
            } else {
                const { error } = await supabase
                    .from('marcas')
                    .insert([marcaData])
                if (error) throw error
                showNotification('Marca creada')
            }
            closeModal()
            loadMarcas()
        } catch (error: any) {
            showNotification('Error al guardar: ' + error.message, 'error')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta marca?')) return
        const { error } = await supabase.from('marcas').delete().eq('id', id)
        if (error) showNotification('Error al eliminar', 'error')
        else {
            showNotification('Marca eliminada')
            loadMarcas()
        }
    }

    const openModal = (marca?: Marca) => {
        if (marca) {
            setEditingMarca(marca)
            setFormData({ nombre: marca.nombre, active: marca.active })
        } else {
            setEditingMarca(null)
            setFormData({ nombre: '', active: true })
        }
        setLogoFile(null)
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingMarca(null)
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 shadow-lg text-white">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <div className="flex justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <Link href="/admin/dashboard" className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm">
                                <ArrowLeft size={20} className="text-orange-400" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-3">
                                    Gestión de Marcas
                                </h1>
                                <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm">
                                    Administra las marcas disponibles
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => openModal()}
                            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl transition-all font-bold shadow-lg"
                        >
                            <Plus size={20} />
                            Nueva Marca
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-10">
                {/* Alerta SQL si está vacío */}
                {marcas.length === 0 && !loading && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-4">
                        <div className="p-2 bg-blue-100 rounded-full text-blue-600 shrink-0">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-blue-800">¿No ves marcas?</h4>
                            <p className="text-sm text-blue-600 mt-1">
                                Asegúrate de haber creado la tabla <code>marcas</code> en tu base de datos Supabase.
                                <br />
                                Ejecuta el script SQL que se encuentra en los comentarios de este archivo.
                            </p>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {marcas.map((marca) => (
                            <div key={marca.id} className="group bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-orange-500 transition-all shadow-sm hover:shadow-lg">
                                {/* Logo */}
                                <div className="aspect-square bg-slate-50 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                                    {marca.logo_url ? (
                                        <img
                                            src={marca.logo_url}
                                            alt={marca.nombre}
                                            className="w-full h-full object-contain p-4"
                                        />
                                    ) : (
                                        <div className="text-6xl font-black text-slate-200">
                                            {marca.nombre.charAt(0)}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <h3 className="font-bold text-lg text-slate-900 mb-2">{marca.nombre}</h3>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${marca.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {marca.active ? 'Activa' : 'Inactiva'}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openModal(marca)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold text-slate-700 transition-all"
                                    >
                                        <Edit size={16} />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(marca.id)}
                                        className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-700 transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {marcas.length === 0 && loading && (
                            <div className="col-span-full py-10 text-center text-slate-400">
                                Cargando...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-slate-800 px-6 py-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg">{editingMarca ? 'Editar Marca' : 'Nueva Marca'}</h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Nombre de la Marca</label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-800 placeholder-slate-400"
                                    placeholder="Ej: GRACEP"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Logo de la Marca</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                                    className="w-full px-3 py-2.5 text-sm border-2 border-slate-200 rounded-lg file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                                />
                                {editingMarca?.logo_url && !logoFile && (
                                    <p className="text-xs text-slate-500 mt-1">Logo actual cargado</p>
                                )}
                            </div>
                            <div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        className="w-5 h-5 rounded border-2 border-slate-300 checked:bg-orange-500 checked:border-orange-500"
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Marca Activa</span>
                                </label>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Notification */}
            <div className={`fixed bottom-8 right-8 z-50 transition-all duration-300 transform ${notification.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
                <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl text-white font-bold ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {notification.message}
                </div>
            </div>
        </div>
    )
}
