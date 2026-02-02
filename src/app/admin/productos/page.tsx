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
    X,
    ImageIcon,
    Info
} from 'lucide-react'

interface Producto {
    id: string
    nombre: string
    descripcion: string
    precio: number
    categoria: string
    tallas: string[]
    colores: any[] // Puede ser string[] (viejo) o ColorVariant[] (nuevo)
    etiquetas: string[]
    url_imagen: string
    imagen_hover?: string
    origen?: string
    genero?: string
    grupo_talla?: string // Niño, Juvenil, Adulto
    codigo?: string
    caja?: string
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

    // Listas dinámicas
    const [marcasList, setMarcasList] = useState<any[]>([])
    const [categoriasList, setCategoriasList] = useState<any[]>([])
    const [subcategoriasList, setSubcategoriasList] = useState<any[]>([])
    // Listas NUEVAS para Genero/Grupo
    const [generosList, setGenerosList] = useState<any[]>([])
    const [gruposList, setGruposList] = useState<any[]>([])

    // NUEVO: Estado para variantes de color con imágenes
    type ColorVariant = {
        color: string      // Hex code
        color2?: string    // Nuevo: Segundo color opcional
        nombre: string     // Nombre del color
        imagen: string     // URL de la imagen (después de subir)
        imageFile?: File   // Archivo temporal antes de subir
    }
    const [colorVariants, setColorVariants] = useState<ColorVariant[]>([])

    // Estado para modal de edición de variante
    const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null)
    const [showVariantModal, setShowVariantModal] = useState(false)

    const [formData, setFormData] = useState({
        nombre: '',
        codigo: '',
        caja: '',
        descripcion: '',
        precio: '',
        categoria: 'Deportivo',
        subcategoria: '',
        genero: '', // Ahora vacío por defecto para obligar selección o usar fallback
        grupo_talla: '',
        tallas: '',
        colores: '',
        etiquetas: [] as string[],
        origen: '', // Marca
        disponible: true
    })

    useEffect(() => {
        checkAuth()
        loadProductos()
        loadListas()
    }, [])

    const loadListas = async () => {
        // Cargar Marcas
        const { data: marcas } = await supabase.from('marcas').select('*').eq('active', true).order('nombre')
        if (marcas) setMarcasList(marcas)

        // Cargar Categorias
        const { data: cats } = await supabase.from('categorias').select('*').eq('activa', true).order('orden')
        if (cats) setCategoriasList(cats)

        // Cargar Subcategorías
        const { data: subcats } = await supabase.from('subcategorias').select('*').eq('activa', true).order('orden')
        if (subcats) setSubcategoriasList(subcats)

        // Cargar Géneros
        const { data: gens } = await supabase.from('generos').select('*').eq('activa', true).order('orden')
        if (gens) setGenerosList(gens)

        // Cargar Grupos
        const { data: grps } = await supabase.from('grupos_tallas').select('*').eq('activa', true).order('orden')
        if (grps) setGruposList(grps)
    }

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
            // NUEVO: Subir imágenes de variantes de color PRIMERO
            console.log('🎨 Variantes antes de subir:', colorVariants)
            const variantsWithUrls = await Promise.all(
                colorVariants.map(async (variant) => {
                    let imageUrl = variant.imagen

                    // Si hay un archivo nuevo, subirlo
                    if (variant.imageFile) {
                        const cleanName = sanitizeFileName(variant.imageFile.name)
                        const fileName = `variant_${Date.now()}_${cleanName}`

                        const { error: uploadError } = await supabase.storage
                            .from('imagenes-zapatos')
                            .upload(fileName, variant.imageFile)

                        if (uploadError) {
                            console.error('Error subiendo variante:', uploadError)
                            showNotification('Error al subir imagen: ' + uploadError.message, 'error')
                            return variant // Retornar sin cambios si falla
                        }

                        const { data } = supabase.storage
                            .from('imagenes-zapatos')
                            .getPublicUrl(fileName)
                        imageUrl = data.publicUrl
                    }

                    return {
                        color: variant.color,
                        color2: variant.color2 || undefined,
                        nombre: variant.nombre,
                        imagen: imageUrl
                    }
                })
            )
            console.log('✅ Variantes con URLs:', variantsWithUrls)

            // Usar la primera variante como imagen principal
            const url_imagen = variantsWithUrls.length > 0 && variantsWithUrls[0].imagen
                ? variantsWithUrls[0].imagen
                : editingProduct?.url_imagen || ''

            // Segunda variante como hover (si existe)
            const imagen_hover = variantsWithUrls.length > 1 && variantsWithUrls[1].imagen
                ? variantsWithUrls[1].imagen
                : editingProduct?.imagen_hover || null

            const productData: any = {
                nombre: formData.nombre,
                codigo: formData.codigo || null,
                caja: formData.caja || null,
                descripcion: formData.descripcion || null,
                precio: 0, // Venta por mayor, precio oculto/negociable/docena
                categoria: formData.categoria,
                subcategoria: formData.subcategoria || null,
                genero: formData.genero || 'Unisex',
                grupo_talla: formData.grupo_talla || 'Adulto',
                tallas: formData.tallas ? formData.tallas.split(',').map(t => t.trim()).filter(t => t) : [],
                // ACTUALIZADO: Guardar variantes completas si existen, sino array vacío
                colores: variantsWithUrls.length > 0 ? variantsWithUrls : [],
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

            // Cargar variantes de color si existen
            console.log('📥 Producto.colores:', producto.colores)
            if (producto.colores && Array.isArray(producto.colores) && producto.colores.length > 0) {
                // Detectar si es formato nuevo (objetos con nombre/imagen) o viejo (strings hex)
                const firstItem: any = producto.colores[0]
                const isNewFormat = typeof firstItem === 'object' && (firstItem.nombre || firstItem.imagen)
                console.log('🔍 Es formato nuevo?', isNewFormat, 'Primer item:', firstItem)

                if (isNewFormat) {
                    // Formato nuevo: array de objetos con color, nombre, imagen
                    const loadedVariants = producto.colores.map((c: any) => ({
                        color: c.color || '#000000',
                        color2: c.color2 || undefined,
                        nombre: c.nombre || 'Color',
                        imagen: c.imagen || ''
                    }))
                    console.log('✅ Variantes cargadas:', loadedVariants)
                    setColorVariants(loadedVariants)
                } else {
                    // Formato viejo: array de hex strings - no cargar variantes
                    console.log('⚠️ Formato viejo detectado, no se cargan variantes')
                    setColorVariants([])
                }
            } else {
                console.log('❌ No hay colores en el producto')
                setColorVariants([])
            }

            setFormData({
                nombre: producto.nombre,
                codigo: (producto as any).codigo || '',
                caja: (producto as any).caja || '',
                descripcion: producto.descripcion || '',
                precio: producto.precio.toString(),
                categoria: producto.categoria,
                subcategoria: (producto as any).subcategoria || '',
                genero: (producto as any).genero || 'Unisex',
                grupo_talla: (producto as any).grupo_talla || 'Adulto',
                tallas: producto.tallas?.join(', ') || '',
                colores: '', // Ya no usamos esto
                etiquetas: producto.etiquetas || [],
                origen: producto.origen || 'Nacional', // Cargar origen existente
                disponible: producto.disponible
            })
        } else {
            setEditingProduct(null)
            setColorVariants([]) // Limpiar variantes
            setFormData({
                nombre: '',
                codigo: '',
                caja: '',
                descripcion: '',
                precio: '', // Se limpia
                categoria: 'Deportivo',
                subcategoria: '',
                genero: 'Unisex',
                grupo_talla: 'Adulto',
                tallas: '',
                colores: '',
                etiquetas: [],
                origen: '',
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
            {/* Notificación Toast Flotante */}
            <div className={`fixed bottom-8 right-8 z-50 transition-all duration-500 transform ${notification.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
                <div className={`flex items-center gap-4 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md ${notification.type === 'success' ? 'bg-white/95 dark:bg-slate-900/95 border-green-500/30 text-slate-800 dark:text-slate-100' : 'bg-white/95 dark:bg-slate-900/95 border-red-500/30 text-slate-800 dark:text-slate-100'}`}>
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
                        className="ml-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Header Moderno Responsive */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950 border-b border-slate-700 dark:border-slate-800 shadow-lg text-white sticky top-0 z-30 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-8">
                    <div className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3 md:gap-4">
                            <Link
                                href="/admin/dashboard"
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm shrink-0"
                            >
                                <ArrowLeft size={18} className="text-orange-400" />
                            </Link>
                            <div>
                                <h1 className="text-lg md:text-3xl font-bold flex items-center gap-2 md:gap-3 leading-none">
                                    Productos
                                    <span className="text-[10px] md:text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">
                                        {productos.length}
                                    </span>
                                </h1>
                            </div>
                        </div>

                        <button
                            onClick={() => openModal()}
                            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl transition-all font-bold shadow-lg hover:shadow-orange-500/25 group shrink-0"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                            <span className="hidden md:inline">Nuevo Producto</span>
                            <span className="md:hidden text-xs">Nuevo</span>
                        </button>
                    </div>

                    {/* Barra de Búsqueda Integrada */}
                    <div className="mt-4 md:mt-8 max-w-2xl">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 md:py-4 bg-white/10 border border-white/10 rounded-xl focus:bg-white/20 focus:border-orange-500/50 outline-none text-white placeholder-slate-400 transition-all backdrop-blur-md text-sm md:text-base"
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
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-orange-200 dark:hover:border-orange-500/30 transition-all duration-300 group flex flex-col h-full animate-slide-up"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="aspect-square bg-white dark:bg-slate-800/50 relative p-6 flex items-center justify-center group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors">
                                <img
                                    src={producto.url_imagen}
                                    alt={producto.nombre}
                                    className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500 drop-shadow-sm"
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
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                        {producto.nombre}
                                    </h3>
                                </div>

                                <div className="flex items-end justify-between mb-4">
                                    {/* Precio puede estar oculto o mostrarse como 'Consultar' en modo mayorista */}
                                    <p className="text-lg font-bold text-slate-900 dark:text-slate-200">
                                        Mayorista
                                    </p>
                                    <div className="flex -space-x-2">
                                        {producto.colores?.slice(0, 3).map((color, idx) => (
                                            <div
                                                key={idx}
                                                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                                style={{
                                                    background: color.color2
                                                        ? `linear-gradient(135deg, ${color.color} 50%, ${color.color2} 50%)`
                                                        : color.color || color
                                                }}
                                            />
                                        ))}
                                        {producto.colores?.length > 3 && (
                                            <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-700 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] text-slate-500 dark:text-slate-300 font-bold">
                                                +{producto.colores.length - 3}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                    <button
                                        onClick={() => toggleDisponible(producto)}
                                        className={`flex-1 flex items-center justify-center h-10 rounded-lg transition-colors ${producto.disponible
                                            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                        title={producto.disponible ? 'Ocultar' : 'Mostrar'}
                                    >
                                        {producto.disponible ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                    <button
                                        onClick={() => openModal(producto)}
                                        className="flex-1 flex items-center justify-center h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(producto.id)}
                                        className="flex-1 flex items-center justify-center h-10 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No se encontraron productos</h3>
                            <p className="text-slate-500 dark:text-slate-400">Intenta con otros términos o crea un nuevo producto.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-0 md:p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full h-full md:h-auto md:max-h-[92vh] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col border dark:border-slate-800">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4 py-3 md:px-6 md:py-4 flex justify-between items-center border-b border-slate-600 dark:border-slate-800 shrink-0">
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

                        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 max-h-[calc(100vh-130px)] md:max-h-[calc(92vh-80px)] p-4 md:p-6">
                            {/* Grid de 2 columnas */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Columna Izquierda */}
                                <div className="space-y-4">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
                                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                                            <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                                            Información Básica
                                        </h3>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Nombre del Producto</label>
                                                <input
                                                    type="text"
                                                    value={formData.nombre}
                                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                                    className="w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-800 transition-all placeholder-slate-400"
                                                    placeholder="Ej: Zapato Deportivo Nike Air"
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Código Único (Oculto)</label>
                                                    <input
                                                        type="text"
                                                        value={formData.codigo}
                                                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                                        className="w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-800 transition-all placeholder-slate-400"
                                                        placeholder="Ej: 3EDS"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Detalle Caja (Oculto)</label>
                                                    <input
                                                        type="text"
                                                        value={formData.caja}
                                                        onChange={(e) => setFormData({ ...formData, caja: e.target.value })}
                                                        className="w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-800 transition-all placeholder-slate-400"
                                                        placeholder="Ej: Rojo con Verde"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Descripción</label>
                                                <textarea
                                                    value={formData.descripcion}
                                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                                    className="w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-800 transition-all resize-none placeholder-slate-400"
                                                    rows={4}
                                                    placeholder="Describe las características principales del producto..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
                                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                                            <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                                            Configuración de Venta por Mayor
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                                                    Serie de Tallas <span className="text-slate-400 font-normal">(Opcional)</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.tallas}
                                                    onChange={(e) => setFormData({ ...formData, tallas: e.target.value })}
                                                    placeholder="Ej: 30, 31, 32, 33, 34"
                                                    className="w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-800 transition-all placeholder-slate-400"
                                                />

                                                {/* Hint Dinámico */}
                                                {formData.grupo_talla && gruposList.find(g => g.nombre === formData.grupo_talla)?.rango_tallas ? (
                                                    <p className="text-[10px] text-blue-500 mt-1 font-medium">
                                                        ℹ️ Rango sugerido para {formData.grupo_talla}: {gruposList.find(g => g.nombre === formData.grupo_talla)?.rango_tallas}
                                                    </p>
                                                ) : (
                                                    <p className="text-[10px] text-slate-500 mt-1">Escribe las tallas específicas separadas por coma.</p>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Pares por Bulto</label>
                                                    <select
                                                        className="w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-800 transition-all"
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (!val) return;
                                                            // Añadir al inicio de la descripción de forma inteligente
                                                            const prefix = `[Bulto de ${val} pares]`;
                                                            if (!formData.descripcion.includes('[Bulto de')) {
                                                                setFormData(prev => ({ ...prev, descripcion: `${prefix} ${prev.descripcion}` }));
                                                            }
                                                        }}
                                                    >
                                                        <option value="">Seleccionar...</option>
                                                        <option value="12">12 Pares (Docena)</option>
                                                        <option value="6">6 Pares (Media Docena)</option>
                                                        <option value="18">18 Pares</option>
                                                        <option value="24">24 Pares (Cajón)</option>
                                                        <option value="30">30 Pares</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Categoría *</label>
                                                    <select
                                                        value={formData.categoria}
                                                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                                        className="w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-800 transition-all"
                                                        required
                                                    >
                                                        <option value="">Seleccionar...</option>
                                                        {categoriasList.map((cat: any) => (
                                                            <option key={cat.nombre} value={cat.nombre}>{cat.nombre}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Subcategoría (Nuevo) */}
                                            <div className="mt-4">
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                                                    Subcategoría / Tipo <span className="text-slate-400 font-normal">(Opcional)</span>
                                                </label>
                                                <select
                                                    value={(formData as any).subcategoria || ''}
                                                    onChange={(e) => setFormData({ ...formData, subcategoria: e.target.value } as any)}
                                                    className="w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-800 transition-all"
                                                >
                                                    <option value="">Sin subcategoría</option>
                                                    {subcategoriasList
                                                        .filter((sub: any) => !sub.categoria_relacionada || sub.categoria_relacionada === formData.categoria || sub.categoria_relacionada === '')
                                                        .map((sub: any) => (
                                                            <option key={sub.id} value={sub.nombre}>{sub.nombre}</option>
                                                        ))
                                                    }
                                                </select>
                                                <p className="text-[10px] text-slate-500 mt-1">Depende de la categoría seleccionada</p>
                                            </div>

                                            {/* Género y Talla (Nuevos Filtros) */}
                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Género</label>
                                                    <select
                                                        value={formData.genero}
                                                        onChange={(e) => setFormData({ ...formData, genero: e.target.value } as any)}
                                                        className="w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-800 transition-all"
                                                    >
                                                        <option value="">Seleccionar...</option>
                                                        {generosList.map((g: any) => (
                                                            <option key={g.nombre} value={g.nombre}>{g.nombre}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Grupo</label>
                                                    <select
                                                        value={formData.grupo_talla}
                                                        onChange={(e) => setFormData({ ...formData, grupo_talla: e.target.value } as any)}
                                                        className="w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-800 transition-all"
                                                    >
                                                        <option value="">Seleccionar...</option>
                                                        {gruposList.map((g: any) => (
                                                            <option key={g.nombre} value={g.nombre}>{g.nombre}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Selector de Marca (Reemplaza Origen) */}
                                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Marca</label>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                    {marcasList.map((m) => (
                                                        <button
                                                            key={m.nombre}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, origen: m.nombre })}
                                                            className={`flex items-center justify-center p-2 rounded-lg border text-xs font-bold uppercase transition-all ${formData.origen === m.nombre
                                                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 ring-1 ring-orange-200 dark:ring-orange-900'
                                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-300'
                                                                }`}
                                                        >
                                                            {m.nombre}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
                                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                                            <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                                            Variantes de Color con Imágenes
                                        </h3>

                                        <div className="space-y-3">
                                            {/* Lista de variantes existentes */}
                                            {colorVariants.map((variant, index) => (
                                                <div
                                                    key={index}
                                                    className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3 hover:border-orange-300 dark:hover:border-orange-500/50 transition-colors cursor-pointer group"
                                                    onClick={() => {
                                                        setEditingVariantIndex(index)
                                                        setShowVariantModal(true)
                                                    }}
                                                >
                                                    {/* Preview de imagen */}
                                                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 flex-shrink-0">
                                                        {variant.imageFile ? (
                                                            <img
                                                                src={URL.createObjectURL(variant.imageFile)}
                                                                alt={variant.nombre}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : variant.imagen ? (
                                                            <img
                                                                src={variant.imagen}
                                                                alt={variant.nombre}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                                                <ImageIcon size={20} className="text-slate-400" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Info del color */}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-700 shadow-sm"
                                                                style={{
                                                                    background: variant.color2
                                                                        ? `linear-gradient(135deg, ${variant.color} 50%, ${variant.color2} 50%)`
                                                                        : variant.color
                                                                }}
                                                            />
                                                            <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{variant.nombre}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-400 mt-0.5">{variant.color}</p>
                                                    </div>

                                                    {/* Botón editar (visible al hover) */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setEditingVariantIndex(index)
                                                            setShowVariantModal(true)
                                                        }}
                                                        className="p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Edit size={18} />
                                                    </button>

                                                    {/* Botón eliminar */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setColorVariants(colorVariants.filter((_, i) => i !== index))
                                                        }}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ))}

                                            {/* Botón para agregar nueva variante */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    // Agregar una variante vacía
                                                    setColorVariants([...colorVariants, {
                                                        color: '#000000',
                                                        color2: undefined,
                                                        nombre: 'Nuevo Color',
                                                        imagen: ''
                                                    }])
                                                }}
                                                className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-all flex items-center justify-center gap-2 font-medium text-sm"
                                            >
                                                <Plus size={18} />
                                                Agregar Variante de Color
                                            </button>

                                            <p className="text-[10px] text-slate-400 mt-2">
                                                Cada color puede tener su propia imagen. Al hacer clic en un color en el catálogo, se mostrará su imagen correspondiente.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Columna Derecha */}
                                <div className="space-y-4">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
                                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                                            <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                                            Etiquetas de Producto
                                        </h3>

                                        <div className="flex flex-wrap gap-2">
                                            {['nuevo', 'mas_vendido', 'oferta'].map(tag => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => toggleEtiqueta(tag)}
                                                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all uppercase ${formData.etiquetas.includes(tag)
                                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                                                        : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-500'
                                                        }`}
                                                >
                                                    {tag.replace('_', ' ')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
                                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                                            <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                                            Estado de Inventario (Semáforo)
                                        </h3>

                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Opción 1: Disponible (Verde) */}
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    disponible: true,
                                                    etiquetas: prev.etiquetas.filter(t => t !== 'ultimos_pares' && t !== 'proximamente')
                                                }))}
                                                className={`p-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${formData.disponible && !formData.etiquetas.includes('ultimos_pares') && !formData.etiquetas.includes('proximamente')
                                                        ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border-green-500 ring-1 ring-green-500'
                                                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-green-300'
                                                    }`}
                                            >
                                                <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                                                Disponible
                                            </button>

                                            {/* Opción 2: Últimos Pares (Amarillo) */}
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    disponible: true,
                                                    etiquetas: [...prev.etiquetas.filter(t => t !== 'ultimos_pares' && t !== 'proximamente'), 'ultimos_pares']
                                                }))}
                                                className={`p-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${formData.disponible && formData.etiquetas.includes('ultimos_pares')
                                                        ? 'bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-500 ring-1 ring-yellow-500'
                                                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-yellow-300'
                                                    }`}
                                            >
                                                <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm animate-pulse"></div>
                                                Últimos Pares
                                            </button>

                                            {/* Opción 3: Llega Pronto (Azul) */}
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    disponible: true,
                                                    etiquetas: [...prev.etiquetas.filter(t => t !== 'ultimos_pares' && t !== 'proximamente'), 'proximamente']
                                                }))}
                                                className={`p-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${formData.disponible && formData.etiquetas.includes('proximamente')
                                                        ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-500 ring-1 ring-blue-500'
                                                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-blue-300'
                                                    }`}
                                            >
                                                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                                                Llega Pronto
                                            </button>

                                            {/* Opción 4: Agotado (Rojo) */}
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    disponible: false
                                                }))}
                                                className={`p-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${!formData.disponible
                                                        ? 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-500 ring-1 ring-red-500'
                                                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-red-300'
                                                    }`}
                                            >
                                                <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                                                Agotado
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer con botones */}
                            <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 md:px-6 md:py-4 flex gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-600 transition-all text-sm"
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
                </div >
            )}


            {/* Modal de Edición de Variante de Color */}
            {
                showVariantModal && editingVariantIndex !== null && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden border dark:border-slate-800 flex flex-col">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between shrink-0">
                                <h2 className="text-xl font-bold text-white">Editar Variante de Color</h2>
                                <button
                                    onClick={() => setShowVariantModal(false)}
                                    className="text-white/80 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Body Scrollable */}
                            <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                                {/* Selector de Color */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Color</label>
                                    <div className="grid grid-cols-6 gap-2 mb-3">
                                        {[
                                            { hex: '#000000', name: 'Negro' },
                                            { hex: '#FFFFFF', name: 'Blanco' },
                                            { hex: '#5D4037', name: 'Café' },
                                            { hex: '#1E40AF', name: 'Azul' },
                                            { hex: '#DC2626', name: 'Rojo' },
                                            { hex: '#F59E0B', name: 'Mostaza' },
                                            { hex: '#E5E7EB', name: 'Gris' },
                                            { hex: '#10B981', name: 'Verde' },
                                            { hex: '#EC4899', name: 'Rosa' },
                                            { hex: '#FCD34D', name: 'Dorado' },
                                            { hex: '#8B4513', name: 'Marrón' },
                                            { hex: '#4B5563', name: 'Plomo' }
                                        ].map((c) => (
                                            <button
                                                key={c.hex}
                                                type="button"
                                                onClick={() => {
                                                    const updated = [...colorVariants]
                                                    updated[editingVariantIndex] = {
                                                        ...updated[editingVariantIndex],
                                                        color: c.hex,
                                                        nombre: c.name
                                                    }
                                                    setColorVariants(updated)
                                                }}
                                                className={`w-10 h-10 rounded-full border-2 transition-all ${colorVariants[editingVariantIndex].color === c.hex
                                                    ? 'border-orange-500 ring-2 ring-orange-200 dark:ring-orange-900 scale-110'
                                                    : 'border-slate-200 dark:border-slate-600 hover:scale-105'
                                                    }`}
                                                style={{ backgroundColor: c.hex }}
                                                title={c.name}
                                            />
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={colorVariants[editingVariantIndex].color}
                                        onChange={(e) => {
                                            const updated = [...colorVariants]
                                            updated[editingVariantIndex].color = e.target.value
                                            setColorVariants(updated)
                                        }}
                                        placeholder="#000000"
                                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                    />

                                    {/* SEGUNDO COLOR (OPCIONAL) */}
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                                                Segundo Color (Opcional)
                                            </label>
                                            {colorVariants[editingVariantIndex].color2 ? (
                                                <button
                                                    onClick={() => {
                                                        const updated = [...colorVariants]
                                                        updated[editingVariantIndex].color2 = undefined
                                                        setColorVariants(updated)
                                                    }}
                                                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                                                >
                                                    Quitar segundo color
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        const updated = [...colorVariants]
                                                        updated[editingVariantIndex].color2 = '#FFFFFF'
                                                        setColorVariants(updated)
                                                    }}
                                                    className="text-xs text-orange-500 hover:text-orange-700 font-medium"
                                                >
                                                    Agregar color combinado
                                                </button>
                                            )}
                                        </div>

                                        {colorVariants[editingVariantIndex].color2 && (
                                            <div className="animate-fade-in">
                                                <div className="grid grid-cols-6 gap-2 mb-3">
                                                    {[
                                                        { hex: '#000000', name: 'Negro' },
                                                        { hex: '#FFFFFF', name: 'Blanco' },
                                                        { hex: '#5D4037', name: 'Café' },
                                                        { hex: '#1E40AF', name: 'Azul' },
                                                        { hex: '#DC2626', name: 'Rojo' },
                                                        { hex: '#F59E0B', name: 'Mostaza' },
                                                        { hex: '#E5E7EB', name: 'Gris' },
                                                        { hex: '#10B981', name: 'Verde' },
                                                        { hex: '#EC4899', name: 'Rosa' },
                                                        { hex: '#FCD34D', name: 'Dorado' },
                                                        { hex: '#8B4513', name: 'Marrón' },
                                                        { hex: '#4B5563', name: 'Plomo' }
                                                    ].map((c) => (
                                                        <button
                                                            key={`color2-${c.hex}`}
                                                            type="button"
                                                            onClick={() => {
                                                                const updated = [...colorVariants]
                                                                updated[editingVariantIndex] = {
                                                                    ...updated[editingVariantIndex],
                                                                    color2: c.hex
                                                                }
                                                                setColorVariants(updated)
                                                            }}
                                                            className={`w-10 h-10 rounded-full border-2 transition-all ${colorVariants[editingVariantIndex].color2 === c.hex
                                                                ? 'border-orange-500 ring-2 ring-orange-200 dark:ring-orange-900 scale-110'
                                                                : 'border-slate-200 dark:border-slate-600 hover:scale-105'
                                                                }`}
                                                            style={{ backgroundColor: c.hex }}
                                                            title={c.name}
                                                        />
                                                    ))}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={colorVariants[editingVariantIndex].color2}
                                                    onChange={(e) => {
                                                        const updated = [...colorVariants]
                                                        updated[editingVariantIndex].color2 = e.target.value
                                                        setColorVariants(updated)
                                                    }}
                                                    placeholder="#000000"
                                                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Nombre del Color */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Nombre del Color</label>
                                    <input
                                        type="text"
                                        value={colorVariants[editingVariantIndex].nombre}
                                        onChange={(e) => {
                                            const updated = [...colorVariants]
                                            updated[editingVariantIndex].nombre = e.target.value
                                            setColorVariants(updated)
                                        }}
                                        placeholder="Ej: Negro, Blanco, Azul"
                                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                    />
                                </div>

                                {/* Subir Imagen */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Imagen del Zapato en este Color</label>
                                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center hover:border-orange-400 dark:hover:border-orange-500 transition-colors">
                                        {colorVariants[editingVariantIndex].imageFile || colorVariants[editingVariantIndex].imagen ? (
                                            <div className="space-y-3">
                                                <img
                                                    src={
                                                        colorVariants[editingVariantIndex].imageFile
                                                            ? URL.createObjectURL(colorVariants[editingVariantIndex].imageFile!)
                                                            : colorVariants[editingVariantIndex].imagen
                                                    }
                                                    alt="Preview"
                                                    className="w-32 h-32 object-cover mx-auto rounded-lg"
                                                />
                                                <label className="inline-block px-4 py-2 bg-orange-500 text-white rounded-lg cursor-pointer hover:bg-orange-600 transition-colors text-sm font-medium">
                                                    Cambiar Imagen
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) {
                                                                const updated = [...colorVariants]
                                                                updated[editingVariantIndex].imageFile = file
                                                                setColorVariants(updated)
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer block">
                                                <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                                                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Haz clic para subir imagen</p>
                                                <p className="text-xs text-slate-400 mt-1">JPG, PNG (máx. 5MB)</p>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) {
                                                            const updated = [...colorVariants]
                                                            updated[editingVariantIndex].imageFile = file
                                                            setColorVariants(updated)
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex gap-3 shrink-0">
                                <button
                                    onClick={() => setShowVariantModal(false)}
                                    className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cerrar
                                </button>
                                <button
                                    onClick={() => setShowVariantModal(false)}
                                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
