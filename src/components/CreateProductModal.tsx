'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { compressImage } from '@/lib/imageCompression'
import { X, Upload, Loader2 } from 'lucide-react'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function CreateProductModal({ isOpen, onClose, onSuccess }: ModalProps) {
    const [loading, setLoading] = useState(false)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    // Listas maestras desde la BD
    const [categorias, setCategorias] = useState<any[]>([])
    const [marcas, setMarcas] = useState<any[]>([])
    const [generos, setGeneros] = useState<any[]>([])
    const [subcategorias, setSubcategorias] = useState<any[]>([])

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        categoria_id: '',
        marca_id: '',
        genero_id: '',
        subcategoria_id: '',
        description: '',
        sizes: '',
        origen: 'Nacional',
        codigo: '',
        caja: '',
        tags: [] as string[],
        stockStatus: 'normal' // normal, ultimos_pares, llega_pronto, agotado
    })

    // Cargar listas maestras al abrir el modal
    useEffect(() => {
        if (!isOpen) return

        const fetchMasterData = async () => {
            const [catRes, marcaRes, genRes, subcatRes] = await Promise.all([
                supabase.from('categorias').select('id, nombre').eq('activa', true).order('orden'),
                supabase.from('marcas').select('id, nombre').eq('active', true).order('nombre'),
                supabase.from('generos').select('id, nombre').eq('activa', true).order('orden'),
                supabase.from('subcategorias').select('id, nombre, categoria_id').eq('activa', true).order('orden')
            ])

            if (catRes.data) setCategorias(catRes.data)
            if (marcaRes.data) setMarcas(marcaRes.data)
            if (genRes.data) setGeneros(genRes.data)
            if (subcatRes.data) setSubcategorias(subcatRes.data)
        }

        fetchMasterData()
    }, [isOpen])

    // Filtrar subcategorías por la categoría seleccionada
    const filteredSubcategorias = subcategorias.filter(
        s => !formData.categoria_id || s.categoria_id === formData.categoria_id
    )

    const handleTagChange = (tag: string) => {
        if (formData.tags.includes(tag)) {
            setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })
        } else {
            setFormData({ ...formData, tags: [...formData.tags, tag] })
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (!imageFile) throw new Error("Falta la imagen")

            // 1. Comprimir imagen y subir con nombre único
            const compressedFile = await compressImage(imageFile)
            const fileExt = compressedFile.name.split('.').pop()
            const fileName = `${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage.from('imagenes-zapatos').upload(fileName, compressedFile)
            if (uploadError) throw uploadError

            const { data: publicUrlData } = supabase.storage.from('imagenes-zapatos').getPublicUrl(fileName)

            // 2. Procesar etiquetas y estado
            let finalTags = [...formData.tags]
            let isAvailable = true

            if (formData.stockStatus === 'ultimos_pares') {
                finalTags.push('ultimos_pares')
            } else if (formData.stockStatus === 'llega_pronto') {
                finalTags.push('proximamente')
            } else if (formData.stockStatus === 'agotado') {
                isAvailable = false
            }

            // 3. Convertir tallas de texto a array
            const sizeArray = formData.sizes.split(',').map(s => s.trim()).filter(s => s !== '')

            // 4. Guardar en base de datos con FKs relacionales
            const insertData: any = {
                nombre: formData.name,
                descripcion: formData.description,
                precio: parseFloat(formData.price) || 0,
                tallas: sizeArray,
                etiquetas: finalTags,
                url_imagen: publicUrlData.publicUrl,
                disponible: isAvailable,
                origen: formData.origen || 'Nacional',
                codigo: formData.codigo || null,
                caja: formData.caja || null,
            }

            // Asignar FKs solo si fueron seleccionados
            if (formData.categoria_id) insertData.categoria_id = formData.categoria_id
            if (formData.marca_id) insertData.marca_id = formData.marca_id
            if (formData.genero_id) insertData.genero_id = formData.genero_id
            if (formData.subcategoria_id) insertData.subcategoria_id = formData.subcategoria_id

            const { error: dbError } = await supabase.from('zapatos').insert(insertData)
            if (dbError) throw dbError

            onSuccess()
            onClose()
            // Limpiar formulario completo
            setFormData({
                name: '', price: '', categoria_id: '', marca_id: '', genero_id: '',
                subcategoria_id: '', description: '', sizes: '', origen: 'Nacional',
                codigo: '', caja: '', tags: [], stockStatus: 'normal'
            })
            setImagePreview(null)
            setImageFile(null)
        } catch (error: any) {
            alert('Error: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto transition-colors">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950">
                    <h2 className="text-xl font-bold dark:text-white">Agregar Nuevo Zapato</h2>
                    <button onClick={onClose}><X className="text-gray-500 hover:text-red-500" size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Información Básica</label>
                                <input required type="text" placeholder="Nombre Modelo" className="w-full border p-2 rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-orange" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>

                            <div className="flex gap-2">
                                <input required type="number" placeholder="Precio ($)" className="w-1/2 border p-2 rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-orange" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                <input type="text" placeholder="Código (ej: 267)" className="w-1/2 border p-2 rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-orange" value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value })} />
                            </div>

                            {/* Categoría (desde BD) */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Categoría</label>
                                <select className="w-full border p-2 rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none cursor-pointer" value={formData.categoria_id} onChange={e => setFormData({ ...formData, categoria_id: e.target.value, subcategoria_id: '' })}>
                                    <option value="">— Seleccionar —</option>
                                    {categorias.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Subcategoría (filtrada por categoría) */}
                            {filteredSubcategorias.length > 0 && (
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Subcategoría</label>
                                    <select className="w-full border p-2 rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none cursor-pointer" value={formData.subcategoria_id} onChange={e => setFormData({ ...formData, subcategoria_id: e.target.value })}>
                                        <option value="">— Seleccionar —</option>
                                        {filteredSubcategorias.map(s => (
                                            <option key={s.id} value={s.id}>{s.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Marca (desde BD) */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Marca</label>
                                <select className="w-full border p-2 rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none cursor-pointer" value={formData.marca_id} onChange={e => setFormData({ ...formData, marca_id: e.target.value })}>
                                    <option value="">— Seleccionar —</option>
                                    {marcas.map(m => (
                                        <option key={m.id} value={m.id}>{m.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Género (desde BD) */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Género</label>
                                <select className="w-full border p-2 rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none cursor-pointer" value={formData.genero_id} onChange={e => setFormData({ ...formData, genero_id: e.target.value })}>
                                    <option value="">— Seleccionar —</option>
                                    {generos.map(g => (
                                        <option key={g.id} value={g.id}>{g.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Origen y Caja */}
                            <div className="flex gap-2">
                                <div className="w-1/2">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Origen / Marca Texto</label>
                                    <input type="text" placeholder="Ej: Gasper" className="w-full border p-2 rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-orange" value={formData.origen} onChange={e => setFormData({ ...formData, origen: e.target.value })} />
                                </div>
                                <div className="w-1/2">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Caja</label>
                                    <input type="text" placeholder="Ej: caja celeste" className="w-full border p-2 rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-orange" value={formData.caja} onChange={e => setFormData({ ...formData, caja: e.target.value })} />
                                </div>
                            </div>

                            <input type="text" placeholder="Tallas (ej: 40, 42, 44)" className="w-full border p-2 rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-orange" value={formData.sizes} onChange={e => setFormData({ ...formData, sizes: e.target.value })} />

                            {/* Stock Status Selector */}
                            <div className="pt-2">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Estado de Inventario</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, stockStatus: 'normal' })}
                                        className={`p-2 rounded-lg border text-sm font-bold transition-all ${formData.stockStatus === 'normal' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500'}`}
                                    >
                                        🟢 Disponible
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, stockStatus: 'ultimos_pares' })}
                                        className={`p-2 rounded-lg border text-sm font-bold transition-all ${formData.stockStatus === 'ultimos_pares' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500'}`}
                                    >
                                        🟡 Últimos Pares
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, stockStatus: 'llega_pronto' })}
                                        className={`p-2 rounded-lg border text-sm font-bold transition-all ${formData.stockStatus === 'llega_pronto' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500'}`}
                                    >
                                        🔵 Llega Pronto
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, stockStatus: 'agotado' })}
                                        className={`p-2 rounded-lg border text-sm font-bold transition-all ${formData.stockStatus === 'agotado' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500'}`}
                                    >
                                        🔴 Agotado
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-4 text-sm pt-2">
                                <label className="flex items-center gap-2 dark:text-white cursor-pointer select-none">
                                    <input type="checkbox" className="w-4 h-4 rounded text-brand-orange focus:ring-brand-orange" checked={formData.tags.includes('nuevo')} onChange={() => handleTagChange('nuevo')} />
                                    Etiqueta "Nuevo"
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Imagen del Producto</label>
                                <div 
                                    onDragOver={(e) => {
                                        e.preventDefault()
                                        setIsDragging(true)
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={(e) => {
                                        e.preventDefault()
                                        setIsDragging(false)
                                        const file = e.dataTransfer.files?.[0]
                                        if (file && file.type.startsWith("image/")) {
                                            setImageFile(file)
                                            setImagePreview(URL.createObjectURL(file))
                                        }
                                    }}
                                    className={`border-2 border-dashed h-48 rounded-xl flex items-center justify-center relative cursor-pointer transition-all overflow-hidden ${
                                        isDragging 
                                            ? "border-brand-orange bg-brand-orange/15 scale-[1.02]" 
                                            : "border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                                    }`}
                                >
                                    {isDragging ? (
                                        <div className="text-center text-brand-orange p-2 animate-pulse">
                                            <Upload className="mx-auto mb-2 animate-bounce" />
                                            <span className="text-xs font-bold">¡Coloca la imagen aquí!</span>
                                        </div>
                                    ) : imagePreview ? (
                                        <img src={imagePreview} className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="text-center text-gray-400 p-2">
                                            <Upload className="mx-auto mb-2" />
                                            <span className="text-xs font-semibold">Arrastra la imagen para subir o abrir carpeta</span>
                                        </div>
                                    )}
                                    <input type="file" required className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} accept="image/*" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descripción (Opcional)</label>
                                <textarea
                                    placeholder="Detalles adicionales del producto..."
                                    className="w-full border p-3 rounded-xl bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-orange resize-none"
                                    rows={4}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-slate-900 dark:bg-brand-orange text-white py-4 rounded-xl hover:opacity-90 font-bold tracking-wide flex justify-center items-center gap-3 transition-all shadow-lg">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'GUARDAR PRODUCTO'}
                    </button>
                </form>
            </div>
        </div>
    )
}
