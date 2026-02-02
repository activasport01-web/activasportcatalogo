'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
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

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'adulto',
        description: '',
        sizes: '',
        tags: [] as string[],
        stockStatus: 'normal' // normal, ultimos_pares, llega_pronto, agotado
    })

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

            // 1. Subir imagen con nombre único
            const fileExt = imageFile.name.split('.').pop()
            const fileName = `${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage.from('imagenes-zapatos').upload(fileName, imageFile)
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

            // 4. Guardar en base de datos
            const { error: dbError } = await supabase.from('zapatos').insert({
                nombre: formData.name,
                descripcion: formData.description,
                precio: parseFloat(formData.price),
                categoria: formData.category,
                tallas: sizeArray,
                etiquetas: finalTags,
                url_imagen: publicUrlData.publicUrl,
                disponible: isAvailable
            })
            if (dbError) throw dbError

            onSuccess()
            onClose()
            // Limpiar formulario completo
            setFormData({
                name: '', price: '', category: 'adulto', description: '', sizes: '', tags: [], stockStatus: 'normal'
            })
            setImagePreview(null)
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
                                <input required type="number" placeholder="Precio ($)" className="w-full border p-2 rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-orange" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                <select className="border p-2 rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none cursor-pointer" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option value="adulto">Adulto</option>
                                    <option value="niño">Niño</option>
                                    <option value="deportivo">Deportivo</option>
                                </select>
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
                                <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 h-48 rounded-xl flex items-center justify-center relative cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition overflow-hidden">
                                    {imagePreview ? (
                                        <img src={imagePreview} className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            <Upload className="mx-auto mb-2" />
                                            <span className="text-xs">Subir imagen</span>
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
