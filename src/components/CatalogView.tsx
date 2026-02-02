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

    // Mapa de IDs de Marcas a Nombres (Para reparar desincronización)
    const brandIdToName = useMemo(() => {
        const map: Record<number, string> = {}
        if (availMarcas) {
            availMarcas.forEach(m => {
                if (m.id && m.nombre) {
                    map[m.id] = m.nombre.trim().toLowerCase()
                }
            })
        }
        return map
    }, [availMarcas])

    // Lógica de Filtrado
    const filteredProducts = useMemo(() => {
        let result = [...initialProducts]

        // 0. Búsqueda por Texto
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

        // 3. Género (Lógica Inteligente)
        if (selectedGenders.length > 0) {
            result = result.filter(p => {
                const pGen = p.genero ? p.genero.trim().toLowerCase() : '';
                return selectedGenders.some(selected => {
                    const sGen = selected.trim().toLowerCase();
                    if (pGen === sGen) return true;
                    if (pGen === 'unisex' && (sGen === 'hombre' || sGen === 'mujer')) return true;
                    return false;
                });
            });
        }

        // 4. Grupo
        if (selectedGroups.length > 0) {
            // A veces grupo_talla puede ser null
            result = result.filter(p => p.grupo_talla && selectedGroups.some(grp => p.grupo_talla.trim().toLowerCase() === grp.trim().toLowerCase()))
        }

        // 5. Marca (Robustez Extrema: Origen, String, ID, o Fallback)
        if (selectedBrands.length > 0) {
            result = result.filter(p =>
                selectedBrands.some(brand => {
                    const brandClean = brand.trim().toLowerCase()

                    // 1. Chequeo por Campo 'origen' (Visto en DB del usuario)
                    if (p.origen && p.origen.trim().toLowerCase() === brandClean) return true

                    // 2. Chequeo Directo (Campo 'marca')
                    if (p.marca && p.marca.trim().toLowerCase() === brandClean) return true

                    // 3. Coincidencia por ID (Si 'marca' string está vacío pero 'marca_id' existe)
                    if (p.marca_id) {
                        const brandObjName = brandIdToName[p.marca_id]
                        if (brandObjName === brandClean) return true
                    }

                    // 4. Fallback: Nombre del producto
                    if (p.nombre && p.nombre.toLowerCase().includes(brandClean)) return true

                    // 5. Fix específico para typos comunes en el nombre (Gracep vs Grasep)
                    if ((brandClean === 'grasep' || brandClean === 'gracep') && p.nombre.toLowerCase().includes('gra')) {
                        if (p.nombre.toLowerCase().includes('gracep') || p.nombre.toLowerCase().includes('grasep')) return true
                    }

                    return false
                })
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
    }, [initialProducts, searchQuery, selectedCategories, selectedSubcategories, selectedBrands, selectedGenders, selectedGroups, priceRange, sortBy, brandIdToName])

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
        <section className="min-h-screen">
            {/* --- MOBILE/DESKTOP HEADER DINÁMICO --- */}
            <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">

                    {/* 1. BARRA DE BÚSQUEDA + ORDENAR */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Buscar zapatillas, botas..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:bg-white dark:focus:bg-slate-950 focus:border-brand-orange text-sm font-medium text-slate-900 dark:text-white transition-all outline-none"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <X size={14} />
                                </button>
                            )}
                        </div>


                    </div>

                    {/* 2. FILTROS RÁPIDOS (SCROLL HORIZONTAL) */}
                    <div className="flex flex-col gap-3 py-2">

                        {/* Fila 1: Filtros Principales (Géreno, Grupo, Categoría) */}
                        {/* Fila 1: Filtros Agrupados (Estilo Personalizado: Rojo, Naranja, Monocromo) */}
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-1 items-center">

                            {/* GRUPO 1: TOD0 + GÉNERO (Rojo Pálido) */}
                            <div className="flex items-center p-0.5 rounded-full bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-500/20 flex-shrink-0 relative overflow-hidden group">
                                <button
                                    onClick={clearFilters}
                                    className={`relative z-10 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300 ${selectedCategories.length === 0 && selectedGenders.length === 0 && selectedBrands.length === 0 && selectedGroups.length === 0
                                        ? 'bg-red-500 text-white shadow-sm'
                                        : 'text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-white hover:bg-red-100 dark:hover:bg-red-500/10'
                                        }`}
                                >
                                    Todo
                                </button>
                                {GENDER_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => toggleGender(opt.value)}
                                        className={`relative z-10 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300 ${selectedGenders.includes(opt.value)
                                            ? 'bg-red-500 text-white shadow-sm'
                                            : 'text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-white hover:bg-red-100 dark:hover:bg-red-500/10'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* GRUPO 2: EDAD / GRUPO (Naranja / Transparente) */}
                            <div className="flex items-center p-0.5 rounded-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex-shrink-0 relative overflow-hidden group">
                                {GROUP_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => toggleGroup(opt.value)}
                                        className={`relative z-10 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300 ${selectedGroups.includes(opt.value)
                                            ? 'bg-orange-500 text-white shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* GRUPO 3: CATEGORÍA (Negro / Blanco / Transparente) */}
                            <div className="flex items-center p-0.5 rounded-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex-shrink-0 relative overflow-hidden group">
                                {CATEGORIAS.slice(0, 8).map(cat => (
                                    <button
                                        key={cat.value}
                                        onClick={() => toggleCategory(cat.value)}
                                        className={`relative z-10 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300 ${selectedCategories.includes(cat.value)
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'
                                            }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>

                            {/* GRUPO 4: TIPO DE PLANTA (Solo si es Deportivo) */}
                            {selectedCategories.some(c => c.toLowerCase() === 'deportivo') && SUBCATEGORIAS.some(s => s.catRel?.toLowerCase() === 'deportivo') && (
                                <div className="flex items-center p-0.5 rounded-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex-shrink-0 relative overflow-hidden group animate-fade-in-left">
                                    <span className="pl-3 pr-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        Planta:
                                    </span>
                                    {SUBCATEGORIAS
                                        .filter(s => s.catRel?.toLowerCase() === 'deportivo')
                                        .map(sub => (
                                            <button
                                                key={sub.value}
                                                onClick={() => toggleSubcategory(sub.value)}
                                                className={`relative z-10 px-3 py-1.5 my-0.5 mr-1 rounded-full text-[11px] font-bold transition-all duration-300 ${selectedSubcategories.includes(sub.value)
                                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'
                                                    }`}
                                            >
                                                {sub.label}
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>

                        {/* Fila 2: Marcas (Estilo Naranja Pálido) */}
                        {/* Fila 2: Marcas (Estilo Burbuja Contenida) */}
                        <div className="overflow-x-auto scrollbar-hide px-4 py-1">
                            <div className="flex items-center p-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-max">
                                {MARCAS.map(marca => (
                                    <button
                                        key={marca}
                                        onClick={() => {
                                            if (selectedBrands.includes(marca)) {
                                                setSelectedBrands(prev => prev.filter(b => b !== marca))
                                            } else {
                                                setSelectedBrands(prev => [...prev, marca])
                                            }
                                        }}
                                        className={`px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all ${selectedBrands.includes(marca)
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                    >
                                        {marca}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL */}
            <div className="max-w-7xl mx-auto px-2 py-6">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* (Sidebar de Filtros PC eliminado visualmente en móvil, mantenemos lógica si se quiere expandir en PC, pero por ahora oculto/simplificado) */}

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Header Resultados Simple */}
                        {filteredProducts.length > 0 && (
                            <div className="mb-4 px-2 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    {filteredProducts.length} Estilos Encontrados
                                </span>
                            </div>
                        )}


                        {/* Grid de Productos - Mobile 2 Columns Forced */}
                        {filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-x-3 gap-y-6 md:gap-6">
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
            </div>
        </section>
    )
}
