'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard, Package, Tags, Image, LogOut, TrendingUp,
    Eye, ArrowUpRight, Sparkles, Clock, CheckCircle2, BarChart3,
    Layers, Users, Ruler, DollarSign, ShoppingCart, Warehouse, ShieldCheck, Boxes
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import { useAuth } from '@/context/AuthContext'

export default function AdminDashboard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ totalProductos: 0, productosActivos: 0, categorias: 0, productosNuevos: 0 })
    const [ventasVsCompras, setVentasVsCompras] = useState<any[]>([])
    const [topProductos, setTopProductos] = useState<any[]>([])
    const [pieData, setPieData] = useState<any[]>([])
    const [totalVentasSemana, setTotalVentasSemana] = useState(0)
    const [totalComprasSemana, setTotalComprasSemana] = useState(0)
    const [capitalInventario, setCapitalInventario] = useState(0)
    const [capitalPorCategoria, setCapitalPorCategoria] = useState<any[]>([])

    const { profile, loading: authLoading, hasPermission, logout } = useAuth()

    const dataLoadedRef = useRef(false)

    useEffect(() => {
         if (!authLoading) {
             if (!profile) {
                 // Forzar redirección limpia si no hay perfil válido
                 window.location.replace('/admin/login')
             } else if (!dataLoadedRef.current) {
                 dataLoadedRef.current = true
                 // Disparamos la carga de datos y esperamos a que termine antes de ocultar el loader
                 loadAll().finally(() => {
                     setLoading(false)
                 })
             }
         }
     }, [authLoading, profile])

    const loadAll = async () => {
        try {
            await Promise.all([loadStats(), loadCharts(), loadCapital()])
        } catch (error) {
            console.error("Error al cargar datos del panel:", error)
        }
    }

    const loadStats = async () => {
        const { count: totalProductos } = await supabase.from('zapatos').select('*', { count: 'exact', head: true })
        const { count: productosActivos } = await supabase.from('zapatos').select('*', { count: 'exact', head: true }).eq('disponible', true)
        const { count: categoriasCount } = await supabase.from('categorias').select('*', { count: 'exact', head: true }).eq('activa', true)
        const hace7Dias = new Date(); hace7Dias.setDate(hace7Dias.getDate() - 7)
        const { count: productosNuevos } = await supabase.from('zapatos').select('*', { count: 'exact', head: true }).gte('fecha_creacion', hace7Dias.toISOString())
        setStats({ totalProductos: totalProductos || 0, productosActivos: productosActivos || 0, categorias: categoriasCount || 0, productosNuevos: productosNuevos || 0 })
    }

    const loadCharts = async () => {
        // --- 1. Ventas vs Compras últimos 7 días ---
        const hace7Dias = new Date(); hace7Dias.setDate(hace7Dias.getDate() - 6); hace7Dias.setHours(0, 0, 0, 0)
        const { data: movs } = await supabase.from('movimientos_kardex')
            .select('tipo, cantidad, precio_total, fecha')
            .gte('fecha', hace7Dias.toISOString())
            .order('fecha', { ascending: true })

        // Construir mapa día a día
        const diasMap: { [key: string]: { ventas: number; ingresos: number; compras: number } } = {}
        for (let i = 0; i < 7; i++) {
            const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0)
            const key = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
            diasMap[key] = { ventas: 0, ingresos: 0, compras: 0 }
        }

        let tvSemana = 0, tcSemana = 0
        movs?.forEach((m: any) => {
            const d = new Date(m.fecha)
            const key = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
            if (!diasMap[key]) return
            if (m.tipo === 'VENTA') {
                diasMap[key].ventas += m.cantidad
                diasMap[key].ingresos += m.precio_total || 0
                tvSemana += m.precio_total || 0
            } else if (m.tipo === 'ENTRADA') {
                diasMap[key].compras += m.cantidad
                tcSemana += m.precio_total || 0
            }
        })
        setTotalVentasSemana(tvSemana)
        setTotalComprasSemana(tcSemana)
        setVentasVsCompras(Object.entries(diasMap).map(([dia, val]) => ({ dia, ...val })))

        // --- 2. Top 8 productos por stock ---
        const { data: productos } = await supabase.from('zapatos')
            .select('nombre, stock_bultos, cat_obj:categorias(nombre)')
            .gt('stock_bultos', 0)
            .order('stock_bultos', { ascending: false })
            .limit(8)
        const top = (productos || []).map((p: any) => ({
            nombre: p.nombre.length > 18 ? p.nombre.substring(0, 18) + '…' : p.nombre,
            stock: p.stock_bultos
        }))
        setTopProductos(top)

        // --- 3. Pie: distribución tipos de movimiento (últimos 30 días) ---
        const hace30 = new Date(); hace30.setDate(hace30.getDate() - 30)
        const { data: movsPie } = await supabase.from('movimientos_kardex')
            .select('tipo, cantidad')
            .gte('fecha', hace30.toISOString())

        const pieMap: { [k: string]: number } = {}
        movsPie?.forEach((m: any) => { pieMap[m.tipo] = (pieMap[m.tipo] || 0) + m.cantidad })
        const PIE_COLORS: { [k: string]: string } = { VENTA: '#22c55e', ENTRADA: '#3b82f6', AJUSTE: '#f59e0b' }
        setPieData(Object.entries(pieMap).map(([tipo, cantidad]) => ({ name: tipo, value: cantidad, color: PIE_COLORS[tipo] || '#94a3b8' })))
    }

    const loadCapital = async () => {
        const { data } = await supabase
            .from('zapatos')
            .select('nombre, cat_obj:categorias(nombre), stock_bultos, precio_costo')
            .gt('stock_bultos', 0)

        if (!data) return

        let total = 0
        const catMap: { [k: string]: number } = {}

        data.forEach((p: any) => {
            const costo = p.precio_costo || 0
            const stock = p.stock_bultos || 0
            const valor = costo * stock
            total += valor
            const cat = p.cat_obj?.nombre || 'Sin Categoría'
            catMap[cat] = (catMap[cat] || 0) + valor
        })

        setCapitalInventario(total)
        const sorted = Object.entries(catMap)
            .map(([cat, valor]) => ({ cat, valor }))
            .sort((a, b) => b.valor - a.valor)
        setCapitalPorCategoria(sorted)
    }


    const handleLogout = async () => {
        await logout()
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto"></div>
                <p className="mt-4 font-bold tracking-wider text-slate-600 dark:text-slate-400">CARGANDO PANEL...</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
            {/* Navbar */}
            <nav className="bg-black text-white shadow-xl sticky top-0 z-50 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="relative w-10 h-10">
                            <img src="/logo.png" className="object-contain w-full h-full invert" alt="Logo" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-white">ACTIVA <span className="text-orange-500">SPORT</span></h1>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Panel de Control</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/"><button className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg font-bold transition-all flex items-center gap-2 text-xs uppercase"><Eye size={16} /><span className="hidden md:inline">Ver Tienda</span></button></Link>
                        <button onClick={handleLogout} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-all flex items-center gap-2 text-xs uppercase shadow-lg"><LogOut size={16} /><span className="hidden md:inline">Salir</span></button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="mb-10 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <LayoutDashboard className="text-orange-500" size={28} />
                            <h2 className="text-3xl font-black text-black dark:text-white uppercase">Dashboard</h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Bienvenido, <span className="font-bold text-orange-500">{profile?.nombre_completo || 'Usuario'}</span> 
                            <span className="ml-2 inline-flex items-center gap-1 bg-slate-200 dark:bg-slate-800 text-xs px-2 py-0.5 rounded-full uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                <ShieldCheck size={12}/> {profile?.roles?.nombre || 'Rol'}
                            </span>
                        </p>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 px-4 rounded-full shadow-sm hidden md:block">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 hover:-translate-y-1 transition-all relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-black dark:bg-slate-800 rounded-xl text-orange-500"><Package size={24} /></div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Total</span>
                        </div>
                        <h3 className="text-4xl font-black text-black dark:text-white mb-1">{stats.totalProductos}</h3>
                        <p className="text-slate-500 text-sm font-medium">Productos registrados</p>
                        <Package className="absolute -bottom-4 -right-4 text-slate-50 dark:text-slate-800 opacity-50 rotate-12" size={100} />
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 hover:-translate-y-1 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-green-500 rounded-xl text-white"><CheckCircle2 size={24} /></div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Activos</span>
                        </div>
                        <h3 className="text-4xl font-black text-black dark:text-white mb-1">{stats.productosActivos}</h3>
                        <p className="text-slate-500 text-sm font-medium">Disponibles en tienda</p>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-green-500 h-full rounded-full" style={{ width: `${stats.totalProductos > 0 ? (stats.productosActivos / stats.totalProductos) * 100 : 0}%` }}></div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 hover:-translate-y-1 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-green-600 rounded-xl text-white"><DollarSign size={24} /></div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Ventas 7d</span>
                        </div>
                        <h3 className="text-3xl font-black text-black dark:text-white mb-1">{totalVentasSemana.toFixed(0)} <span className="text-sm font-normal text-slate-400">Bs</span></h3>
                        <p className="text-slate-500 text-sm font-medium">Ingresos esta semana</p>
                    </div>

                    <div className="bg-orange-500 text-white rounded-2xl p-6 shadow-xl shadow-orange-500/20 hover:-translate-y-1 transition-all relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-black/20 rounded-xl"><ShoppingCart size={24} /></div>
                            <span className="text-xs font-bold text-white/60 uppercase">Compras 7d</span>
                        </div>
                        <h3 className="text-3xl font-black mb-1">{totalComprasSemana.toFixed(0)} <span className="text-sm font-normal text-white/70">Bs</span></h3>
                        <p className="text-white/80 text-sm font-medium">Compras esta semana</p>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    </div>
                </div>

                {/* Capital en Inventario Banner */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl border border-slate-700">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-orange-500/20 rounded-2xl">
                            <Warehouse className="text-orange-400" size={32} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">Capital invertido en inventario</p>
                            <p className="text-4xl font-black text-white">
                                {capitalInventario.toFixed(2)} <span className="text-xl font-normal text-slate-400">Bs</span>
                            </p>
                            <p className="text-slate-500 text-xs mt-1">Calculado como: stock × precio de costo por producto</p>
                        </div>
                    </div>
                    {capitalPorCategoria.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                            {capitalPorCategoria.map((item, i) => (
                                <div key={i} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
                                    <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-1">{item.cat}</p>
                                    <p className="text-lg font-black text-white">{item.valor.toFixed(0)} <span className="text-xs font-normal text-slate-400">Bs</span></p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* GRAPHS ROW 1: Ventas vs Compras + Pie */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Ventas vs Compras */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                                <TrendingUp className="text-orange-500" size={20} />
                                Ventas vs Compras — Últimos 7 días
                            </h3>
                        </div>
                        {ventasVsCompras.every(d => d.ingresos === 0 && d.compras === 0) ? (
                            <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">
                                Sin movimientos esta semana. Registra ventas o compras para ver datos aquí.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={ventasVsCompras} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', backgroundColor: '#1e293b', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value: any, name: any) => [`${Number(value).toFixed(2)} Bs`, name === 'ingresos' ? 'Ventas (Bs)' : 'Compras (Bs)'] as [string, string]}
                                    />
                                    <Legend formatter={(val) => val === 'ingresos' ? 'Ventas (Bs)' : 'Compras (Bs)'} />
                                    <Line type="monotone" dataKey="ingresos" stroke="#22c55e" strokeWidth={3} dot={{ r: 5, fill: '#22c55e' }} activeDot={{ r: 7 }} />
                                    <Line type="monotone" dataKey="compras" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6' }} activeDot={{ r: 7 }} strokeDasharray="5 5" />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Pie: Movimientos últimos 30 días */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
                        <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2 mb-6">
                            <BarChart3 className="text-orange-500" size={20} />
                            Movimientos — 30 días
                        </h3>
                        {pieData.length === 0 ? (
                            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm text-center">
                                Sin movimientos registrados en los últimos 30 días.
                            </div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                                            {pieData.map((entry, index) => (
                                                <Cell key={index} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', backgroundColor: '#1e293b', color: '#fff' }}
                                            formatter={(value: any) => [`${value} Bultos`]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-2 mt-2">
                                    {pieData.map((d, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                                                <span className="text-slate-600 dark:text-slate-400 font-medium">{d.name}</span>
                                            </div>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{d.value} Bultos</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* GRAPHS ROW 2: Top productos + Acciones */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                    {/* Top Productos por Stock */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
                        <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2 mb-6">
                            <Package className="text-orange-500" size={20} />
                            Top Productos — Mayor Stock
                        </h3>
                        {topProductos.length === 0 ? (
                            <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">
                                Sin productos con stock registrado.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart layout="vertical" data={topProductos} margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <YAxis type="category" dataKey="nombre" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} width={130} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', backgroundColor: '#1e293b', color: '#fff' }}
                                        formatter={(val: any) => [`${val} Bultos`, 'Stock']}
                                    />
                                    <Bar dataKey="stock" radius={[0, 6, 6, 0]} barSize={22}>
                                        {topProductos.map((_, index) => (
                                            <Cell key={index} fill={index === 0 ? '#f97316' : index === 1 ? '#fb923c' : '#fed7aa'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Acciones Rápidas */}
                    <div className="bg-black text-white rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-start gap-3">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full blur-[100px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                            <Sparkles className="text-orange-500" size={20} />
                            Acciones Rápidas
                        </h3>
                        {[
                            { href: '/admin/ventas', icon: ShoppingCart, label: 'NUEVA VENTA', sub: 'Nota de venta + PDF', color: 'bg-green-600', shadow: 'shadow-green-600/20', perm: 'registrar_ventas' },
                            { href: '/admin/pedidos', icon: ShoppingCart, label: 'PEDIDOS', sub: 'Pedidos WhatsApp', color: 'bg-blue-500', shadow: 'shadow-blue-500/20', perm: 'gestionar_pedidos' },
                            { href: '/admin/reportes', icon: BarChart3, label: 'REPORTES', sub: 'Ventas y exportar PDF', color: 'bg-orange-500', shadow: 'shadow-orange-500/20', perm: 'ver_finanzas' },
                            { href: '/admin/productos', icon: Package, label: 'PRODUCTOS', sub: 'Inventario completo', color: 'bg-orange-500', shadow: 'shadow-orange-500/20', perm: 'gestionar_catalogo' },
                            { href: '/admin/inventario', icon: Boxes, label: 'INVENTARIO', sub: 'Stock por sucursal', color: 'bg-cyan-600', shadow: 'shadow-cyan-600/20', perm: 'gestionar_catalogo' },
                            { href: '/admin/proveedores', icon: Warehouse, label: 'PROVEEDORES', sub: 'Contactos y compras', color: 'bg-teal-600', shadow: 'shadow-teal-600/20', perm: 'gestionar_catalogo' },
                            { href: '/admin/categorias', icon: Tags, label: 'CATEGORÍAS', sub: 'Organizar catálogo', color: 'bg-blue-600', shadow: 'shadow-blue-600/20', perm: 'gestionar_catalogo' },
                            { href: '/admin/subcategorias', icon: Layers, label: 'SUBCATEGORÍAS', sub: 'Tipos de planta', color: 'bg-indigo-600', shadow: 'shadow-indigo-600/20', perm: 'gestionar_catalogo' },
                            { href: '/admin/marcas', icon: CheckCircle2, label: 'MARCAS', sub: 'Gestión de marcas', color: 'bg-green-600', shadow: 'shadow-green-600/20', perm: 'gestionar_catalogo' },
                            { href: '/admin/generos', icon: Users, label: 'GÉNEROS', sub: 'Hombre / Mujer', color: 'bg-pink-600', shadow: 'shadow-pink-600/20', perm: 'gestionar_catalogo' },
                            { href: '/admin/grupos', icon: Ruler, label: 'TALLAS', sub: 'Grupos de talla', color: 'bg-purple-600', shadow: 'shadow-purple-600/20', perm: 'gestionar_catalogo' },
                            { href: '/admin/promociones', icon: Sparkles, label: 'PROMOCIONES', sub: 'Ofertas y campañas', color: 'bg-red-500', shadow: 'shadow-red-500/20', perm: 'gestionar_configuracion' },
                            { href: '/admin/portada', icon: Image, label: 'PORTADA WEB', sub: 'Banner principal', color: 'bg-purple-600', shadow: 'shadow-purple-600/20', perm: 'gestionar_configuracion' },
                        ].filter(action => hasPermission(action.perm)).map(({ href, icon: Icon, label, sub, color, shadow }) => (
                            <Link key={href} href={href} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                                <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center text-white shadow-lg ${shadow} shrink-0`}><Icon size={18} /></div>
                                <div>
                                    <h4 className="font-bold text-sm">{label}</h4>
                                    <p className="text-xs text-gray-400 group-hover:text-white transition-colors">{sub}</p>
                                </div>
                                <ArrowUpRight className="ml-auto text-gray-600 group-hover:text-white transition-colors" size={16} />
                            </Link>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}
