'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Plus,
    Save,
    Trash2,
    Image as ImageIcon,
    Loader2,
    Megaphone,
    X,
    Eye
} from 'lucide-react'

type Promocion = {
    id: string
    titulo: string
    descripcion: string
    imagen_url?: string
    color_fondo: string
    texto_boton: string
    link_boton: string
    activo: boolean
    orden: number
}

export default function AdminPromociones() {
    const router = useRouter()
    const [promociones, setPromociones] = useState<Promocion[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)

    // Form State
    const [formData, setFormData] = useState<Partial<Promocion>>({
        titulo: '',
        descripcion: '',
        color_fondo: 'bg-orange-500',
        texto_boton: 'Ver Oferta',
        link_boton: '/catalogo',
        activo: true,
        orden: 0
    })

    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        checkAuth()
        loadPromociones()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) router.push('/admin/login')
    }

    const loadPromociones = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('promociones')
            .select('*')
            .order('orden', { ascending: true })

        if (data) setPromociones(data)
        setLoading(false)
    }

    const handleEdit = (promo: Promocion) => {
        setEditingId(promo.id)
        setFormData(promo)
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleCancel = () => {
        setEditingId(null)
        setFormData({
            titulo: '',
            descripcion: '',
            color_fondo: 'bg-orange-500',
            texto_boton: 'Ver Oferta',
            link_boton: '/catalogo',
            activo: true,
            orden: 0
        })
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar esta promoción?')) return

        const { error } = await supabase.from('promociones').delete().eq('id', id)
        if (!error) loadPromociones()
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        setUploading(true)
        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${fileName}`

        try {
            const { error: uploadError } = await supabase.storage
                .from('promociones')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('promociones')
                .getPublicUrl(filePath)

            setFormData(prev => ({ ...prev, imagen_url: publicUrl }))
        } catch (error) {
            console.error('Error uploading image:', error)
            alert('Error al subir imagen')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (editingId) {
                // Update
                const { error } = await supabase
                    .from('promociones')
                    .update(formData)
                    .eq('id', editingId)

                if (error) throw error
            } else {
                // Insert
                const { error } = await supabase
                    .from('promociones')
                    .insert([formData])

                if (error) throw error
            }

            handleCancel()
            loadPromociones()
        } catch (error) {
            console.error('Error saving:', error)
            alert('Error al guardar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative pb-20 transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm transition-colors">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/dashboard" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Megaphone className="text-brand-orange" size={24} />
                                GESTOR DE PROMOCIONES
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Administra el carrusel de ofertas principal</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">

                {/* Editor Form */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden mb-10 transition-colors">
                    <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-3 flex justify-between items-center border-b border-slate-800 dark:border-slate-900">
                        <h2 className="font-bold flex items-center gap-2">
                            {editingId ? <Save size={18} /> : <Plus size={18} />}
                            {editingId ? 'Editar Promoción' : 'Nueva Promoción'}
                        </h2>
                        {editingId && (
                            <button onClick={handleCancel} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors">
                                Cancelar Edición
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Column 1: Inputs */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Título Principal</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.titulo || ''}
                                    onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none font-bold text-lg placeholder-slate-400"
                                    placeholder="Ej: ¡Liquidación de Verano!"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Descripción / Subtítulo</label>
                                <textarea
                                    rows={3}
                                    value={formData.descripcion || ''}
                                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none text-sm placeholder-slate-400"
                                    placeholder="Ej: Descuentos de hasta el 50% en toda la tienda..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Texto Botón</label>
                                    <input
                                        type="text"
                                        value={formData.texto_boton || ''}
                                        onChange={e => setFormData({ ...formData, texto_boton: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400"
                                        placeholder="Ver Detalles"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Enlace (Opcional)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            disabled
                                            value="Consultar por WhatsApp"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">El botón ahora abre un modal de consulta directa.</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Color de Fondo (Tailwind Gradient)</label>
                                <select
                                    value={formData.color_fondo || ''}
                                    onChange={e => setFormData({ ...formData, color_fondo: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                >
                                    <option value="bg-gradient-to-r from-orange-500 to-red-600">Naranja Activa (Default)</option>
                                    <option value="bg-gradient-to-r from-blue-600 to-indigo-700">Azul Profundo</option>
                                    <option value="bg-gradient-to-r from-emerald-500 to-teal-700">Verde Oferta</option>
                                    <option value="bg-gradient-to-r from-purple-600 to-pink-600">Púrpura Vibrante</option>
                                    <option value="bg-gradient-to-r from-slate-800 to-black">Negro Elegante</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.activo || false}
                                        onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                                        className="w-5 h-5 text-brand-orange rounded focus:ring-brand-orange"
                                    />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Activo (Visible)</span>
                                </label>
                            </div>
                        </div>

                        {/* Column 2: Image Preview */}
                        <div className="flex flex-col">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Imagen Principal / Portada</label>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`
                                    flex-1 min-h-[200px] rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-orange bg-slate-50 dark:bg-slate-800 cursor-pointer transition-all
                                    flex flex-col items-center justify-center gap-2 relative overflow-hidden group
                                    ${!formData.imagen_url ? 'p-8' : 'p-0'}
                                `}
                            >
                                {formData.imagen_url ? (
                                    <>
                                        <img src={formData.imagen_url} className="w-full h-full object-cover" alt="Preview" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <p className="text-white font-bold flex items-center gap-2"><ImageIcon size={16} /> Cambiar Imagen</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500">
                                            <ImageIcon size={24} />
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Click para subir imagen</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">Recomendado: 500x500px o superior</p>
                                    </>
                                )}

                                {uploading && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                                        <Loader2 className="animate-spin text-brand-orange" size={32} />
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </div>

                        <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading || uploading}
                                className="bg-brand-orange text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/30"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                {editingId ? 'Guardar Cambios' : 'Crear Promoción'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* List */}
                <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest mb-4">Promociones Activas</h3>
                <div className="space-y-4">
                    {promociones.map((promo) => (
                        <div key={promo.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                            {/* Drag Handle (Simulated) */}
                            <div className="text-slate-300 cursor-move px-2">
                                ⋮⋮
                            </div>

                            {/* Image Thumbnail */}
                            <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                {promo.imagen_url ? (
                                    <img src={promo.imagen_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600"><ImageIcon size={16} /></div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-slate-800 dark:text-white truncate">{promo.titulo}</h4>
                                    {!promo.activo && <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold uppercase">Inactivo</span>}
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{promo.descripcion}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleEdit(promo)}
                                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Eye size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(promo.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {promociones.length === 0 && (
                        <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            <Megaphone className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={32} />
                            <p className="text-slate-400 dark:text-slate-500">No hay promociones creadas.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}
