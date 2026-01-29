'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import QuickViewModal from '@/components/QuickViewModal'
import { Filter, X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react'

interface CatalogViewProps {
    initialProducts: any[]
    availCategorias: any[]
    availSubcategorias: any[]
    availMarcas: any[]
}

export default function CatalogView({ initialProducts, availCategorias, availSubcategorias, availMarcas }: CatalogViewProps) {
    const searchParams = useSearchParams()

    // Filtros
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([])
    const [selectedBrands, setSelectedBrands] = useState<string[]>([])
    const [selectedGenders, setSelectedGenders] = useState<string[]>([])
    const [selectedGroups, setSelectedGroups] = useState<string[]>([])
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
    const [isGenderOpen, setIsGenderOpen] = useState(true)
    const [isGroupOpen, setIsGroupOpen] = useState(true)

    // Leer parámetros de URL al cargar y auto-seleccionar categorías
    useEffect(() => {
        const marcaParam = searchParams.get('marca')

        if (marcaParam) {
            setSelectedBrands([marcaParam])
        }
    }, [searchParams])

    // Filtros desde DB PROPS (Ya no derivados)
    const CATEGORIAS = useMemo(() => {
        if (!availCategorias || availCategorias.length === 0) return []
        return availCategorias.map(c => ({
            label: c.nombre,
            value: c.nombre // Usamos el nombre real para filtrar (ej: "Deportivo")
        }))
    }, [availCategorias])

    const SUBCATEGORIAS = useMemo(() => {
        if (!availSubcategorias || availSubcategorias.length === 0) return []
        return availSubcategorias.map(s => ({
            label: s.nombre,
            value: s.nombre,
            catRel: s.categoria_relacionada
        }))
    }, [availSubcategorias])

    // Marcas desde DB
    const MARCAS = useMemo(() => {
        if (!availMarcas || availMarcas.length === 0) return []
        return availMarcas.map(m => m.nombre)
    }, [availMarcas])

    // Nuevos filtros fijos
    const GENDER_OPTIONS = [
        { label: 'Hombre', value: 'Hombre' }, // Capitalizado para match exacto si se guarda así
        { label: 'Mujer', value: 'Mujer' },
        { label: 'Unisex', value: 'Unisex' }
    ]

    const GROUP_OPTIONS = [
        { label: 'Niño', value: 'Niño' },
        { label: 'Juvenil', value: 'Juvenil' },
        { label: 'Adulto', value: 'Adulto' }
    ]

    const [searchQuery, setSearchQuery] = useState('')

    // Lógica de Filtrado
    const filteredProducts = useMemo(() => {
        let result = [...initialProducts]

        // 0. Búsqueda por Texto (Search Bar) - NUEVO
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim()
            result = result.filter(p =>
                p.nombre.toLowerCase().includes(query) ||
                p.marca?.toLowerCase().includes(query) ||
                p.categoria?.toLowerCase().includes(query)
            )
        }

        // 1. Categoría
        if (selectedCategories.length > 0) {
            result = result.filter(p => selectedCategories.some(cat => p.categoria.toLowerCase().includes(cat.toLowerCase())))
        }

        // 2. Subcategoría
        if (selectedSubcategories.length > 0) {
            result = result.filter(p => p.subcategoria && selectedSubcategories.some(sub => p.subcategoria.toLowerCase().includes(sub.toLowerCase())))
        }

        // 3. Género (Nuevo)
        if (selectedGenders.length > 0) {
            result = result.filter(p => p.genero && selectedGenders.some(Gen => p.genero.toLowerCase() === Gen.toLowerCase()))
        }

        // 4. Grupo/Edad (Nuevo)
        if (selectedGroups.length > 0) {
            result = result.filter(p => p.grupo_talla && selectedGroups.some(grp => p.grupo_talla.toLowerCase() === grp.toLowerCase()))
        }

        // 5. Marca (case-insensitive)
        if (selectedBrands.length > 0) {
            result = result.filter(p =>
                p.marca && selectedBrands.some(brand =>
                    brand.toLowerCase() === p.marca.toLowerCase()
                )
            )
        }

        // 6. Precio (ELIMINADO)
        // result = result.filter(p => p.precio >= priceRange[0] && p.precio <= priceRange[1])

        // 7. Ordenamiento
        if (sortBy === 'precio_asc') {
            result.sort((a, b) => a.precio - b.precio)
        } else if (sortBy === 'precio_desc') {
            result.sort((a, b) => b.precio - a.precio)
        }
        // 'recientes' ya viene ordenado del servidor por fecha descendente

        return result
    }, [initialProducts, searchQuery, selectedCategories, selectedSubcategories, selectedBrands, selectedGenders, selectedGroups, priceRange, sortBy])

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

    const toggleGender = (val: string) => {
        setSelectedGenders(prev =>
            prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
        )
    }

    const toggleGroup = (val: string) => {
        setSelectedGroups(prev =>
            prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
        )
    }

    const clearFilters = () => {
        setSelectedCategories([])
        setSelectedSubcategories([])
        setSelectedBrands([])
        setSelectedGenders([])
        setSelectedGroups([])
        setPriceRange([0, 1000])
        setSortBy('recientes')
    }

    return (
        <section className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8">

                {/* Mobile Filter Trigger */}
                <button
                    onClick={() => setIsMobileFilterOpen(true)}
                    className="lg:hidden w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-colors"
                >
                    <SlidersHorizontal size={18} /> Filtros y Ordenar
                </button>

                {/* Sidebar Filtros (Desktop: Static | Mobile: Fixed Overlay) */}
                <aside className={`
                    fixed inset-0 z-50 bg-white dark:bg-slate-950 lg:bg-transparent lg:static lg:z-auto lg:w-64 lg:block
                    transition-transform duration-300 ease-in-out
                    ${isMobileFilterOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    overflow-y-auto
                `}>
                    <div className="p-6 lg:p-0">
                        <div className="flex justify-between items-center lg:hidden mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Filtros</h2>
                            <button onClick={() => setIsMobileFilterOpen(false)} className="dark:text-white"><X size={24} /></button>
                        </div>

                        {/* Contenedor de Filtros (Sticky en Desktop) */}
                        <div className="lg:sticky lg:top-24 space-y-6">

                            {/* Header Filtros Desktop */}
                            <div className="hidden lg:flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                                    <Filter size={20} /> Filtros
                                </h3>
                                {(selectedCategories.length > 0 || selectedGenders.length > 0 || selectedGroups.length > 0 || selectedBrands.length > 0) && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-xs text-red-500 font-bold hover:underline"
                                    >
                                        Limpiar
                                    </button>
                                )}
                            </div>

                            {/* Filtro Categorías */}
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                                <button
                                    className="w-full flex justify-between items-center mb-3 font-bold text-slate-800 dark:text-slate-200"
                                    onClick={() => setIsCatOpen(!isCatOpen)}
                                >
                                    Categorías
                                    {isCatOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {isCatOpen && (
                                    <div className="space-y-2 animate-fade-in">
                                        {CATEGORIAS.map(cat => (
                                            <label key={cat.value} className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="peer h-5 w-5 border-2 border-slate-300 dark:border-slate-600 rounded checked:bg-orange-500 checked:border-orange-500 focus:ring-orange-200 dark:focus:ring-orange-900 transition-all cursor-pointer appearance-none"
                                                        checked={selectedCategories.includes(cat.value)}
                                                        onChange={() => toggleCategory(cat.value)}
                                                    />
                                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                    </div>
                                                </div>
                                                <span className={`text-sm ${selectedCategories.includes(cat.value) ? 'font-bold text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                    {cat.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Filtro Subcategorías */}
                            {SUBCATEGORIAS.length > 0 && (
                                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                                    <button
                                        className="w-full flex justify-between items-center mb-3 font-bold text-slate-800 dark:text-slate-200"
                                        onClick={() => setIsSubcatOpen(!isSubcatOpen)}
                                    >
                                        Tipos de Planta
                                        {isSubcatOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>

                                    {isSubcatOpen && (
                                        <div className="space-y-2 animate-fade-in">
                                            {SUBCATEGORIAS
                                                .filter(sub => selectedCategories.length === 0 || !sub.catRel || selectedCategories.some(c => c.toLowerCase() === sub.catRel?.toLowerCase()))
                                                .map(sub => (
                                                    <label key={sub.value} className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors">
                                                        <div className="relative flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                className="peer h-5 w-5 border-2 border-slate-300 dark:border-slate-600 rounded checked:bg-orange-500 checked:border-orange-500 focus:ring-orange-200 dark:focus:ring-orange-900 transition-all cursor-pointer appearance-none"
                                                                checked={selectedSubcategories.includes(sub.value)}
                                                                onChange={() => toggleSubcategory(sub.value)}
                                                            />
                                                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                            </div>
                                                        </div>
                                                        <span className={`text-sm ${selectedSubcategories.includes(sub.value) ? 'font-bold text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                            {sub.label}
                                                        </span>
                                                    </label>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* NUEVO: Filtro Género */}
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                                <button
                                    className="w-full flex justify-between items-center mb-3 font-bold text-slate-800 dark:text-slate-200"
                                    onClick={() => setIsGenderOpen(!isGenderOpen)}
                                >
                                    Género
                                    {isGenderOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {isGenderOpen && (
                                    <div className="space-y-2 animate-fade-in">
                                        {GENDER_OPTIONS.map(opt => (
                                            <label key={opt.value} className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="peer h-5 w-5 border-2 border-slate-300 dark:border-slate-600 rounded checked:bg-orange-500 checked:border-orange-500 focus:ring-orange-200 dark:focus:ring-orange-900 transition-all cursor-pointer appearance-none"
                                                        checked={selectedGenders.includes(opt.value)}
                                                        onChange={() => toggleGender(opt.value)}
                                                    />
                                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                    </div>
                                                </div>
                                                <span className={`text-sm ${selectedGenders.includes(opt.value) ? 'font-bold text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                    {opt.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* NUEVO: Filtro Grupo/Talla (Niño/Joven/Adulto) */}
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                                <button
                                    className="w-full flex justify-between items-center mb-3 font-bold text-slate-800 dark:text-slate-200"
                                    onClick={() => setIsGroupOpen(!isGroupOpen)}
                                >
                                    Grupo
                                    {isGroupOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {isGroupOpen && (
                                    <div className="space-y-2 animate-fade-in">
                                        {GROUP_OPTIONS.map(opt => (
                                            <label key={opt.value} className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="peer h-5 w-5 border-2 border-slate-300 dark:border-slate-600 rounded checked:bg-orange-500 checked:border-orange-500 focus:ring-orange-200 dark:focus:ring-orange-900 transition-all cursor-pointer appearance-none"
                                                        checked={selectedGroups.includes(opt.value)}
                                                        onChange={() => toggleGroup(opt.value)}
                                                    />
                                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                    </div>
                                                </div>
                                                <span className={`text-sm ${selectedGroups.includes(opt.value) ? 'font-bold text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                    {opt.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Filtro Marcas */}
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                                <button
                                    className="w-full flex justify-between items-center mb-3 font-bold text-slate-800 dark:text-slate-200"
                                    onClick={() => setIsBrandOpen(!isBrandOpen)}
                                >
                                    Marcas
                                    {isBrandOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {isBrandOpen && (
                                    <div className="space-y-2 animate-fade-in">
                                        {MARCAS.map((marca: string) => (
                                            <label key={marca} className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="peer h-5 w-5 border-2 border-slate-300 dark:border-slate-600 rounded checked:bg-orange-500 checked:border-orange-500 focus:ring-orange-200 dark:focus:ring-orange-900 transition-all cursor-pointer appearance-none"
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
                                                <span className={`text-sm ${selectedBrands.some(b => b.toLowerCase() === marca.toLowerCase()) ? 'font-bold text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
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
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white hidden md:block">
                            Resultados <span className="text-slate-400 dark:text-slate-500 font-normal">({filteredProducts.length})</span>
                        </h2>

                        {/* Search Bar - NUEVO */}
                        <div className="relative w-full sm:max-w-md mx-6">
                            <input
                                type="text"
                                placeholder="Buscar modelo, marca o estilo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange outline-none transition-all"
                            />
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 hidden lg:block">Ordenar:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900 outline-none cursor-pointer"
                            >
                                <option value="recientes">Más Recientes</option>
                                {/* Opciones de precio eliminadas por solicitud */}
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
                        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <Filter className="text-slate-300 dark:text-slate-500" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">No encontramos resultados</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Prueba ajustando los filtros de búsqueda</p>
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
