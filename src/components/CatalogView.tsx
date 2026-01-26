'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import QuickViewModal from '@/components/QuickViewModal'
import { Filter, X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react'

interface CatalogViewProps {
    initialProducts: any[]
}

export default function CatalogView({ initialProducts }: CatalogViewProps) {
    const searchParams = useSearchParams()

    // Filtros
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([])
    const [selectedBrands, setSelectedBrands] = useState<string[]>([])
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
    const [sortBy, setSortBy] = useState('recientes')
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

    // Estados Quick View
    const [quickViewProduct, setQuickViewProduct] = useState<any>(null)
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)

    // Expandir/Colapsar secciones
    const [isCatOpen, setIsCatOpen] = useState(true)
    const [isSubcatOpen, setIsSubcatOpen] = useState(true)
    const [isBrandOpen, setIsBrandOpen] = useState(true)
    const [isPriceOpen, setIsPriceOpen] = useState(true)

    // Leer parámetros de URL al cargar y auto-seleccionar categorías
    useEffect(() => {
        const marcaParam = searchParams.get('marca')

        if (marcaParam) {
            setSelectedBrands([marcaParam])

            // Auto-seleccionar categorías de productos con esta marca
            const productosConMarca = initialProducts.filter(p =>
                p.marca && p.marca.toLowerCase() === marcaParam.toLowerCase()
            )

            const categoriasDeProductos = Array.from(new Set(
                productosConMarca.map(p => p.categoria?.toLowerCase()).filter(Boolean)
            ))

            setSelectedCategories(categoriasDeProductos as string[])

            // Auto-seleccionar subcategorías también
            const subcategoriasDeProductos = Array.from(new Set(
                productosConMarca.map(p => p.subcategoria?.toLowerCase()).filter(Boolean)
            ))

            if (subcategoriasDeProductos.length > 0) {
                setSelectedSubcategories(subcategoriasDeProductos as string[])
            }
        }
    }, [searchParams, initialProducts])

    // Generar categorías dinámicamente desde los productos
    const CATEGORIAS = useMemo(() => {
        const categoriasUnicas = Array.from(new Set(initialProducts.map(p => p.categoria).filter(Boolean)))
        return categoriasUnicas.map(cat => ({
            label: cat.charAt(0).toUpperCase() + cat.slice(1),
            value: cat.toLowerCase()
        }))
    }, [initialProducts])

    // Generar subcategorías dinámicamente
    const SUBCATEGORIAS = useMemo(() => {
        const subcategoriasUnicas = Array.from(new Set(initialProducts.map(p => p.subcategoria).filter(Boolean)))
        return subcategoriasUnicas.map(sub => ({
            label: sub.charAt(0).toUpperCase() + sub.slice(1),
            value: sub.toLowerCase()
        }))
    }, [initialProducts])

    // Generar marcas disponibles desde TODOS los productos
    const availableBrands = useMemo(() => {
        return Array.from(new Set(initialProducts.map(p => p.marca).filter(Boolean))).sort()
    }, [initialProducts])

    // Lógica de Filtrado
    const filteredProducts = useMemo(() => {
        let result = [...initialProducts]

        // 1. Categoría
        if (selectedCategories.length > 0) {
            result = result.filter(p => selectedCategories.some(cat => p.categoria.toLowerCase().includes(cat.toLowerCase())))
        }

        // 2. Subcategoría
        if (selectedSubcategories.length > 0) {
            result = result.filter(p => p.subcategoria && selectedSubcategories.some(sub => p.subcategoria.toLowerCase().includes(sub.toLowerCase())))
        }

        // 3. Marca (case-insensitive)
        if (selectedBrands.length > 0) {
            result = result.filter(p =>
                p.marca && selectedBrands.some(brand =>
                    brand.toLowerCase() === p.marca.toLowerCase()
                )
            )
        }

        // 4. Precio
        result = result.filter(p => p.precio >= priceRange[0] && p.precio <= priceRange[1])

        // 5. Ordenamiento
        if (sortBy === 'precio_asc') {
            result.sort((a, b) => a.precio - b.precio)
        } else if (sortBy === 'precio_desc') {
            result.sort((a, b) => b.precio - a.precio)
        }
        // 'recientes' ya viene ordenado del servidor por fecha descendente

        return result
    }, [initialProducts, selectedCategories, selectedSubcategories, selectedBrands, priceRange, sortBy])

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        )
    }

    const toggleSubcategory = (sub: string) => {
        setSelectedSubcategories(prev =>
            prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
        )
    }

    const clearFilters = () => {
        setSelectedCategories([])
        setSelectedSubcategories([])
        setSelectedBrands([])
        setPriceRange([0, 1000])
        setSortBy('recientes')
    }

    return (
        <section className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8">

                {/* Mobile Filter Trigger */}
                <button
                    onClick={() => setIsMobileFilterOpen(true)}
                    className="lg:hidden w-full flex items-center justify-center gap-2 bg-white border border-slate-200 p-3 rounded-xl font-bold text-slate-700 shadow-sm"
                >
                    <SlidersHorizontal size={18} /> Filtros y Ordenar
                </button>

                {/* Sidebar Filtros (Desktop: Static | Mobile: Fixed Overlay) */}
                <aside className={`
                    fixed inset-0 z-50 bg-white lg:bg-transparent lg:static lg:z-auto lg:w-64 lg:block
                    transition-transform duration-300 ease-in-out
                    ${isMobileFilterOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    overflow-y-auto
                `}>
                    <div className="p-6 lg:p-0">
                        <div className="flex justify-between items-center lg:hidden mb-6">
                            <h2 className="text-xl font-bold">Filtros</h2>
                            <button onClick={() => setIsMobileFilterOpen(false)}><X size={24} /></button>
                        </div>

                        {/* Contenedor de Filtros (Sticky en Desktop) */}
                        <div className="lg:sticky lg:top-24 space-y-6">

                            {/* Header Filtros Desktop */}
                            <div className="hidden lg:flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Filter size={20} /> Filtros
                                </h3>
                                {(selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < 1000) && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-xs text-red-500 font-bold hover:underline"
                                    >
                                        Limpiar
                                    </button>
                                )}
                            </div>

                            {/* Filtro Categorías */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                <button
                                    className="w-full flex justify-between items-center mb-3 font-bold text-slate-800"
                                    onClick={() => setIsCatOpen(!isCatOpen)}
                                >
                                    Categorías
                                    {isCatOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {isCatOpen && (
                                    <div className="space-y-2 animate-fade-in">
                                        {CATEGORIAS.map(cat => (
                                            <label key={cat.value} className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="peer h-5 w-5 border-2 border-slate-300 rounded checked:bg-orange-500 checked:border-orange-500 focus:ring-orange-200 transition-all cursor-pointer appearance-none"
                                                        checked={selectedCategories.includes(cat.value)}
                                                        onChange={() => toggleCategory(cat.value)}
                                                    />
                                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                    </div>
                                                </div>
                                                <span className={`text-sm ${selectedCategories.includes(cat.value) ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                                    {cat.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Filtro Subcategorías */}
                            {SUBCATEGORIAS.length > 0 && (
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <button
                                        className="w-full flex justify-between items-center mb-3 font-bold text-slate-800"
                                        onClick={() => setIsSubcatOpen(!isSubcatOpen)}
                                    >
                                        Subcategorías
                                        {isSubcatOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>

                                    {isSubcatOpen && (
                                        <div className="space-y-2 animate-fade-in">
                                            {SUBCATEGORIAS.map(sub => (
                                                <label key={sub.value} className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            className="peer h-5 w-5 border-2 border-slate-300 rounded checked:bg-orange-500 checked:border-orange-500 focus:ring-orange-200 transition-all cursor-pointer appearance-none"
                                                            checked={selectedSubcategories.includes(sub.value)}
                                                            onChange={() => toggleSubcategory(sub.value)}
                                                        />
                                                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                        </div>
                                                    </div>
                                                    <span className={`text-sm ${selectedSubcategories.includes(sub.value) ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                                        {sub.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Filtro Marcas */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                <button
                                    className="w-full flex justify-between items-center mb-3 font-bold text-slate-800"
                                    onClick={() => setIsBrandOpen(!isBrandOpen)}
                                >
                                    Marcas
                                    {isBrandOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {isBrandOpen && (
                                    <div className="space-y-2 animate-fade-in">
                                        {availableBrands.map((marca: any) => (
                                            <label key={marca} className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="peer h-5 w-5 border-2 border-slate-300 rounded checked:bg-orange-500 checked:border-orange-500 focus:ring-orange-200 transition-all cursor-pointer appearance-none"
                                                        checked={selectedBrands.some(b => b.toLowerCase() === marca.toLowerCase())}
                                                        onChange={() => {
                                                            const isSelected = selectedBrands.some(b => b.toLowerCase() === marca.toLowerCase())
                                                            if (isSelected) {
                                                                setSelectedBrands(prev => prev.filter(b => b.toLowerCase() !== marca.toLowerCase()))
                                                            } else {
                                                                setSelectedBrands(prev => [...prev, marca])
                                                            }
                                                        }}
                                                    />
                                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                    </div>
                                                </div>
                                                <span className={`text-sm ${selectedBrands.some(b => b.toLowerCase() === marca.toLowerCase()) ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                                    {marca}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1">
                    {/* Header Resultados y Ordenar */}
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold text-slate-900">
                            Resultados <span className="text-slate-400 font-normal">({filteredProducts.length})</span>
                        </h2>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-sm font-medium text-slate-500 hidden sm:block">Ordenar:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none cursor-pointer"
                            >
                                <option value="recientes">Más Recientes</option>
                                <option value="precio_asc">Precio: Menor a Mayor</option>
                                <option value="precio_desc">Precio: Mayor a Menor</option>
                            </select>
                        </div>
                    </div>

                    {/* Grid de Productos */}
                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                            {filteredProducts.map((zapato) => (
                                <ProductCard
                                    key={zapato.id}
                                    zapato={zapato}
                                    onQuickView={(p) => {
                                        setQuickViewProduct(p)
                                        setIsQuickViewOpen(true)
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Filter className="text-slate-300" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">No encontramos resultados</h3>
                            <p className="text-slate-500 mb-6 text-sm">Prueba ajustando los filtros de búsqueda</p>
                            <button
                                onClick={clearFilters}
                                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-orange-500/30"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick View Modal */}
            <QuickViewModal
                producto={quickViewProduct}
                isOpen={isQuickViewOpen}
                onClose={() => setIsQuickViewOpen(false)}
            />
        </section>
    )
}
