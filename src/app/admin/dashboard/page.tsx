'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    Package,
    Tags,
    Image,
    LogOut,
    TrendingUp,
    Eye,
    ArrowUpRight,
    Sparkles,
    Clock,
    CheckCircle2,
    BarChart3,
    Layers,
    Users,
    Ruler
} from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts'

export default function AdminDashboard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalProductos: 0,
        productosActivos: 0,
        categorias: 0,
        productosNuevos: 0
    })
    const [chartData, setChartData] = useState<any[]>([])

    // Colores para gráficos
    const COLORS = ['#C7F000', '#1A1A1A', '#525252', '#9ca3af', '#d1d5db'];

    useEffect(() => {
        checkAuth()
        loadStats()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/admin/login')
        }
        setLoading(false)
    }

    const loadStats = async () => {
        const { count: totalProductos } = await supabase
            .from('zapatos')
            .select('*', { count: 'exact', head: true })

        const { count: productosActivos } = await supabase
            .from('zapatos')
            .select('*', { count: 'exact', head: true })
            .eq('disponible', true)

        const { data: categoriasData } = await supabase
            .from('zapatos')
            .select('categoria')

        // Procesar datos para el gráfico
        let catMap: { [key: string]: number } = {};
        if (categoriasData) {
            categoriasData.forEach((item: any) => {
                const cat = item.categoria || 'Sin Categoría';
                catMap[cat] = (catMap[cat] || 0) + 1;
            });
        }

        const formattedChartData = Object.keys(catMap).map(key => ({
            name: key,
            cantidad: catMap[key]
        })).sort((a, b) => b.cantidad - a.cantidad); // Ordenar por mayor cantidad

        setChartData(formattedChartData);

        const categoriasUnicas = new Set(categoriasData?.map((p: any) => p.categoria))

        const hace7Dias = new Date()
        hace7Dias.setDate(hace7Dias.getDate() - 7)

        const { count: productosNuevos } = await supabase
            .from('zapatos')
            .select('*', { count: 'exact', head: true })
            .gte('fecha_creacion', hace7Dias.toISOString())

        setStats({
            totalProductos: totalProductos || 0,
            productosActivos: productosActivos || 0,
            categorias: categoriasUnicas.size,
            productosNuevos: productosNuevos || 0
        })
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/admin/login')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-camo-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-neon-500 mx-auto"></div>
                    <p className="mt-4 text-brand-black font-bold tracking-wider">CARGANDO PANEL...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative font-sans transition-colors duration-300">
            {/* Background Image Fixed - Reusing the split background from login for consistency if requested, or just clean background */}
            {/* User asked for "con el unico logo de fondo que te pedi" -> likely wanting the same bg as login available here or subtle branding */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-5">
                <div className="absolute inset-0 bg-[url('/admin-bg-split.png')] bg-cover bg-center mix-blend-overlay"></div>
            </div>

            {/* Navbar Admin Pro */}
            <nav className="bg-black dark:bg-slate-900 text-white shadow-xl sticky top-0 z-50 border-b border-white/10 dark:border-slate-800 backdrop-blur-md bg-opacity-95 transition-colors">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="relative w-10 h-10">
                                {/* Small Logo Icon */}
                                <img src="/logo.png" className="object-contain w-full h-full invert" alt="Logo" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight leading-none text-white">
                                    ACTIVA <span className="text-brand-orange">SPORT</span>
                                </h1>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Panel de Control</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link href="/">
                                <button className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg font-bold transition-all flex items-center gap-2 text-xs uppercase tracking-wide">
                                    <Eye size={16} />
                                    <span className="hidden md:inline">Ver Tienda</span>
                                </button>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white rounded-lg font-bold transition-all flex items-center gap-2 text-xs uppercase tracking-wide shadow-lg shadow-brand-orange/20"
                            >
                                <LogOut size={16} />
                                <span className="hidden md:inline">Salir</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
                {/* Header Welcome */}
                <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <LayoutDashboard className="text-brand-orange" size={28} />
                            <h2 className="text-3xl font-black text-black dark:text-white uppercase tracking-tight">Dashboard</h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Bienvenido al sistema de gestión.</p>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 px-4 rounded-full shadow-sm">
                            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* KPI Cards - Estilo Clean Tech */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {/* Total Productos */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 group hover:-translate-y-1 transition-all relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-3 bg-black dark:bg-slate-800 rounded-xl text-brand-orange shadow-lg shadow-black/20">
                                <Package size={24} />
                            </div>
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total</span>
                        </div>
                        <h3 className="text-4xl font-black text-black dark:text-white mb-1 relative z-10">{stats.totalProductos}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium relative z-10">Productos registrados</p>

                        {/* Decorative Icon BG */}
                        <Package className="absolute -bottom-4 -right-4 text-slate-50 dark:text-slate-800 opacity-50 transform rotate-12" size={100} />
                    </div>

                    {/* Activos */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 group hover:-translate-y-1 transition-all relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-3 bg-green-500 rounded-xl text-white shadow-lg shadow-green-500/20">
                                <CheckCircle2 size={24} />
                            </div>
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Activos</span>
                        </div>
                        <h3 className="text-4xl font-black text-black dark:text-white mb-1 relative z-10">{stats.productosActivos}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium relative z-10">Disponibles en tienda</p>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden relative z-10">
                            <div className="bg-green-500 h-full rounded-full" style={{ width: `${stats.totalProductos > 0 ? (stats.productosActivos / stats.totalProductos) * 100 : 0}%` }}></div>
                        </div>
                    </div>

                    {/* Categorias */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 group hover:-translate-y-1 transition-all relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
                                <Tags size={24} />
                            </div>
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Categorías</span>
                        </div>
                        <h3 className="text-4xl font-black text-black dark:text-white mb-1 relative z-10">{stats.categorias}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium relative z-10">Secciones activas</p>
                    </div>

                    {/* Nuevos */}
                    <div className="bg-brand-orange text-white rounded-2xl p-6 shadow-xl shadow-brand-orange/20 group hover:-translate-y-1 transition-all relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-3 bg-black/20 rounded-xl text-white backdrop-blur-sm">
                                <Clock size={24} />
                            </div>
                            <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Nuevos</span>
                        </div>
                        <h3 className="text-4xl font-black text-white mb-1 relative z-10">{stats.productosNuevos}</h3>
                        <p className="text-white/80 text-sm font-medium relative z-10">Esta semana</p>

                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    </div>
                </div>

                {/* GRAPH SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 transition-colors">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                                <BarChart3 className="text-brand-orange" size={20} />
                                Inventario por Categoría
                            </h3>
                        </div>
                        <div className="w-full" style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', backgroundColor: '#1e293b', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="cantidad" radius={[6, 6, 0, 0]} barSize={40}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#ff5722' : '#1e1e1e'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Actions Panel */}
                    <div className="bg-black dark:bg-slate-900 text-white rounded-2xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between transition-colors">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange rounded-full blur-[100px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>

                        <div>
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Sparkles className="text-brand-orange" size={20} />
                                Acciones Rápidas
                            </h3>

                            <div className="space-y-3">
                                {/* NUEVO: Gestión de Pedidos - Prioridad Alta */}
                                <Link href="/admin/pedidos" className="flex items-center gap-4 p-4 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 transition-all group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors"></div>
                                    <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/20 z-10">
                                        <Package size={20} />
                                    </div>
                                    <div className="z-10">
                                        <h4 className="font-bold text-sm text-green-400 group-hover:text-green-300">PEDIDOS Y VENTAS</h4>
                                        <p className="text-xs text-gray-400 group-hover:text-white transition-colors">Ver pedidos recibidos</p>
                                    </div>
                                    <ArrowUpRight className="ml-auto text-green-500 group-hover:text-green-300 transition-colors z-10" size={16} />
                                </Link>

                                <Link href="/admin/productos" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                                    <div className="w-10 h-10 rounded-lg bg-brand-orange flex items-center justify-center text-white shadow-lg shadow-brand-orange/20">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">Gestionar Productos</h4>
                                        <p className="text-xs text-gray-400 group-hover:text-white transition-colors">Inventario completo</p>
                                    </div>
                                    <ArrowUpRight className="ml-auto text-gray-600 group-hover:text-white transition-colors" size={16} />
                                </Link>

                                <Link href="/admin/categorias" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                                        <Tags size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">Categorías</h4>
                                        <p className="text-xs text-gray-400 group-hover:text-white transition-colors">Organizar catálogo</p>
                                    </div>
                                    <ArrowUpRight className="ml-auto text-gray-600 group-hover:text-white transition-colors" size={16} />
                                </Link>

                                <Link href="/admin/subcategorias" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                        <Layers size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">Tipos de Planta</h4>
                                        <p className="text-xs text-gray-400 group-hover:text-white transition-colors">Subcategorías</p>
                                    </div>
                                    <ArrowUpRight className="ml-auto text-gray-600 group-hover:text-white transition-colors" size={16} />
                                </Link>

                                <Link href="/admin/marcas" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                                    <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-white shadow-lg shadow-green-600/20">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">Marcas</h4>
                                        <p className="text-xs text-gray-400 group-hover:text-white transition-colors">Gestión de Marcas</p>
                                    </div>
                                    <ArrowUpRight className="ml-auto text-gray-600 group-hover:text-white transition-colors" size={16} />
                                </Link>

                                <Link href="/admin/generos" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                                    <div className="w-10 h-10 rounded-lg bg-pink-600 flex items-center justify-center text-white shadow-lg shadow-pink-600/20">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">Géneros</h4>
                                        <p className="text-xs text-gray-400 group-hover:text-white transition-colors">Hombre/Mujer...</p>
                                    </div>
                                    <ArrowUpRight className="ml-auto text-gray-600 group-hover:text-white transition-colors" size={16} />
                                </Link>

                                <Link href="/admin/grupos" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                                    <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
                                        <Ruler size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">Grupos de Talla</h4>
                                        <p className="text-xs text-gray-400 group-hover:text-white transition-colors">Niño/Adulto...</p>
                                    </div>
                                    <ArrowUpRight className="ml-auto text-gray-600 group-hover:text-white transition-colors" size={16} />
                                </Link>

                                <Link href="/admin/promociones" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                                    <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">Promociones</h4>
                                        <p className="text-xs text-gray-400 group-hover:text-white transition-colors">Ofertas y campañas</p>
                                    </div>
                                    <ArrowUpRight className="ml-auto text-gray-600 group-hover:text-white transition-colors" size={16} />
                                </Link>

                                <Link href="/admin/portada" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                                    <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
                                        <Image size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">Portada Web</h4>
                                        <p className="text-xs text-gray-400 group-hover:text-white transition-colors">Banner principal</p>
                                    </div>
                                    <ArrowUpRight className="ml-auto text-gray-600 group-hover:text-white transition-colors" size={16} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
