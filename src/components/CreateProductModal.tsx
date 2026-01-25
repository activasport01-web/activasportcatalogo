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
        name: '', price: '', category: 'adulto', description: '', sizes: '', tags: [] as string[]
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

            // 2. Convertir tallas de texto a array
            const sizeArray = formData.sizes.split(',').map(s => s.trim()).filter(s => s !== '')

            // 3. Guardar en base de datos
            const { error: dbError } = await supabase.from('zapatos').insert({
                nombre: formData.name,
                descripcion: formData.description,
                precio: parseFloat(formData.price),
                categoria: formData.category,
                tallas: sizeArray,
                etiquetas: formData.tags,
                url_imagen: publicUrlData.publicUrl,
                disponible: true
            })
            if (dbError) throw dbError

            onSuccess()
            onClose()
            // Limpiar formulario
            setFormData({ name: '', price: '', category: 'adulto', description: '', sizes: '', tags: [] })
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
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b bg-gray-50">
                    <h2 className="text-xl font-bold">Agregar Nuevo Zapato</h2>
                    <button onClick={onClose}><X className="text-gray-500" size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <input required type="text" placeholder="Nombre Modelo" className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            <div className="flex gap-2">
                                <input required type="number" placeholder="Precio" className="w-full border p-2 rounded" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                <select className="border p-2 rounded" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option value="adulto">Adulto</option><option value="niño">Niño</option><option value="deportivo">Deportivo</option>
                                </select>
                            </div>
                            <input type="text" placeholder="Tallas (ej: 40, 42)" className="w-full border p-2 rounded" value={formData.sizes} onChange={e => setFormData({ ...formData, sizes: e.target.value })} />
                            <div className="flex gap-4 text-sm">
                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.tags.includes('nuevo')} onChange={() => handleTagChange('nuevo')} /> Nuevo</label>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.tags.includes('mas_vendido')} onChange={() => handleTagChange('mas_vendido')} /> Más Vendido</label>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="border-2 border-dashed h-32 flex items-center justify-center relative cursor-pointer hover:bg-gray-50 transition">
                                {imagePreview ? <img src={imagePreview} className="h-full object-contain" /> : <Upload className="text-gray-400" />}
                                <input type="file" required className="absolute inset-0 opacity-0" onChange={handleImageChange} />
                            </div>
                            <textarea placeholder="Descripción" className="w-full border p-2 rounded" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 flex justify-center items-center gap-2">
                        {loading && <Loader2 className="animate-spin" size={18} />} Guardar
                    </button>
                </form>
            </div>
        </div>
    )
}
