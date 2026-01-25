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
    BarChart3
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
        <div className="min-h-screen bg-camo-100 text-brand-black font-sans">
            {/* Navbar Admin Pro */}
            <nav className="bg-brand-black text-white shadow-xl sticky top-0 z-50 border-b border-neon-500/30">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-neon-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(199,240,0,0.3)]">
                                <span className="text-brand-black font-black text-xl italic tracking-tighter">IF</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight leading-none">
                                    PANEL <span className="text-neon-500">ADMIN</span>
                                </h1>
                                <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Importadora Fernández</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link href="/">
                                <button className="px-5 py-2.5 text-neon-500 hover:bg-white/5 border border-transparent hover:border-neon-500/30 rounded-lg font-bold transition-all flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <Eye size={18} />
                                    <span className="hidden md:inline">Ver Tienda</span>
                                </button>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all flex items-center gap-2 text-sm uppercase tracking-wide shadow-lg"
                            >
                                <LogOut size={18} />
                                <span className="hidden md:inline">Salir</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-10">
                {/* Header Welcome */}
                <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="text-neon-500" size={24} />
                            <h2 className="text-4xl font-black text-brand-black uppercase tracking-tight">Dashboard</h2>
                        </div>
                        <p className="text-slate-600 font-medium">Resumen general de rendimiento e inventario.</p>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-xs font-black text-neon-600 uppercase tracking-widest bg-brand-black/5 py-1 px-3 rounded-full">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>

                {/* KPI Cards - Estilo Tech */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {/* Total Productos */}
                    <div className="bg-brand-black text-white rounded-2xl p-1 relative overflow-hidden shadow-2xl group hover:-translate-y-1 transition-transform duration-300">
                        <div className="absolute top-0 left-0 w-full h-1 bg-neon-500"></div>
                        <div className="bg-[#2a2a2a] h-full rounded-xl p-6 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-brand-black rounded-lg border border-gray-700 text-neon-500">
                                    <Package size={24} />
                                </div>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total</span>
                            </div>
                            <h3 className="text-4xl font-black text-white mb-1 group-hover:text-neon-500 transition-colors">{stats.totalProductos}</h3>
                            <p className="text-gray-400 text-sm">Productos en inventario</p>
                        </div>
                        {/* Glow effect */}
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-neon-500/10 rounded-full blur-3xl group-hover:bg-neon-500/20 transition-all"></div>
                    </div>

                    {/* Activos */}
                    <div className="bg-white rounded-2xl p-1 relative overflow-hidden shadow-xl border border-gray-200 group hover:-translate-y-1 transition-transform duration-300">
                        <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                        <div className="bg-white h-full rounded-xl p-6 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-green-50 rounded-lg text-green-600">
                                    <CheckCircle2 size={24} />
                                </div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Activos</span>
                            </div>
                            <h3 className="text-4xl font-black text-brand-black mb-1">{stats.productosActivos}</h3>
                            <p className="text-gray-500 text-sm">Disponibles para venta</p>
                            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                                <div className="bg-green-500 h-full rounded-full" style={{ width: `${stats.totalProductos > 0 ? (stats.productosActivos / stats.totalProductos) * 100 : 0}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Categorias */}
                    <div className="bg-white rounded-2xl p-1 relative overflow-hidden shadow-xl border border-gray-200 group hover:-translate-y-1 transition-transform duration-300">
                        <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
                        <div className="bg-white h-full rounded-xl p-6 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                                    <Tags size={24} />
                                </div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Variedad</span>
                            </div>
                            <h3 className="text-4xl font-black text-brand-black mb-1">{stats.categorias}</h3>
                            <p className="text-gray-500 text-sm">Categorías activas</p>
                        </div>
                    </div>

                    {/* Nuevos */}
                    <div className="bg-brand-black text-white rounded-2xl p-1 relative overflow-hidden shadow-2xl group hover:-translate-y-1 transition-transform duration-300">
                        <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
                        <div className="bg-[#2a2a2a] h-full rounded-xl p-6 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-brand-black rounded-lg border border-gray-700 text-orange-500">
                                    <Clock size={24} />
                                </div>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recientes</span>
                            </div>
                            <h3 className="text-4xl font-black text-white mb-1">{stats.productosNuevos}</h3>
                            <p className="text-gray-400 text-sm">Agregados esta semana</p>
                        </div>
                    </div>
                </div>

                {/* GRAPH SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-brand-black flex items-center gap-2">
                                <BarChart3 className="text-neon-600" size={20} />
                                Inventario por Categoría
                            </h3>
                            <button className="text-xs font-bold text-gray-400 hover:text-neon-600 uppercase transition-colors">Descargar Reporte</button>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="cantidad" fill="#1A1A1A" radius={[4, 4, 0, 0]} barSize={40}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#C7F000' : '#1A1A1A'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Stats / Info */}
                    <div className="bg-gradient-to-br from-brand-black to-gray-900 rounded-2xl p-8 text-white shadow-2xl flex flex-col justify-center relative overflow-hidden">
                        {/* Decor */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-500 rounded-full blur-[80px] opacity-20"></div>

                        <h3 className="text-2xl font-black mb-2 relative z-10">Soporte Técnico</h3>
                        <p className="text-gray-400 mb-8 relative z-10 text-sm leading-relaxed">
                            ¿Necesitas ayuda con el panel o tienes problemas con el inventario? Contacta al equipo de soporte.
                        </p>

                        <div className="space-y-3 relative z-10">
                            <button className="w-full py-3 bg-neon-500 hover:bg-neon-400 text-brand-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                                <Sparkles size={18} />
                                Contactar Soporte
                            </button>
                            <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors border border-white/10">
                                Ver Documentación
                            </button>
                        </div>
                    </div>
                </div>

                {/* Acciones Rápidas */}
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-brand-black mb-6 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-2 h-2 bg-neon-500 rounded-full"></div>
                        Acciones Rápidas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link href="/admin/productos" className="group">
                            <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-neon-500 hover:shadow-lg transition-all cursor-pointer h-full">
                                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-black transition-colors">
                                    <Package className="text-gray-600 group-hover:text-neon-500 transition-colors" size={24} />
                                </div>
                                <h4 className="font-bold text-brand-black mb-1 group-hover:text-neon-600 transition-colors">Gestionar Productos</h4>
                                <p className="text-xs text-gray-500">Añadir, editar o eliminar skus</p>
                            </div>
                        </Link>

                        <Link href="/admin/categorias" className="group">
                            <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-neon-500 hover:shadow-lg transition-all cursor-pointer h-full">
                                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-black transition-colors">
                                    <Tags className="text-gray-600 group-hover:text-neon-500 transition-colors" size={24} />
                                </div>
                                <h4 className="font-bold text-brand-black mb-1 group-hover:text-neon-600 transition-colors">Categorías</h4>
                                <p className="text-xs text-gray-500">Organizar catálogo</p>
                            </div>
                        </Link>

                        <Link href="/admin/portada" className="group">
                            <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-neon-500 hover:shadow-lg transition-all cursor-pointer h-full">
                                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-black transition-colors">
                                    <Image className="text-gray-600 group-hover:text-neon-500 transition-colors" size={24} />
                                </div>
                                <h4 className="font-bold text-brand-black mb-1 group-hover:text-neon-600 transition-colors">Portada</h4>
                                <p className="text-xs text-gray-500">Banner principal</p>
                            </div>
                        </Link>

                        <Link href="/" className="group">
                            <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-neon-500 hover:shadow-lg transition-all cursor-pointer h-full">
                                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500 transition-colors">
                                    <Eye className="text-gray-600 group-hover:text-white transition-colors" size={24} />
                                </div>
                                <h4 className="font-bold text-brand-black mb-1 group-hover:text-green-600 transition-colors">Ver Tienda</h4>
                                <p className="text-xs text-gray-500">Previsualizar cambios</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
