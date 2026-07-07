'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
    Package, TrendingUp, CheckCircle2, BarChart3,
    DollarSign, ShoppingCart, Warehouse, Eye, BarChart2, Image, Sparkles
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import { useAuth } from '@/context/AuthContext'

export default function DashboardPage() {
    const { profile, hasPermission } = useAuth()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ totalProductos: 0, productosActivos: 0, categorias: 0 })
    const [ventasVsCompras, setVentasVsCompras] = useState<any[]>([])
    const [topProductos, setTopProductos] = useState<any[]>([])
    const [pieData, setPieData] = useState<any[]>([])
    const [totalVentasSemana, setTotalVentasSemana] = useState(0)
    const [totalComprasSemana, setTotalComprasSemana] = useState(0)
    const [capitalInventario, setCapitalInventario] = useState(0)
    const [capitalPorCategoria, setCapitalPorCategoria] = useState<any[]>([])
    const loadedRef = useRef(false)

    useEffect(() => {
        if (loadedRef.current) return
        loadedRef.current = true
        Promise.all([loadStats(), loadCharts(), loadCapital()]).finally(() => setLoading(false))
    }, [])

    const loadStats = async () => {
        const { count: totalProductos } = await supabase.from('zapatos').select('*', { count: 'exact', head: true })
        const { count: productosActivos } = await supabase.from('zapatos').select('*', { count: 'exact', head: true }).eq('disponible', true)
        const { count: categoriasCount } = await supabase.from('categorias').select('*', { count: 'exact', head: true }).eq('activa', true)
        setStats({ totalProductos: totalProductos || 0, productosActivos: productosActivos || 0, categorias: categoriasCount || 0 })
    }

    const loadCharts = async () => {
        const hace7 = new Date(); hace7.setDate(hace7.getDate() - 6); hace7.setHours(0, 0, 0, 0)
        const { data: movs } = await supabase.from('movimientos_kardex').select('tipo, cantidad, precio_total, fecha').gte('fecha', hace7.toISOString()).order('fecha', { ascending: true })

        const diasMap: { [k: string]: { ventas: number; ingresos: number; compras: number } } = {}
        for (let i = 0; i < 7; i++) {
            const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0)
            const key = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
            diasMap[key] = { ventas: 0, ingresos: 0, compras: 0 }
        }
        let tv = 0, tc = 0
        movs?.forEach((m: any) => {
            const key = new Date(m.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
            if (!diasMap[key]) return
            if (m.tipo === 'VENTA') { diasMap[key].ingresos += m.precio_total || 0; tv += m.precio_total || 0 }
            else if (m.tipo === 'ENTRADA') { diasMap[key].compras += m.cantidad; tc += m.precio_total || 0 }
        })
        setTotalVentasSemana(tv)
        setTotalComprasSemana(tc)
        setVentasVsCompras(Object.entries(diasMap).map(([dia, val]) => ({ dia, ...val })))

        const { data: prods } = await supabase.from('zapatos').select('nombre, stock_bultos').gt('stock_bultos', 0).order('stock_bultos', { ascending: false }).limit(8)
        setTopProductos((prods || []).map((p: any) => ({ nombre: p.nombre.length > 18 ? p.nombre.slice(0, 18) + '…' : p.nombre, stock: p.stock_bultos })))

        const hace30 = new Date(); hace30.setDate(hace30.getDate() - 30)
        const { data: mp } = await supabase.from('movimientos_kardex').select('tipo, cantidad').gte('fecha', hace30.toISOString())
        const pMap: { [k: string]: number } = {}
        mp?.forEach((m: any) => { pMap[m.tipo] = (pMap[m.tipo] || 0) + m.cantidad })
        const PIE_C: { [k: string]: string } = { VENTA: '#22c55e', ENTRADA: '#3b82f6', AJUSTE: '#f59e0b' }
        setPieData(Object.entries(pMap).map(([tipo, cantidad]) => ({ name: tipo, value: cantidad, color: PIE_C[tipo] || '#94a3b8' })))
    }

    const loadCapital = async () => {
        const { data } = await supabase.from('zapatos').select('cat_obj:categorias(nombre), stock_bultos, precio_costo').gt('stock_bultos', 0)
        if (!data) return
        let total = 0
        const cMap: { [k: string]: number } = {}
        data.forEach((p: any) => {
            const v = (p.precio_costo || 0) * (p.stock_bultos || 0)
            total += v
            const cat = p.cat_obj?.nombre || 'Sin Categoría'
            cMap[cat] = (cMap[cat] || 0) + v
        })
        setCapitalInventario(total)
        setCapitalPorCategoria(Object.entries(cMap).map(([cat, valor]) => ({ cat, valor })).sort((a, b) => b.valor - a.valor))
    }

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
        </div>
    )

    return (
        <div className="p-5 lg:p-7 space-y-6 text-white">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white">Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Bienvenido, <span className="text-orange-400 font-semibold">{profile?.nombre_completo}</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <p className="text-xs text-slate-600 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full hidden md:block">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <Link href="/" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-full transition-colors">
                        <Eye size={13} /> Ver tienda
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 hover:-translate-y-0.5 transition-all relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-500"><Package size={20} /></div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Total</span>
                    </div>
                    <h3 className="text-3xl font-black text-white mb-0.5">{stats.totalProductos}</h3>
                    <p className="text-slate-500 text-xs font-medium">Productos registrados</p>
                </div>

                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 hover:-translate-y-0.5 transition-all">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2.5 bg-green-500/10 rounded-xl text-green-500"><CheckCircle2 size={20} /></div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Activos</span>
                    </div>
                    <h3 className="text-3xl font-black text-white mb-0.5">{stats.productosActivos}</h3>
                    <p className="text-slate-500 text-xs font-medium">Disponibles en tienda</p>
                    <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: `${stats.totalProductos > 0 ? (stats.productosActivos / stats.totalProductos) * 100 : 0}%` }} />
                    </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 hover:-translate-y-0.5 transition-all">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2.5 bg-green-600/10 rounded-xl text-green-600"><DollarSign size={20} /></div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Ventas 7d</span>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-0.5">
                        {totalVentasSemana.toFixed(0)} <span className="text-sm font-normal text-slate-500">Bs</span>
                    </h3>
                    <p className="text-slate-500 text-xs font-medium">Ingresos esta semana</p>
                </div>

                <div className="bg-orange-500 rounded-2xl p-5 shadow-lg shadow-orange-500/20 hover:-translate-y-0.5 transition-all relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2.5 bg-black/20 rounded-xl text-white"><ShoppingCart size={20} /></div>
                        <span className="text-[10px] font-bold text-white/50 uppercase">Compras 7d</span>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-0.5">
                        {totalComprasSemana.toFixed(0)} <span className="text-sm font-normal text-white/60">Bs</span>
                    </h3>
                    <p className="text-white/70 text-xs font-medium">Compras esta semana</p>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
                </div>
            </div>

            {/* Capital Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500/15 rounded-xl">
                        <Warehouse className="text-orange-400" size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Capital en inventario</p>
                        <p className="text-3xl font-black text-white">
                            {capitalInventario.toFixed(2)} <span className="text-base font-normal text-slate-500">Bs</span>
                        </p>
                        <p className="text-slate-600 text-xs mt-0.5">stock × precio costo</p>
                    </div>
                </div>
                {capitalPorCategoria.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {capitalPorCategoria.map((item, i) => (
                            <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold mb-0.5">{item.cat}</p>
                                <p className="text-sm font-black text-white">{item.valor.toFixed(0)} <span className="text-xs font-normal text-slate-500">Bs</span></p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-5">
                        <TrendingUp className="text-orange-500" size={16} />
                        Ventas vs Compras — Últimos 7 días
                    </h3>
                    {ventasVsCompras.every(d => d.ingresos === 0 && d.compras === 0) ? (
                        <div className="h-[240px] flex items-center justify-center text-slate-600 text-sm">Sin movimientos esta semana.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={ventasVsCompras} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#0f172a', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.4)' }} itemStyle={{ color: '#fff' }} formatter={(v: any, n: any) => [`${Number(v).toFixed(2)} Bs`, n === 'ingresos' ? 'Ventas' : 'Compras'] as [string, string]} />
                                <Legend formatter={(v) => v === 'ingresos' ? 'Ventas (Bs)' : 'Compras (Bs)'} wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                                <Line type="monotone" dataKey="ingresos" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4, fill: '#22c55e' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="compras" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} strokeDasharray="5 5" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-5">
                        <BarChart2 className="text-orange-500" size={16} />
                        Movimientos — 30 días
                    </h3>
                    {pieData.length === 0 ? (
                        <div className="h-[180px] flex items-center justify-center text-slate-600 text-sm text-center">Sin movimientos en 30 días.</div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#0f172a', color: '#fff' }} formatter={(v: any) => [`${v} Bultos`]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-1.5 mt-2">
                                {pieData.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                            <span className="text-slate-500 font-medium">{d.name}</span>
                                        </div>
                                        <span className="font-bold text-slate-300">{d.value} Bultos</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Accesos rápidos — Portada Web y Promociones */}
            {(hasPermission('gestionar_configuracion')) && (
                <div>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">Acceso rápido</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link href="/admin/portada" className="group flex items-center gap-4 bg-slate-900 border border-slate-800 hover:border-purple-500/40 hover:bg-purple-500/5 rounded-2xl p-4 transition-all">
                            <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/25 transition-colors">
                                <Image size={20} className="text-purple-400" />
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">Portada Web</p>
                                <p className="text-xs text-slate-500 mt-0.5">Editar banner y contenido principal de la tienda</p>
                            </div>
                        </Link>
                        <Link href="/admin/promociones" className="group flex items-center gap-4 bg-slate-900 border border-slate-800 hover:border-red-500/40 hover:bg-red-500/5 rounded-2xl p-4 transition-all">
                            <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/25 transition-colors">
                                <Sparkles size={20} className="text-red-400" />
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">Promociones</p>
                                <p className="text-xs text-slate-500 mt-0.5">Gestionar ofertas, descuentos y campañas activas</p>
                            </div>
                        </Link>
                    </div>
                </div>
            )}

            {/* Top Productos */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-5">
                    <Package className="text-orange-500" size={16} />
                    Top Productos — Mayor Stock
                </h3>
                {topProductos.length === 0 ? (
                    <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">Sin productos con stock.</div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart layout="vertical" data={topProductos} margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} />
                            <YAxis type="category" dataKey="nombre" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} width={120} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#0f172a', color: '#fff' }} formatter={(v: any) => [`${v} Bultos`, 'Stock']} />
                            <Bar dataKey="stock" radius={[0, 6, 6, 0]} barSize={18}>
                                {topProductos.map((_, i) => <Cell key={i} fill={i === 0 ? '#f97316' : i === 1 ? '#fb923c' : '#fdba74'} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

        </div>
    )
}
