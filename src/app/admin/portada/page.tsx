'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Eye, EyeOff, Image as ImageIcon, Sparkles, Home, Save, Check } from 'lucide-react'

export default function PortadaAdmin() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [portada, setPortada] = useState<any>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        activo: true
    })

    useEffect(() => {
        checkAuth()
        loadPortada()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/admin/login')
        }
    }

    const loadPortada = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('portada_destacada')
            .select('*')
            .single()

        if (data) {
            setPortada(data)
            setFormData({
                titulo: data.titulo || '',
                descripcion: data.descripcion || '',
                activo: data.activo ?? true
            })
        }
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        let url_imagen = portada?.url_imagen || ''

        // Subir nueva imagen si se seleccionó
        if (imageFile) {
            const fileName = `portada_${Date.now()}_${imageFile.name}`
            const { error: uploadError } = await supabase.storage
                .from('imagenes-zapatos')
                .upload(fileName, imageFile)

            if (!uploadError) {
                const { data } = supabase.storage
                    .from('imagenes-zapatos')
                    .getPublicUrl(fileName)
                url_imagen = data.publicUrl
            } else {
                alert('Error al subir la imagen: ' + uploadError.message)
                return
            }
        }

        const portadaData = {
            titulo: formData.titulo,
            descripcion: formData.descripcion,
            url_imagen,
            activo: formData.activo
        }

        if (portada) {
            // Actualizar
            const { error } = await supabase
                .from('portada_destacada')
                .update(portadaData)
                .eq('id', portada.id)

            if (error) {
                alert('Error: ' + error.message)
            } else {

                loadPortada()
                setImageFile(null)
            }
        } else {
            // Crear
            const { error } = await supabase
                .from('portada_destacada')
                .insert([portadaData])

            if (error) {
                alert('Error: ' + error.message)
            } else {

                loadPortada()
                setImageFile(null)
            }
        }
    }

    const toggleActivo = async () => {
        if (!portada) return

        const { error } = await supabase
            .from('portada_destacada')
            .update({ activo: !portada.activo })
            .eq('id', portada.id)

        if (!error) {
            loadPortada()
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto"></div>
                    <p className="mt-4 text-slate-600 font-medium">Cargando configuración...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header Moderno */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 shadow-lg text-white">
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
                                    Gestión de Portada
                                    <Sparkles className="text-orange-400" size={24} />
                                </h1>
                                <p className="text-slate-400 mt-2 flex items-center gap-2">
                                    <Home size={14} /> / Admin / Portada
                                </p>
                            </div>
                        </div>
                        {portada && (
                            <button
                                onClick={toggleActivo}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all shadow-lg ${portada.activo
                                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/30'
                                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                    }`}
                            >
                                {portada.activo ? <Eye size={20} /> : <EyeOff size={20} />}
                                {portada.activo ? 'Visible en Tienda' : 'Oculta en Tienda'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                    {/* Columna Izquierda: Vista Previa */}
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Eye size={24} className="text-orange-500" />
                            Vista Previa en Vivo
                        </h2>

                        {/* Preview Card */}
                        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 relative group">
                            <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                                {portada?.url_imagen || imageFile ? (
                                    <img
                                        src={imageFile ? URL.createObjectURL(imageFile) : portada.url_imagen}
                                        alt="Portada Preview"
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                                        <ImageIcon size={48} className="mb-2" />
                                        <p>Sin imagen seleccionada</p>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center">
                                    <div className="p-8 md:p-12 text-white max-w-xl">
                                        <div className="inline-block px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full mb-4 shadow-lg shadow-orange-500/30 tracking-wider">
                                            {portada?.activo ? 'DESTACADO' : 'INACTIVO'}
                                        </div>
                                        <h3 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                                            {formData.titulo || 'Tu Título Aquí'}
                                        </h3>
                                        <p className="text-lg md:text-xl text-white/90 mb-8 font-light leading-relaxed">
                                            {formData.descripcion || 'Tu descripción aparecerá aquí...'}
                                        </p>
                                        <div className="flex gap-4">
                                            <button className="bg-white text-slate-900 font-bold px-8 py-3 rounded-full hover:bg-slate-100 transition shadow-lg">
                                                Comprar Ahora
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4 items-start">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-blue-900 mb-2">Tips para una portada increíble</h3>
                                <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                                    <li>Usa imágenes de alta resolución (min. 1920x800px)</li>
                                    <li>Mantén el título corto y directo (max. 40 caracteres)</li>
                                    <li>La imagen debe tener el foco a la derecha para no tapar el texto</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Formulario */}
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 animate-slide-up">
                        <div className="flex items-center gap-3 mb-8 pb-8 border-b border-slate-100">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                                <ImageIcon size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Editar Contenido</h2>
                                <p className="text-slate-500">Personaliza la primera impresión de tu tienda</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Título Principal</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.titulo}
                                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                    placeholder="Ej: Nueva Colección 2024"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-bold text-lg text-slate-800 placeholder-slate-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Subtítulo / Descripción</label>
                                <textarea
                                    required
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    placeholder="Ej: Los mejores estilos..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-slate-600 resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 mb-1 flex justify-between">
                                    Imagen de Fondo
                                    {portada && <span className="text-xs text-orange-600 font-normal">Imagen actual guardada</span>}
                                </label>
                                <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${imageFile ? 'border-orange-500 bg-orange-50' : 'border-slate-300 hover:border-orange-400 hover:bg-slate-50 scale-100'}`}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="flex flex-col items-center justify-center">
                                        {imageFile ? (
                                            <>
                                                <Check size={48} className="text-orange-500 mb-4 bg-white rounded-full p-2 shadow-sm" />
                                                <p className="font-bold text-orange-700 mb-1">Imagen Seleccionada</p>
                                                <p className="text-sm text-orange-600 truncate max-w-[200px]">{imageFile.name}</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={48} className="text-slate-300 mb-4" />
                                                <p className="font-bold text-slate-700 mb-1">Clic para subir imagen</p>
                                                <p className="text-sm text-slate-400">JPG, PNG (Max 5MB)</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 my-6">
                                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                                    <input
                                        type="checkbox"
                                        id="activo"
                                        checked={formData.activo}
                                        onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                        className="peer absolute opacity-0 w-0 h-0"
                                    />
                                    <label
                                        htmlFor="activo"
                                        className={`block w-12 h-6 rounded-full cursor-pointer transition-colors duration-300 ${formData.activo ? 'bg-green-500' : 'bg-slate-300'
                                            }`}
                                    ></label>
                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${formData.activo ? 'translate-x-6' : 'translate-x-0'
                                        }`}></div>
                                </div>
                                <label htmlFor="activo" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                                    Mostrar en Home
                                    <p className="text-xs font-normal text-slate-500">
                                        Activa o desactiva la visibilidad del banner
                                    </p>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                            >
                                <Save size={20} />
                                {portada ? 'Guardar Cambios' : 'Crear Portada'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
