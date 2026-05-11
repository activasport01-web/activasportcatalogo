'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Eye, EyeOff, Image as ImageIcon, Sparkles, Home, Save, Check, Plus, Trash2, Edit2, Video } from 'lucide-react'

interface Portada {
    id: number;
    titulo: string;
    descripcion: string;
    url_imagen: string;
    activo: boolean;
}

export default function PortadaAdmin() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [portadas, setPortadas] = useState<Portada[]>([])
    const [view, setView] = useState<'list' | 'form'>('list')
    const [editingId, setEditingId] = useState<number | null>(null)
    const [saving, setSaving] = useState(false)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        activo: true,
        url_imagen: ''
    })

    useEffect(() => {
        checkAuth()
        loadPortadas()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/admin/login')
        }
    }

    const loadPortadas = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('portada_destacada')
            .select('*')
            .order('id', { ascending: false })

        if (data) {
            setPortadas(data)
        }
        setLoading(false)
    }

    const handleAddNew = () => {
        setEditingId(null)
        setFormData({ titulo: '', descripcion: '', activo: true, url_imagen: '' })
        setImageFile(null)
        setView('form')
    }

    const handleEdit = (p: Portada) => {
        setEditingId(p.id)
        setFormData({ titulo: p.titulo, descripcion: p.descripcion || '', activo: p.activo, url_imagen: p.url_imagen })
        setImageFile(null)
        setView('form')
    }

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta portada?')) return
        const { error } = await supabase.from('portada_destacada').delete().eq('id', id)
        if (error) {
            alert('❌ Error al eliminar: ' + error.message)
        } else {
            loadPortadas()
        }
    }

    const toggleActivo = async (id: number, currentStatus: boolean) => {
        const { error } = await supabase
            .from('portada_destacada')
            .update({ activo: !currentStatus })
            .eq('id', id)

        if (!error) {
            loadPortadas()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        let finalUrl = formData.url_imagen

        if (imageFile) {
            const fileName = `portada_${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
            const { error: uploadError } = await supabase.storage
                .from('imagenes-zapatos')
                .upload(fileName, imageFile, { cacheControl: '3600', upsert: false })

            if (!uploadError) {
                const { data } = supabase.storage.from('imagenes-zapatos').getPublicUrl(fileName)
                finalUrl = data.publicUrl
            } else {
                alert('❌ Error al subir archivo:\n' + uploadError.message)
                setSaving(false)
                return
            }
        }

        if (!finalUrl) {
            alert('⚠️ Debes seleccionar una imagen o video para la portada.')
            setSaving(false)
            return
        }

        const portadaData = { titulo: formData.titulo, descripcion: formData.descripcion, url_imagen: finalUrl, activo: formData.activo }

        if (editingId) {
            const { error } = await supabase.from('portada_destacada').update(portadaData).eq('id', editingId)
            if (error) alert('❌ Error: ' + error.message)
            else alert('✅ Portada actualizada.')
        } else {
            const { error } = await supabase.from('portada_destacada').insert([portadaData])
            if (error) alert('❌ Error: ' + error.message)
            else alert('✅ Portada creada.')
        }
        
        setSaving(false)
        setView('list')
        loadPortadas()
    }

    const isVideo = (url: string, file: File | null) => {
        if (file) return file.type.startsWith('video/')
        if (url) return url.toLowerCase().includes('.mp4')
        return false
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 pb-12">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950 border-b border-slate-700 dark:border-slate-800 shadow-lg text-white">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-start gap-4">
                            <Link href="/admin/dashboard" className="mt-1 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                                <ArrowLeft size={20} className="text-orange-400" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-3">
                                    Gestión de Portadas
                                    <Sparkles className="text-orange-400" size={24} />
                                </h1>
                                <p className="text-slate-400 mt-2 flex items-center gap-2">
                                    <Home size={14} /> / Admin / Portadas
                                </p>
                            </div>
                        </div>
                        {view === 'list' && (
                            <button
                                onClick={handleAddNew}
                                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg shadow-orange-500/30"
                            >
                                <Plus size={20} />
                                Agregar Nueva Portada
                            </button>
                        )}
                        {view === 'form' && (
                            <button
                                onClick={() => setView('list')}
                                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-bold transition-all"
                            >
                                <ArrowLeft size={20} />
                                Volver a la Lista
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {view === 'list' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        {portadas.map((p) => (
                            <div key={p.id} className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col group">
                                <div className="aspect-[16/9] relative bg-slate-900 overflow-hidden">
                                    {isVideo(p.url_imagen, null) ? (
                                        <video src={p.url_imagen} className="w-full h-full object-cover opacity-80" muted playsInline />
                                    ) : (
                                        <img src={p.url_imagen} alt={p.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                    <div className="absolute bottom-0 left-0 p-4 w-full">
                                        <h3 className="text-white font-bold text-lg truncate">{p.titulo}</h3>
                                        <p className="text-white/60 text-sm truncate">{p.descripcion}</p>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <button onClick={() => toggleActivo(p.id, p.activo)} className={`p-2 rounded-full backdrop-blur-sm transition-colors ${p.activo ? 'bg-green-500/90 text-white' : 'bg-black/50 text-white/50 hover:bg-black/80'}`} title={p.activo ? "Visible" : "Oculto"}>
                                            {p.activo ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 flex gap-3 bg-slate-50 dark:bg-slate-900/50">
                                    <button onClick={() => handleEdit(p)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 transition-colors">
                                        <Edit2 size={16} /> Editar
                                    </button>
                                    <button onClick={() => handleDelete(p.id)} className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl transition-colors">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {portadas.length === 0 && (
                            <div className="col-span-full py-20 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
                                <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">No hay portadas creadas.</p>
                                <button onClick={handleAddNew} className="mt-4 text-orange-500 font-bold hover:underline">¡Crea tu primera portada!</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-slide-up">
                        {/* Preview */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Eye size={24} className="text-orange-500" /> Vista Previa
                            </h2>
                            <div className="bg-slate-950 rounded-3xl shadow-xl overflow-hidden border border-slate-800 relative group">
                                <div className="aspect-[16/9] bg-slate-900 relative overflow-hidden">
                                    {formData.url_imagen || imageFile ? (
                                        isVideo(formData.url_imagen, imageFile) ? (
                                            <video src={imageFile ? URL.createObjectURL(imageFile) : formData.url_imagen} autoPlay muted loop playsInline className="w-full h-full object-cover opacity-80" />
                                        ) : (
                                            <img src={imageFile ? URL.createObjectURL(imageFile) : formData.url_imagen} alt="Preview" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                                        )
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900">
                                            <ImageIcon size={48} className="mb-2" />
                                            <p className="text-sm">Sube imagen o video (1920×900)</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5" />
                                    <div className="absolute inset-0 flex flex-col justify-end items-center text-center p-6 pb-8">
                                        <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2 drop-shadow-xl">{formData.titulo || 'Tu Título Aquí'}</h3>
                                        <p className="text-sm text-white/60 mb-4 max-w-sm">{formData.descripcion || 'Tu descripción aparecerá aquí...'}</p>
                                        <div className="flex gap-3">
                                            <button className="bg-white text-black font-bold px-6 py-2 rounded-full text-xs shadow-lg">Ver Catálogo</button>
                                            <button className="bg-green-500 text-white font-bold px-6 py-2 rounded-full text-xs shadow-lg">💬 Consultar</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-6 flex gap-4 items-start">
                                <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg text-blue-600 dark:text-blue-400 shrink-0"><Sparkles size={24} /></div>
                                <div>
                                    <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Soporte Multimedia 📸🎥</h3>
                                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-disc list-inside">
                                        <li><strong>Imágenes:</strong> JPG, PNG, WebP (Máx 2MB)</li>
                                        <li><strong>Videos:</strong> Formato MP4 (Máx 15MB, sin sonido)</li>
                                        <li><strong>Proporción:</strong> 21:9 o 16:9 panorámica. NUNCA 1:1.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Formulario */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Título Principal</label>
                                    <input type="text" required value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 outline-none font-bold text-lg" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Subtítulo / Descripción</label>
                                    <textarea required value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} rows={3} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 outline-none resize-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Archivo Multimedia (Imagen o MP4)</label>
                                    <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${imageFile ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10' : 'border-slate-300 dark:border-slate-700 hover:border-orange-400'}`}>
                                        <input type="file" accept="image/*,video/mp4" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                        <div className="flex flex-col items-center justify-center">
                                            {imageFile ? (
                                                <>
                                                    {isVideo('', imageFile) ? <Video size={48} className="text-orange-500 mb-4" /> : <Check size={48} className="text-orange-500 mb-4" />}
                                                    <p className="font-bold text-orange-700 dark:text-orange-400 truncate">{imageFile.name}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                                                    <p className="font-bold text-slate-700 dark:text-slate-300">Subir imagen o MP4</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <input type="checkbox" id="activo" checked={formData.activo} onChange={(e) => setFormData({ ...formData, activo: e.target.checked })} className="w-5 h-5 accent-green-500 cursor-pointer" />
                                    <label htmlFor="activo" className="font-bold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
                                        Activar en tienda
                                    </label>
                                </div>
                                <button type="submit" disabled={saving} className={`w-full py-4 rounded-xl font-bold shadow-xl flex items-center justify-center gap-3 text-white ${saving ? 'bg-slate-400' : 'bg-slate-900 hover:bg-black dark:bg-orange-500 dark:hover:bg-orange-600'}`}>
                                    {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <Save size={20} />}
                                    {saving ? 'Guardando...' : 'Guardar Portada'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
