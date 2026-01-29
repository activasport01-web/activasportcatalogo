'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, X, Upload, Home, LayoutGrid, Check, Search, AlertCircle } from 'lucide-react'

interface Categoria {
    id: string
    nombre: string
    slug: string
    descripcion: string
    emoji: string
    imagen_url: string
    orden: number
    activa: boolean
}

export default function CategoriasAdmin() {
    const router = useRouter()
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const [formData, setFormData] = useState({
        nombre: '',
        slug: '',
        descripcion: '',
        emoji: '👟',
        orden: 0,
        activa: true
    })

    useEffect(() => {
        checkAuth()
        loadCategorias()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/admin/login')
        }
    }

    const loadCategorias = async () => {
        setLoading(true)

        // Primero intentamos cargar de la tabla categorias
        const { data, error } = await supabase
            .from('categorias')
            .select('*')
            .order('orden', { ascending: true })

        if (data && data.length > 0) {
            setCategorias(data)
        } else {
            // Si no existe la tabla, mostramos categorías por defecto
            const categoriasDefault: Categoria[] = [
                {
                    id: '1',
                    nombre: 'Adulto',
                    slug: 'adulto',
                    descripcion: 'Estilo y comodidad',
                    emoji: '👞',
                    imagen_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop',
                    orden: 1,
                    activa: true
                },
                {
                    id: '2',
                    nombre: 'Niño',
                    slug: 'nino',
                    descripcion: 'Diversión y confort',
                    emoji: '👟',
                    imagen_url: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=400&h=300&fit=crop',
                    orden: 2,
                    activa: true
                },
                {
                    id: '3',
                    nombre: 'Deportivo',
                    slug: 'deportivo',
                    descripcion: 'Rendimiento máximo',
                    emoji: '⚽',
                    imagen_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
                    orden: 3,
                    activa: true
                },
                {
                    id: '4',
                    nombre: 'Botas',
                    slug: 'botas',
                    descripcion: 'Resistencia y estilo',
                    emoji: '🥾',
                    imagen_url: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&h=300&fit=crop',
                    orden: 4,
                    activa: true
                },
                {
                    id: '5',
                    nombre: 'Sandalias',
                    slug: 'sandalias',
                    descripcion: 'Frescura y libertad',
                    emoji: '🩴',
                    imagen_url: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400&h=300&fit=crop',
                    orden: 5,
                    activa: true
                },
                {
                    id: '6',
                    nombre: 'Formales',
                    slug: 'formales',
                    descripcion: 'Elegancia profesional',
                    emoji: '👔',
                    imagen_url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400&h=300&fit=crop',
                    orden: 6,
                    activa: true
                }
            ]
            setCategorias(categoriasDefault)
        }

        setLoading(false)
    }

    const createTable = async () => {
        // Script SQL para crear la tabla (ejecutar en Supabase SQL Editor)
        alert('Para usar esta función, ejecuta este SQL en Supabase:\n\nCREATE TABLE categorias (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  nombre TEXT NOT NULL,\n  slug TEXT UNIQUE NOT NULL,\n  descripcion TEXT,\n  emoji TEXT,\n  imagen_url TEXT,\n  orden INTEGER DEFAULT 0,\n  activa BOOLEAN DEFAULT true,\n  fecha_creacion TIMESTAMP DEFAULT NOW()\n);')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        let imagen_url = editingCategoria?.imagen_url || ''

        // Subir imagen
        if (imageFile) {
            const fileName = `categoria_${Date.now()}_${imageFile.name}`
            const { error: uploadError } = await supabase.storage
                .from('imagenes-zapatos')
                .upload(fileName, imageFile)

            if (!uploadError) {
                const { data } = supabase.storage
                    .from('imagenes-zapatos')
                    .getPublicUrl(fileName)
                imagen_url = data.publicUrl
            }
        }

        const categoriaData = {
            nombre: formData.nombre,
            slug: formData.slug,
            descripcion: formData.descripcion,
            emoji: formData.emoji,
            imagen_url,
            orden: formData.orden,
            activa: formData.activa
        }

        if (editingCategoria) {
            // Actualizar
            const { error } = await supabase
                .from('categorias')
                .update(categoriaData)
                .eq('id', editingCategoria.id)

            if (error) {
                alert('Error: ' + error.message)
            } else {

                closeModal()
                loadCategorias()
            }
        } else {
            // Crear
            const { error } = await supabase
                .from('categorias')
                .insert([categoriaData])

            if (error) {
                alert('Error: ' + error.message + '\n\nSi la tabla no existe, haz clic en "Crear Tabla"')
            } else {

                closeModal()
                loadCategorias()
            }
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar esta categoría?')) {
            const { error } = await supabase
                .from('categorias')
                .delete()
                .eq('id', id)

            if (!error) {

                loadCategorias()
            }
        }
    }

    const toggleActiva = async (categoria: Categoria) => {
        const { error } = await supabase
            .from('categorias')
            .update({ activa: !categoria.activa })
            .eq('id', categoria.id)

        if (!error) {
            loadCategorias()
        }
    }

    const openModal = (categoria?: Categoria) => {
        if (categoria) {
            setEditingCategoria(categoria)
            setFormData({
                nombre: categoria.nombre,
                slug: categoria.slug,
                descripcion: categoria.descripcion,
                emoji: categoria.emoji,
                orden: categoria.orden,
                activa: categoria.activa
            })
        } else {
            setEditingCategoria(null)
            setFormData({
                nombre: '',
                slug: '',
                descripcion: '',
                emoji: '👟',
                orden: categorias.length + 1,
                activa: true
            })
        }
        setImageFile(null)
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingCategoria(null)
        setImageFile(null)
    }

    const generateSlug = (nombre: string) => {
        return nombre
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
    }

    const filteredCategorias = categorias.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto"></div>
                    <p className="mt-4 text-slate-600 font-medium">Cargando categorías...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Header Moderno con Gradiente */}
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
                                    Gestión de Categorías
                                    <span className="text-xs bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full border border-orange-500/30">
                                        {categorias.length} total
                                    </span>
                                </h1>
                                <p className="text-slate-400 mt-2 flex items-center gap-2">
                                    <Home size={14} /> / Admin / Categorías
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            {/* <button
                                onClick={createTable}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
                            >
                                Crear Tabla
                            </button> */}
                            <button
                                onClick={() => openModal()}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl transition-all font-bold shadow-lg hover:shadow-orange-500/25 group"
                            >
                                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                                Nueva Categoría
                            </button>
                        </div>
                    </div>

                    {/* Barra de Búsqueda Integrada */}
                    <div className="mt-8 max-w-2xl px-1">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar categorías por nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/10 rounded-xl focus:bg-white/20 focus:border-orange-500/50 outline-none text-white placeholder-slate-400 transition-all backdrop-blur-md"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid de Categorías */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredCategorias.map((categoria, index) => (
                        <div
                            key={categoria.id}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-orange-200 dark:hover:border-orange-500/30 transition-all duration-300 group flex flex-col h-full animate-slide-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Imagen de Portada */}
                            <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-800 relative overflow-hidden group-hover:opacity-95 transition-opacity">
                                <img
                                    src={categoria.imagen_url || '/placeholder-category.jpg'}
                                    alt={categoria.nombre}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>

                                {/* Badge de Estado */}
                                <div className="absolute top-4 right-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md flex items-center gap-1.5 shadow-sm ${categoria.activa
                                        ? 'bg-green-500/90 text-white border-white/20'
                                        : 'bg-slate-500/90 text-white border-white/20'
                                        }`}>
                                        <div className={`w-2 h-2 rounded-full ${categoria.activa ? 'bg-white animate-pulse' : 'bg-slate-300'}`}></div>
                                        {categoria.activa ? 'ACTIVA' : 'INACTIVA'}
                                    </span>
                                </div>

                                {/* Emoji Flotante */}
                                <div className="absolute -bottom-6 right-6 w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-4 border-slate-50 dark:border-slate-700 flex items-center justify-center text-3xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 z-10">
                                    {categoria.emoji}
                                </div>
                            </div>

                            <div className="p-6 pt-8 flex-1 flex flex-col">
                                <div className="mb-4">
                                    <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100 mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                        {categoria.nombre}
                                    </h3>
                                    <p className="text-slate-400 text-xs font-mono font-medium tracking-wide">
                                        /{categoria.slug}
                                    </p>
                                </div>

                                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 flex-1 line-clamp-2">
                                    {categoria.descripcion || 'Sin descripción disponible'}
                                </p>

                                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                            {categoria.orden}
                                        </div>
                                        Orden
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openModal(categoria)}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => toggleActiva(categoria)}
                                            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${categoria.activa
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                }`}
                                            title={categoria.activa ? 'Desactivar' : 'Activar'}
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(categoria.id)}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty State */}
                    {filteredCategorias.length === 0 && (
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20">
                            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="text-slate-300 dark:text-slate-600" size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No se encontraron categorías</h3>
                            <p className="text-slate-500 dark:text-slate-400">Intenta con otros términos de búsqueda o crea una nueva.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Profesional */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-slide-up border dark:border-slate-800">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-8 py-6 flex justify-between items-center border-b dark:border-slate-800">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    {editingCategoria ? <Edit size={24} className="text-orange-400" /> : <Plus size={24} className="text-orange-400" />}
                                    {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
                                </h2>
                                <p className="text-slate-300 text-sm mt-1">
                                    {editingCategoria ? 'Modifica los detalles de la categoría existente.' : 'Agrega una nueva categoría al catálogo.'}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-red-500/80 flex items-center justify-center transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Columna Izquierda: Info Básica */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                            Nombre de Categoría <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.nombre}
                                            onChange={(e) => {
                                                setFormData({ ...formData, nombre: e.target.value, slug: generateSlug(e.target.value) })
                                            }}
                                            placeholder="Ej. Deportivos Mujer"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                                            Slug (URL)
                                            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Automático</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">/</span>
                                            <input
                                                type="text"
                                                required
                                                value={formData.slug}
                                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 outline-none text-slate-600 dark:text-slate-400 font-mono text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Emoji</label>
                                            <input
                                                type="text"
                                                value={formData.emoji}
                                                onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 outline-none text-2xl text-center"
                                                placeholder="👟"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Orden</label>
                                            <input
                                                type="number"
                                                value={formData.orden}
                                                onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 outline-none font-mono text-center text-slate-900 dark:text-slate-100"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Columna Derecha: Multimedia y Descripción */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Descripción</label>
                                        <textarea
                                            value={formData.descripcion}
                                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                            rows={2}
                                            placeholder="Breve descripción de la categoría..."
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all resize-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 mb-1 flex justify-between">
                                            Imagen de Portada
                                            {editingCategoria && (
                                                <span className="text-xs text-orange-600 font-normal">Actualizar si deseas cambiar</span>
                                            )}
                                        </label>
                                        <div className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-colors ${imageFile ? 'border-orange-500 bg-orange-50' : 'border-slate-300 hover:border-orange-400 hover:bg-slate-50'}`}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="flex flex-col items-center justify-center py-2">
                                                {imageFile ? (
                                                    <>
                                                        <Check size={32} className="text-orange-500 mb-2" />
                                                        <p className="text-sm font-medium text-orange-700 truncate max-w-[200px]">{imageFile.name}</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload size={32} className="text-slate-400 mb-2" />
                                                        <p className="text-sm text-slate-500">
                                                            <span className="font-semibold text-orange-500">Clic para subir</span> o arrastra
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-1">PNG, JPG (Max. 2MB)</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                                            <input
                                                type="checkbox"
                                                id="activa"
                                                checked={formData.activa}
                                                onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                                                className="peer absolute opacity-0 w-0 h-0"
                                            />
                                            <label
                                                htmlFor="activa"
                                                className={`block w-12 h-6 rounded-full cursor-pointer transition-colors duration-300 ${formData.activa ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                                                    }`}
                                            ></label>
                                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${formData.activa ? 'translate-x-6' : 'translate-x-0'
                                                }`}></div>
                                        </div>
                                        <label htmlFor="activa" className="text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
                                            Categoría Visible
                                            <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                                Determina si la categoría aparecerá en la tienda
                                            </p>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Modal */}
                            <div className="flex gap-4 pt-8 mt-8 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-3.5 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold shadow-lg hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2"
                                >
                                    {editingCategoria ? <Edit size={18} /> : <Plus size={18} />}
                                    {editingCategoria ? 'Guardar Cambios' : 'Crear Categoría'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
