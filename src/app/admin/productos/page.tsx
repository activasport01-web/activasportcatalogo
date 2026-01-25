'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Upload,
    CheckCircle,
    AlertCircle,
    X
} from 'lucide-react'

interface Producto {
    id: string
    nombre: string
    descripcion: string
    precio: number
    categoria: string
    tallas: string[]
    colores: string[]
    etiquetas: string[]
    url_imagen: string
    imagen_hover?: string
    origen?: string
    disponible: boolean
    fecha_creacion: string
}

export default function ProductosAdmin() {
    const router = useRouter()
    const [productos, setProductos] = useState<Producto[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Producto | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imageHoverFile, setImageHoverFile] = useState<File | null>(null)

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        categoria: 'adulto',
        tallas: '',
        colores: '',
        etiquetas: [] as string[],
        origen: 'Nacional', // Nuevo: Origen por defecto
        disponible: true
    })

    useEffect(() => {
        checkAuth()
        loadProductos()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/admin/login')
        }
    }

    const loadProductos = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('zapatos')
            .select('*')
            .order('fecha_creacion', { ascending: false })

        if (!error && data) {
            setProductos(data)
        }
        setLoading(false)
    }

    // Estado para notificaciones Toast
    const [notification, setNotification] = useState<{
        message: string;
        type: 'success' | 'error';
        show: boolean;
    }>({ message: '', type: 'success', show: false });

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type, show: true });
        setTimeout(() => {
            setNotification(prev => ({ ...prev, show: false }));
        }, 3000);
    };

    // Función para limpiar nombres de archivo (quitar tildes, espacios, etc.)
    const sanitizeFileName = (name: string) => {
        return name
            .normalize("NFD") // Descompone caracteres con acentos
            .replace(/[\u0300-\u036f]/g, "") // Elimina los acentos
            .replace(/\s+/g, '_') // Reemplaza espacios con guiones bajos
            .replace(/[^a-zA-Z0-9_.-]/g, '') // Elimina cualquier otro caracter especial excepto . - _
            .toLowerCase();
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            let url_imagen = editingProduct?.url_imagen || ''
            let imagen_hover = editingProduct?.imagen_hover || null

            // Subir imagen principal
            if (imageFile) {
                console.log('Subiendo imagen principal...')
                // Usar nombre sanitizado
                const cleanName = sanitizeFileName(imageFile.name)
                const fileName = `${Date.now()}_${cleanName}`

                const { error: uploadError } = await supabase.storage
                    .from('imagenes-zapatos')
                    .upload(fileName, imageFile)

                if (uploadError) {
                    showNotification('Error al subir imagen principal: ' + uploadError.message, 'error')
                    return
                }

                const { data } = supabase.storage
                    .from('imagenes-zapatos')
                    .getPublicUrl(fileName)
                url_imagen = data.publicUrl
            }

            // Subir imagen hover
            if (imageHoverFile) {
                console.log('Subiendo imagen hover...')
                // Usar nombre sanitizado
                const cleanName = sanitizeFileName(imageHoverFile.name)
                const fileName = `hover_${Date.now()}_${cleanName}`

                const { error: uploadError } = await supabase.storage
                    .from('imagenes-zapatos')
                    .upload(fileName, imageHoverFile)

                if (uploadError) {
                    showNotification('Error al subir imagen hover: ' + uploadError.message, 'error')
                    return
                }

                const { data } = supabase.storage
                    .from('imagenes-zapatos')
                    .getPublicUrl(fileName)
                imagen_hover = data.publicUrl
            }

            const productData: any = {
                nombre: formData.nombre,
                descripcion: formData.descripcion || null,
                precio: parseFloat(formData.precio),
                categoria: formData.categoria,
                tallas: formData.tallas ? formData.tallas.split(',').map(t => t.trim()).filter(t => t) : [],
                colores: formData.colores ? formData.colores.split(',').map(c => c.trim()).filter(c => c) : [],
                etiquetas: formData.etiquetas || [],
                url_imagen,
                imagen_hover,
                origen: formData.origen, // Nuevo: Enviar origen
                disponible: formData.disponible
            }

            if (editingProduct) {
                // Actualizar
                const { error } = await supabase
                    .from('zapatos')
                    .update(productData)
                    .eq('id', editingProduct.id)

                if (error) throw error
                showNotification('Producto actualizado correctamente', 'success')
            } else {
                // Crear
                const { error } = await supabase
                    .from('zapatos')
                    .insert([productData])

                if (error) throw error
                showNotification('Producto creado correctamente', 'success')
            }

            closeModal()
            loadProductos()

        } catch (err: any) {
            console.error('Error inesperado:', err)
            showNotification('Error: ' + err.message, 'error')
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este producto?')) {
            const { error } = await supabase.from('zapatos').delete().eq('id', id)
            if (!error) {
                showNotification('Producto eliminado', 'success')
                loadProductos()
            } else {
                showNotification('Error al eliminar', 'error')
            }
        }
    }

    const toggleDisponible = async (producto: Producto) => {
        const { error } = await supabase
            .from('zapatos')
            .update({ disponible: !producto.disponible })
            .eq('id', producto.id)

        if (!error) loadProductos()
    }

    const openModal = (producto?: Producto) => {
        if (producto) {
            setEditingProduct(producto)
            setFormData({
                nombre: producto.nombre,
                descripcion: producto.descripcion || '',
                precio: producto.precio.toString(),
                categoria: producto.categoria,
                tallas: producto.tallas?.join(', ') || '',
                colores: producto.colores?.join(', ') || '',
                etiquetas: producto.etiquetas || [],
                origen: producto.origen || 'Nacional', // Cargar origen existente
                disponible: producto.disponible
            })
        } else {
            setEditingProduct(null)
            setFormData({
                nombre: '',
                descripcion: '',
                precio: '',
                categoria: 'adulto',
                tallas: '',
                colores: '',
                etiquetas: [],
                origen: 'Nacional',
                disponible: true
            })
        }
        setImageFile(null)
        setImageHoverFile(null)
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingProduct(null)
        setImageFile(null)
        setImageHoverFile(null)
    }

    const toggleEtiqueta = (etiqueta: string) => {
        setFormData(prev => ({
            ...prev,
            etiquetas: prev.etiquetas.includes(etiqueta)
                ? prev.etiquetas.filter(e => e !== etiqueta)
                : [...prev.etiquetas, etiqueta]
        }))
    }

    const filteredProductos = productos.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 relative">
            {/* Notificación Toast Flotante */}
            <div className={`fixed bottom-8 right-8 z-50 transition-all duration-500 transform ${notification.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
                <div className={`flex items-center gap-4 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md ${notification.type === 'success' ? 'bg-white/95 border-green-500/30 text-slate-800' : 'bg-white/95 border-red-500/30 text-slate-800'}`}>
                    <div className={`p-2 rounded-full shrink-0 ${notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {notification.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <div>
                        <h4 className={`font-bold text-sm ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                            {notification.type === 'success' ? '¡Operación Exitosa!' : '¡Error!'}
                        </h4>
                        <p className="text-sm font-medium text-slate-600 mt-0.5">{notification.message}</p>
                    </div>
                    <button
                        onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                        className="ml-2 bg-slate-100 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

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
                                    Gestión de Productos
                                    <span className="text-xs bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full border border-orange-500/30">
                                        {productos.length} total
                                    </span>
                                </h1>
                                <p className="text-slate-400 mt-2 flex items-center gap-2">
                                    <span className="opacity-75">Admin / Productos</span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => openModal()}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl transition-all font-bold shadow-lg hover:shadow-orange-500/25 group"
                        >
                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            Nuevo Producto
                        </button>
                    </div>

                    {/* Barra de Búsqueda Integrada */}
                    <div className="mt-8 max-w-2xl px-1">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar productos por nombre, categoría..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/10 rounded-xl focus:bg-white/20 focus:border-orange-500/50 outline-none text-white placeholder-slate-400 transition-all backdrop-blur-md"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">


                {/* Products Grid */}
                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredProductos.map((producto, index) => (
                        <div
                            key={producto.id}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all duration-300 group flex flex-col h-full animate-slide-up"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="aspect-square bg-white relative p-6 flex items-center justify-center group-hover:bg-slate-50 transition-colors">
                                <img
                                    src={producto.url_imagen}
                                    alt={producto.nombre}
                                    className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-4 right-4 flex flex-col gap-2">
                                    {!producto.disponible && (
                                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                            AGOTADO
                                        </span>
                                    )}
                                    {producto.etiquetas?.includes('nuevo') && (
                                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                            NUEVO
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <div className="mb-4 flex-1">
                                    <span className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1 block">
                                        {producto.categoria}
                                    </span>
                                    <h3 className="font-bold text-lg text-slate-800 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors">
                                        {producto.nombre}
                                    </h3>
                                </div>

                                <div className="flex items-end justify-between mb-4">
                                    <p className="text-2xl font-bold text-slate-900">${producto.precio}</p>
                                    <div className="flex -space-x-2">
                                        {producto.colores?.slice(0, 3).map((color, idx) => (
                                            <div
                                                key={idx}
                                                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                        {producto.colores?.length > 3 && (
                                            <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-bold">
                                                +{producto.colores.length - 3}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-4 border-t border-slate-100">
                                    <button
                                        onClick={() => toggleDisponible(producto)}
                                        className={`flex-1 flex items-center justify-center h-10 rounded-lg transition-colors ${producto.disponible
                                            ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                            }`}
                                        title={producto.disponible ? 'Ocultar' : 'Mostrar'}
                                    >
                                        {producto.disponible ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                    <button
                                        onClick={() => openModal(producto)}
                                        className="flex-1 flex items-center justify-center h-10 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(producto.id)}
                                        className="flex-1 flex items-center justify-center h-10 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty State */}
                    {filteredProductos.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="text-slate-300" size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">No se encontraron productos</h3>
                            <p className="text-slate-500">Intenta con otros términos o crea un nuevo producto.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-6 py-4 flex justify-between items-center border-b border-slate-600">
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">
                                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                                </h2>
                                <p className="text-slate-300 text-xs mt-0.5">
                                    {editingProduct ? 'Actualiza la información del producto' : 'Completa los datos para crear un nuevo producto'}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-slate-300 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(92vh-80px)]">
                            <div className="p-6">
                                {/* Grid de 2 columnas */}
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Columna Izquierda */}
                                    <div className="space-y-4">
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                                <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                                                Información Básica
                                            </h3>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nombre del Producto</label>
                                                    <input
                                                        type="text"
                                                        value={formData.nombre}
                                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                                        className="w-full px-3 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all"
                                                        placeholder="Ej: Zapato Deportivo Nike Air"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Descripción</label>
                                                    <textarea
                                                        value={formData.descripcion}
                                                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                                        className="w-full px-3 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all resize-none"
                                                        rows={4}
                                                        placeholder="Describe las características principales del producto..."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                                <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                                                Precio y Categoría
                                            </h3>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Precio Unitario</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">$</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={formData.precio}
                                                            onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                                                            className="w-full pl-7 pr-3 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all"
                                                            placeholder="0.00"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Categoría</label>
                                                    <select
                                                        value={formData.categoria}
                                                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                                        className="w-full px-3 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all"
                                                        required
                                                    >
                                                        <option value="">Seleccionar...</option>
                                                        <option value="deportivo">Deportivos</option>
                                                        <option value="formales">Formales</option>
                                                        <option value="botas">Botas</option>
                                                        <option value="sandalias">Sandalias</option>
                                                        <option value="casuales">Casuales</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Nuevo Selector de Origen */}
                                            <div className="mt-4 pt-4 border-t border-slate-200">
                                                <label className="block text-xs font-semibold text-slate-600 mb-2">Origen / Calidad</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[
                                                        { value: 'Nacional', flag: '🇧🇴', label: 'Nacional' },
                                                        { value: 'Brazilero', flag: '🇧🇷', label: 'Brazilero' },
                                                        { value: 'Peruano', flag: '🇵🇪', label: 'Peruano' }
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, origen: opt.value })}
                                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${formData.origen === opt.value
                                                                ? 'border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-100'
                                                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-500 hover:text-slate-700'
                                                                }`}
                                                        >
                                                            <span className="text-2xl mb-1 filter drop-shadow-sm">{opt.flag}</span>
                                                            <span className="text-xs font-bold uppercase tracking-wide">{opt.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                                <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                                                Variantes
                                            </h3>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tallas Disponibles</label>
                                                    <input
                                                        type="text"
                                                        value={formData.tallas}
                                                        onChange={(e) => setFormData({ ...formData, tallas: e.target.value })}
                                                        placeholder="35, 36, 37, 38, 39, 40"
                                                        className="w-full px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all"
                                                    />
                                                    <p className="text-xs text-slate-500 mt-1">Separa las tallas con comas</p>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-2">Colores Disponibles</label>

                                                    {/* Paleta de Colores Predefinida */}
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        {[
                                                            { hex: '#000000', name: 'Negro' },
                                                            { hex: '#FFFFFF', name: 'Blanco' },
                                                            { hex: '#5D4037', name: 'Café' },
                                                            { hex: '#1E40AF', name: 'Azul' },
                                                            { hex: '#DC2626', name: 'Rojo' },
                                                            { hex: '#F59E0B', name: 'Mostaza' },
                                                            { hex: '#E5E7EB', name: 'Gris' },
                                                            { hex: '#D1D5DB', name: 'Plata' },
                                                            { hex: '#FEF3C7', name: 'Beige' },
                                                            { hex: '#FCD34D', name: 'Dorado' },
                                                            { hex: '#EC4899', name: 'Rosa' },
                                                            { hex: '#10B981', name: 'Verde' }
                                                        ].map((color) => {
                                                            const isSelected = formData.colores?.includes(color.hex) || formData.colores?.includes(color.hex + '')
                                                            // Nota: formData.colores viene como string "hex1, hex2" en el estado inicial, pero lo manejaremos mejor
                                                            // Vamos a asumir que formData.colores es string separado por comas para mantener compatibilidad con el resto del código
                                                            const currentColors = formData.colores ? formData.colores.split(',').map(c => c.trim()) : []
                                                            const selected = currentColors.includes(color.hex)

                                                            return (
                                                                <button
                                                                    key={color.hex}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        let newColors = [...currentColors]
                                                                        if (selected) {
                                                                            newColors = newColors.filter(c => c !== color.hex)
                                                                        } else {
                                                                            newColors.push(color.hex)
                                                                        }
                                                                        setFormData({ ...formData, colores: newColors.join(', ') })
                                                                    }}
                                                                    className={`w-8 h-8 rounded-full border-2 shadow-sm transition-all relative flex items-center justify-center group/tooltip ${selected
                                                                        ? 'border-orange-500 ring-2 ring-orange-200 scale-110'
                                                                        : 'border-slate-200 hover:scale-105'
                                                                        }`}
                                                                    style={{ backgroundColor: color.hex }}
                                                                    title={color.name}
                                                                >
                                                                    {selected && (
                                                                        <div className={`w-2 h-2 rounded-full ${color.hex === '#FFFFFF' ? 'bg-black' : 'bg-white'}`}></div>
                                                                    )}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>

                                                    {/* Input Manual para colores extra */}
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={formData.colores}
                                                            onChange={(e) => setFormData({ ...formData, colores: e.target.value })}
                                                            placeholder="Ej: #123456, #ABCDEF"
                                                            className="flex-1 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 mt-1">Selecciona de la lista o escribe los códigos hex manualmente.</p>
                                                </div>

                                                <hr className="border-slate-200 my-2" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Columna Derecha */}
                                    <div className="space-y-4">
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                                <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                                                Etiquetas de Producto
                                            </h3>

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleEtiqueta('nuevo')}
                                                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${formData.etiquetas.includes('nuevo')
                                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                                                        : 'bg-white border-2 border-slate-300 text-slate-700 hover:border-orange-400 hover:text-orange-600'
                                                        }`}
                                                >
                                                    Nuevo
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleEtiqueta('mas_vendido')}
                                                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${formData.etiquetas.includes('mas_vendido')
                                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                                                        : 'bg-white border-2 border-slate-300 text-slate-700 hover:border-orange-400 hover:text-orange-600'
                                                        }`}
                                                >
                                                    Más Vendido
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleEtiqueta('oferta')}
                                                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${formData.etiquetas.includes('oferta')
                                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                                                        : 'bg-white border-2 border-slate-300 text-slate-700 hover:border-orange-400 hover:text-orange-600'
                                                        }`}
                                                >
                                                    Oferta
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                                <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                                                Imágenes del Producto
                                            </h3>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Imagen Principal</label>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                                        className="w-full px-3 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all file:mr-3 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                                                    />
                                                    <p className="text-xs text-slate-500 mt-1">Formato: JPG, PNG (máx. 5MB)</p>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Imagen Hover (Opcional)</label>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => setImageHoverFile(e.target.files?.[0] || null)}
                                                        className="w-full px-3 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all file:mr-3 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                                                    />
                                                    <p className="text-xs text-slate-500 mt-1">Se muestra al pasar el cursor sobre el producto</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                                <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                                                Estado del Producto
                                            </h3>

                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.disponible}
                                                        onChange={(e) => setFormData({ ...formData, disponible: e.target.checked })}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-orange-500 transition-colors"></div>
                                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700">Producto Disponible</p>
                                                    <p className="text-xs text-slate-500">El producto estará visible en la tienda</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer con botones */}
                            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl text-sm"
                                >
                                    {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
