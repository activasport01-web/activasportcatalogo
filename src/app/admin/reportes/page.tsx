'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, FileText, Calendar, Download, Search, TrendingUp, TrendingDown, DollarSign, Zap, Package, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export default function ReportesPage() {
    const [loading, setLoading] = useState(true)
    const [movimientos, setMovimientos] = useState<any[]>([])
    const [filteredMovimientos, setFilteredMovimientos] = useState<any[]>([])

    const getLocalDate = () => {
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset * 60 * 1000))
        return local.toISOString().split('T')[0]
    }

    // Filtros
    const [startDate, setStartDate] = useState(getLocalDate())
    const [endDate, setEndDate] = useState(getLocalDate())
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('ALL') // ALL, VENTA, ENTRADA

    // Estadísticas
    const [stats, setStats] = useState({
        ventasHoy: 0,
        ingresosHoy: 0,
        ventasPeriodo: 0,
        ingresosPeriodo: 0,
        comprasPeriodo: 0,
        costoComprasPeriodo: 0
    })
    const [monthlyData, setMonthlyData] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<'movimientos' | 'inventario' | 'rentabilidad'>('movimientos')
    const [inventario, setInventario] = useState<any[]>([])
    const [loadingInv, setLoadingInv] = useState(false)

    // --- RENTABILIDAD ---
    const [comprasAgrupadas, setComprasAgrupadas] = useState<any[]>([])
    const [loadingRent, setLoadingRent] = useState(false)
    const [rentStats, setRentStats] = useState({ totalUSD: 0, totalBs: 0, registros: 0 })

    // Mapa de costo promedio por producto (producto_id -> costo_bs_por_bulto promedio ponderado)
    const [costosMap, setCostosMap] = useState<{ [id: string]: number }>({})
    const [gananciaNetaPeriodo, setGananciaNetaPeriodo] = useState<number | null>(null)

    useEffect(() => {
        loadMovimientos()
        loadMonthlyData()
    }, [startDate, endDate])

    useEffect(() => {
        if (activeTab === 'inventario') loadInventario()
        if (activeTab === 'rentabilidad') loadRentabilidad()
    }, [activeTab])

    useEffect(() => {
        applyFilters()
    }, [movimientos, searchTerm, filterType])

    const loadMovimientos = async () => {
        setLoading(true)

        const start = new Date(startDate + 'T00:00:00')
        const end = new Date(endDate + 'T23:59:59.999')

        // Cargar movimientos y costos de compras en paralelo
        const [{ data, error }, { data: comprasData }] = await Promise.all([
            supabase
                .from('movimientos_kardex')
                .select('*, zapatos (nombre, codigo, categoria)')
                .gte('fecha', start.toISOString())
                .lte('fecha', end.toISOString())
                .order('fecha', { ascending: false }),
            supabase
                .from('compras_producto')
                .select('producto_id, bultos_qty, costo_bs_total')
        ])

        // Construir mapa de costo promedio ponderado: { producto_id -> costo_prom_bs }
        const mapa: { [id: string]: number } = {}
        if (comprasData) {
            const agrupar: { [id: string]: { totalBs: number; totalBultos: number } } = {}
            comprasData.forEach((c: any) => {
                const pid = c.producto_id
                if (!agrupar[pid]) agrupar[pid] = { totalBs: 0, totalBultos: 0 }
                agrupar[pid].totalBs += Number(c.costo_bs_total)
                agrupar[pid].totalBultos += Number(c.bultos_qty)
            })
            Object.entries(agrupar).forEach(([pid, val]) => {
                mapa[pid] = val.totalBultos > 0 ? val.totalBs / val.totalBultos : 0
            })
        }
        setCostosMap(mapa)

        if (error) {
            console.error('Error cargando movimientos:', error)
            alert('Error al cargar reportes: ' + error.message)
        } else {
            setMovimientos(data || [])
            calculateStats(data || [], mapa)
        }
        setLoading(false)
    }

    const calculateStats = (data: any[], mapa: { [id: string]: number } = {}) => {
        let ventasHoy = 0
        let ingresosHoy = 0
        let ventasPeriodo = 0
        let ingresosPeriodo = 0
        let comprasPeriodo = 0
        let costoComprasPeriodo = 0
        let costoRealVendido = 0
        let tieneAlgunCosto = false

        data.forEach(m => {
            const isVenta = m.tipo === 'VENTA'
            const isEntrada = m.tipo === 'ENTRADA'
            const precioTotal = m.precio_total || 0
            const fechaMovStr = new Date(m.fecha).toLocaleDateString()
            const todayStr = new Date().toLocaleDateString()

            if (isVenta) {
                ventasPeriodo += m.cantidad
                ingresosPeriodo += precioTotal
                // Calcular costo real usando el mapa de costos por producto
                const pid = m.zapato_id || m.producto_id
                if (pid && mapa[pid]) {
                    costoRealVendido += Number(m.cantidad) * mapa[pid]
                    tieneAlgunCosto = true
                }
            } else if (isEntrada) {
                comprasPeriodo += m.cantidad
                costoComprasPeriodo += precioTotal
            }

            if (fechaMovStr === todayStr && isVenta) {
                ventasHoy += m.cantidad
                ingresosHoy += precioTotal
            }
        })

        setStats({
            ventasHoy,
            ingresosHoy,
            ventasPeriodo,
            ingresosPeriodo,
            comprasPeriodo,
            costoComprasPeriodo
        })
        setGananciaNetaPeriodo(tieneAlgunCosto ? ingresosPeriodo - costoRealVendido : null)
    }

    const applyFilters = () => {
        let filtered = movimientos

        // Filtro por Tipo
        if (filterType !== 'ALL') {
            filtered = filtered.filter(m => m.tipo === filterType)
        }

        // Filtro por Busqueda (Nombre producto, detalle)
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(m =>
                m.detalle?.toLowerCase().includes(term) ||
                m.zapatos?.nombre.toLowerCase().includes(term) ||
                m.zapatos?.codigo?.toLowerCase().includes(term)
            )
        }

        setFilteredMovimientos(filtered)
    }

    const loadMonthlyData = async () => {
        // Últimos 6 meses
        const desde = new Date()
        desde.setMonth(desde.getMonth() - 5)
        desde.setDate(1)
        desde.setHours(0, 0, 0, 0)

        const { data } = await supabase
            .from('movimientos_kardex')
            .select('tipo, precio_total, fecha')
            .gte('fecha', desde.toISOString())

        // Construir mapa por mes
        const meses: { [k: string]: { ventas: number; compras: number } } = {}
        for (let i = 5; i >= 0; i--) {
            const d = new Date()
            d.setMonth(d.getMonth() - i)
            const key = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
            meses[key] = { ventas: 0, compras: 0 }
        }

        data?.forEach((m: any) => {
            const d = new Date(m.fecha)
            const key = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
            if (!meses[key]) return
            if (m.tipo === 'VENTA') meses[key].ventas += m.precio_total || 0
            else if (m.tipo === 'ENTRADA') meses[key].compras += m.precio_total || 0
        })

        setMonthlyData(Object.entries(meses).map(([mes, val]) => ({ mes, ...val })))
    }

    const exportToPDF = () => {
        const doc = new jsPDF()

        // Título
        doc.setFontSize(18)
        doc.text('Reporte de Movimientos y Ventas', 14, 20)

        doc.setFontSize(10)
        doc.text(`Desde: ${startDate}  Hasta: ${endDate}`, 14, 28)
        doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 34)

        // Resumen
        doc.setFillColor(240, 240, 240)
        doc.rect(14, 40, 180, 25, 'F')
        doc.setFontSize(12)
        doc.text('Resumen del Periodo:', 18, 48)
        doc.setFontSize(10)
        doc.text(`Total Ventas (Bultos): ${stats.ventasPeriodo}`, 18, 56)
        doc.text(`Ingresos Totales: ${stats.ingresosPeriodo.toFixed(2)} Bs`, 100, 56)
        doc.text(`Entradas Inventario: ${stats.comprasPeriodo}`, 18, 62)

        // Tabla
        const tableColumn = ["Fecha", "Tipo", "Producto", "Cant.", "Precio Total", "Detalle"]
        const tableRows: any[] = []

        filteredMovimientos.forEach(m => {
            const movData = [
                new Date(m.fecha).toLocaleString(),
                m.tipo,
                m.zapatos?.nombre || 'Producto Eliminado',
                m.cantidad,
                m.precio_total ? `${m.precio_total} Bs` : '-',
                m.detalle || '-'
            ]
            tableRows.push(movData)
        })

        autoTable(doc, {
            startY: 70,
            head: [tableColumn],
            body: tableRows,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [22, 163, 74] } // Green header
        })

        doc.save(`reporte_ventas_${startDate}_${endDate}.pdf`)
    }

    const loadInventario = async () => {
        setLoadingInv(true)
        const { data } = await supabase
            .from('zapatos')
            .select('nombre, codigo, caja, categoria, stock_bultos, precio_costo, disponible')
            .order('categoria')
            .order('nombre')
        setInventario(data || [])
        setLoadingInv(false)
    }

    const loadRentabilidad = async () => {
        setLoadingRent(true)
        const { data, error } = await supabase
            .from('compras_producto')
            .select(`
                id, fecha, precio_usd, bultos_qty, tipo_cambio, costo_bs_total, costo_bs_por_bulto, precio_venta_ref, notas, producto_id,
                zapatos (nombre, codigo, categoria, stock_bultos, precio)
            `)
            .order('fecha', { ascending: false })

        if (!error && data) {
            // Agrupar por producto
            const mapa: { [id: string]: any } = {}
            data.forEach((c: any) => {
                const pid = c.producto_id
                if (!mapa[pid]) {
                    mapa[pid] = {
                        producto_id: pid,
                        nombre: c.zapatos?.nombre || 'Producto desconocido',
                        codigo: c.zapatos?.codigo || '—',
                        categoria: c.zapatos?.categoria || '—',
                        stock_actual: c.zapatos?.stock_bultos || 0,
                        precio_venta: c.zapatos?.precio || 0,
                        compras: []
                    }
                }
                mapa[pid].compras.push(c)
            })

            // Calcular métricas por producto
            const lista = Object.values(mapa).map((item: any) => {
                const totalUSD = item.compras.reduce((s: number, c: any) => s + Number(c.precio_usd), 0)
                const totalBs = item.compras.reduce((s: number, c: any) => s + Number(c.costo_bs_total), 0)
                const totalBultos = item.compras.reduce((s: number, c: any) => s + Number(c.bultos_qty), 0)
                const costoProm = totalBultos > 0 ? totalBs / totalBultos : 0
                const pvRef = item.compras.find((c: any) => c.precio_venta_ref)?.precio_venta_ref || item.precio_venta || 0
                const margen = pvRef > 0 ? ((pvRef - costoProm) / pvRef * 100) : null
                return { ...item, totalUSD, totalBs, totalBultos, costoProm, pvRef: Number(pvRef), margen }
            })

            setComprasAgrupadas(lista)
            setRentStats({
                totalUSD: data.reduce((s: number, c: any) => s + Number(c.precio_usd), 0),
                totalBs: data.reduce((s: number, c: any) => s + Number(c.costo_bs_total), 0),
                registros: data.length
            })
        }
        setLoadingRent(false)
    }

    const exportInventarioPDF = () => {
        const doc = new jsPDF()
        const fecha = new Date().toLocaleDateString('es-ES')

        doc.setFillColor(249, 115, 22)
        doc.rect(0, 0, 210, 28, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text('ACTIVA SPORT — REPORTE DE INVENTARIO', 14, 12)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Generado: ${fecha}`, 14, 22)

        const totalCapital = inventario.reduce((s, p) => s + (p.stock_bultos || 0) * (p.precio_costo || 0), 0)
        doc.setTextColor(30, 30, 30)
        doc.setFontSize(11)
        doc.text(`Total productos: ${inventario.length}   |   Capital en inventario: ${totalCapital.toFixed(2)} Bs`, 14, 40)

        autoTable(doc, {
            startY: 46,
            head: [['Producto', 'Cód./Caja', 'Categoría', 'Stock', 'Costo Unit.', 'Valor Total', 'Estado']],
            body: inventario.map(p => [
                p.nombre,
                p.codigo || p.caja || '—',
                p.categoria || '—',
                `${p.stock_bultos || 0} bultos`,
                p.precio_costo ? `${p.precio_costo.toFixed(2)} Bs` : '—',
                p.precio_costo ? `${((p.stock_bultos || 0) * p.precio_costo).toFixed(2)} Bs` : '—',
                p.disponible ? 'Activo' : 'Inactivo',
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [249, 115, 22], textColor: 255 },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: {
                3: { halign: 'center' },
                4: { halign: 'right' },
                5: { halign: 'right', fontStyle: 'bold' },
                6: { halign: 'center' },
            }
        })

        doc.save(`inventario_activa_sport_${fecha.replace(/\//g, '-')}.pdf`)
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 md:p-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/dashboard" className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                            <FileText className="text-orange-500" size={32} />
                            Reportes
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Historial de movimientos, ventas e inventario</p>
                    </div>
                </div>
                <Link href="/admin/ventas" className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all text-sm">
                    <ShoppingCart size={16} /> Nueva Venta
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 border-b border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => setActiveTab('movimientos')}
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-all border-b-2 -mb-px ${activeTab === 'movimientos'
                        ? 'border-orange-500 text-orange-500'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <FileText size={16} /> Movimientos & Ventas
                </button>
                <button
                    onClick={() => setActiveTab('inventario')}
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-all border-b-2 -mb-px ${activeTab === 'inventario'
                        ? 'border-orange-500 text-orange-500'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <Package size={16} /> Inventario Actual
                </button>
                <button
                    onClick={() => setActiveTab('rentabilidad')}
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-all border-b-2 -mb-px ${activeTab === 'rentabilidad'
                        ? 'border-green-500 text-green-500'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <TrendingUp size={16} /> Rentabilidad (USD)
                </button>
            </div>


            <div className="flex flex-wrap gap-3 mb-0">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <Calendar size={18} className="text-slate-400 ml-2" />
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-sm font-bold outline-none w-32 dark:text-white"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-sm font-bold outline-none w-32 dark:text-white"
                        />
                    </div>
                </div>
                <button
                    onClick={exportToPDF}
                    disabled={loading || filteredMovimientos.length === 0}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={18} />
                    <span className="hidden md:inline">Exportar PDF</span>
                </button>
            </div>

            {/* ===== TAB: MOVIMIENTOS ===== */}
            {activeTab === 'movimientos' && (
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800/50">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400"><TrendingUp size={24} /></div>
                                <span className="text-xs font-bold text-slate-400 uppercase">Hoy</span>
                            </div>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-1">{stats.ingresosHoy.toFixed(2)} <span className="text-sm font-normal text-slate-500">Bs</span></h3>
                            <p className="text-sm text-slate-500 flex items-center gap-1"><span className="font-bold text-green-500">{stats.ventasHoy}</span> Bultos vendidos hoy</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800/50">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400"><DollarSign size={24} /></div>
                                <span className="text-xs font-bold text-slate-400 uppercase">Periodo</span>
                            </div>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-1">{stats.ingresosPeriodo.toFixed(2)} <span className="text-sm font-normal text-slate-500">Bs</span></h3>
                            <p className="text-sm text-slate-500">Total ingresos en fechas seleccionadas</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800/50">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400"><TrendingDown size={24} className="rotate-180" /></div>
                                <span className="text-xs font-bold text-slate-400 uppercase">Entradas</span>
                            </div>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-1">{stats.costoComprasPeriodo.toFixed(2)} <span className="text-sm font-normal text-slate-500">Bs</span></h3>
                            <p className="text-sm text-slate-500 flex items-center gap-1"><span className="font-bold text-slate-800 dark:text-slate-300">{stats.comprasPeriodo}</span> Bultos ingresados</p>
                        </div>
                        <div className={`p-6 rounded-2xl shadow-lg border ${
                            gananciaNetaPeriodo === null
                                ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/50'
                                : gananciaNetaPeriodo >= 0
                                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/40'
                                    : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/40'
                        }`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className={`p-3 rounded-xl ${
                                    gananciaNetaPeriodo === null ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                    : gananciaNetaPeriodo >= 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                }`}><Zap size={24} /></div>
                                <span className="text-xs font-bold text-slate-400 uppercase">Ganancia Neta</span>
                            </div>
                            {gananciaNetaPeriodo !== null ? (
                                <>
                                    <h3 className={`text-3xl font-black mb-1 ${gananciaNetaPeriodo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {gananciaNetaPeriodo.toFixed(2)} <span className="text-sm font-normal text-slate-400">Bs</span>
                                    </h3>
                                    <p className="text-sm text-slate-500">Ventas − costo real por bulto (USD)</p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-3xl font-black mb-1 text-slate-400">—</h3>
                                    <p className="text-xs text-slate-400">Registra compras en USD para ver la ganancia real</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Gráfico Mensual */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                            <TrendingUp className="text-orange-500" size={20} />
                            Ventas vs Compras — Últimos 6 meses
                        </h3>
                        {monthlyData.every(d => d.ventas === 0 && d.compras === 0) ? (
                            <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">Sin movimientos registrados en los últimos 6 meses.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barGap={4}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', backgroundColor: '#1e293b', color: '#fff' }} formatter={(val: any, name: any) => [`${Number(val).toFixed(2)} Bs`, name === 'ventas' ? 'Ventas' : 'Compras'] as [string, string]} />
                                        <Legend formatter={(val) => val === 'ventas' ? 'Ventas (Bs)' : 'Compras (Bs)'} />
                                        <Bar dataKey="ventas" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={28} />
                                        <Bar dataKey="compras" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={28} />
                                    </BarChart>
                                </ResponsiveContainer>
                        )}
                    </div>

                    {/* Filtros */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            {['ALL', 'VENTA', 'ENTRADA', 'AJUSTE'].map(t => (
                                <button key={t} onClick={() => setFilterType(t)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${filterType === t
                                        ? t === 'VENTA' ? 'bg-green-500 text-white' : t === 'ENTRADA' ? 'bg-blue-500 text-white' : t === 'AJUSTE' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                    {t === 'ALL' ? 'Todos' : t === 'VENTA' ? 'Ventas' : t === 'ENTRADA' ? 'Entradas' : 'Ajustes'}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="text" placeholder="Buscar por producto, detalle..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none transition-all text-sm" />
                        </div>
                    </div>

                    {/* Tabla movimientos */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Fecha</th>
                                        <th className="px-6 py-4">Tipo</th>
                                        <th className="px-6 py-4">Producto</th>
                                        <th className="px-6 py-4 text-center">Cantidad</th>
                                        <th className="px-6 py-4 text-right">Precio Total</th>
                                        <th className="px-6 py-4 text-right">Ganancia</th>
                                        <th className="px-6 py-4">Detalle / Cliente</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {loading ? (
                                        <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>Cargando...
                                        </td></tr>
                                    ) : filteredMovimientos.length === 0 ? (
                                        <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No se encontraron movimientos en este periodo.</td></tr>
                                    ) : filteredMovimientos.map((mov) => {
                                        const pid = mov.zapato_id || mov.producto_id
                                        const costoProm = pid ? (costosMap[pid] || 0) : 0
                                        const isVenta = mov.tipo === 'VENTA'
                                        const ganancia = isVenta && costoProm > 0
                                            ? (mov.precio_total || 0) - (Number(mov.cantidad) * costoProm)
                                            : null
                                        return (
                                            <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{new Date(mov.fecha).toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${mov.tipo === 'VENTA' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : mov.tipo === 'ENTRADA' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>{mov.tipo}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800 dark:text-slate-200">{mov.zapatos?.nombre || 'Producto Desconocido'}</div>
                                                    <div className="text-xs text-slate-400">{mov.zapatos?.categoria}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">{mov.cantidad}</td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{mov.precio_total ? `${mov.precio_total} Bs` : '-'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    {ganancia !== null ? (
                                                        <span className={`font-black text-sm ${ganancia >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            {ganancia >= 0 ? '+' : ''}{ganancia.toFixed(2)} Bs
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300 dark:text-slate-600 text-xs">Sin costo reg.</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 text-xs max-w-xs truncate" title={mov.detalle}>{mov.detalle || '-'}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== TAB: INVENTARIO ===== */}
            {activeTab === 'inventario' && (
                <div>
                    <div className="flex items-center justify-between mb-6 mt-4">
                        <p className="text-slate-500 text-sm">
                            {inventario.length} productos · Capital total: <span className="font-black text-orange-500">{inventario.reduce((s, p) => s + (p.stock_bultos || 0) * (p.precio_costo || 0), 0).toFixed(2)} Bs</span>
                        </p>
                        <button onClick={exportInventarioPDF} disabled={loadingInv || inventario.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50">
                            <Download size={16} /> Exportar PDF
                        </button>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Producto</th>
                                        <th className="px-6 py-4">Cód. / Caja</th>
                                        <th className="px-6 py-4">Categoría</th>
                                        <th className="px-6 py-4 text-center">Stock</th>
                                        <th className="px-6 py-4 text-right">Costo Unit.</th>
                                        <th className="px-6 py-4 text-right">Valor Total</th>
                                        <th className="px-6 py-4 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {loadingInv ? (
                                        <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>Cargando inventario...
                                        </td></tr>
                                    ) : inventario.map((p, i) => {
                                        const valorTotal = (p.stock_bultos || 0) * (p.precio_costo || 0)
                                        return (
                                            <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${p.stock_bultos === 0 ? 'opacity-50' : ''}`}>
                                                <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{p.nombre}</td>
                                                <td className="px-6 py-4 text-slate-500 text-xs">{p.codigo || p.caja || '—'}</td>
                                                <td className="px-6 py-4 text-slate-500">{p.categoria || '—'}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`font-black text-sm px-2 py-0.5 rounded-full ${p.stock_bultos === 0 ? 'bg-red-100 text-red-600' : p.stock_bultos <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                                        {p.stock_bultos || 0}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">{p.precio_costo ? `${p.precio_costo.toFixed(2)} Bs` : <span className="text-slate-300">—</span>}</td>
                                                <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white">{valorTotal > 0 ? `${valorTotal.toFixed(2)} Bs` : <span className="text-slate-300 font-normal">—</span>}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.disponible ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {p.disponible ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== TAB: RENTABILIDAD ===== */}
            {activeTab === 'rentabilidad' && (
                <div className="mt-4">
                    {/* Tarjetas resumen */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl border border-slate-700">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-3 bg-green-900/40 rounded-xl text-green-400"><DollarSign size={22} /></div>
                                <span className="text-xs font-bold text-slate-400 uppercase">Total Invertido $</span>
                            </div>
                            <h3 className="text-3xl font-black text-white mb-1">${rentStats.totalUSD.toLocaleString()}</h3>
                            <p className="text-sm text-slate-400">USD total en {rentStats.registros} compras registradas</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-900/50 to-slate-900 p-6 rounded-2xl shadow-xl border border-orange-900/50">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-3 bg-orange-900/40 rounded-xl text-orange-400"><Package size={22} /></div>
                                <span className="text-xs font-bold text-slate-400 uppercase">Total Invertido Bs</span>
                            </div>
                            <h3 className="text-3xl font-black text-orange-300 mb-1">{rentStats.totalBs.toLocaleString()} Bs</h3>
                            <p className="text-sm text-slate-400">A tipo de cambio registrado por compra</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-900/30 to-slate-900 p-6 rounded-2xl shadow-xl border border-green-900/50">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-3 bg-green-900/40 rounded-xl text-green-400"><TrendingUp size={22} /></div>
                                <span className="text-xs font-bold text-slate-400 uppercase">Modelos con registro</span>
                            </div>
                            <h3 className="text-3xl font-black text-green-300 mb-1">{comprasAgrupadas.length}</h3>
                            <p className="text-sm text-slate-400">Productos con historial de compra USD</p>
                        </div>
                    </div>

                    {/* Tabla por producto */}
                    {loadingRent ? (
                        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div></div>
                    ) : comprasAgrupadas.length === 0 ? (
                        <div className="bg-slate-900 rounded-2xl p-12 text-center border border-slate-800">
                            <DollarSign size={40} className="text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 font-bold">Aún no hay compras registradas.</p>
                            <p className="text-slate-600 text-sm mt-1">Ve a un producto y usa el panel <strong className="text-green-400">"Historial de Compras (USD → Bs)"</strong> para comenzar.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {comprasAgrupadas.map((item: any) => (
                                <div key={item.producto_id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
                                    {/* Header del producto */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                        <div>
                                            <h4 className="font-black text-slate-800 dark:text-white">{item.nombre}</h4>
                                            <p className="text-xs text-slate-400">{item.categoria} · Cód: {item.codigo} · Stock actual: <span className="font-bold text-slate-600 dark:text-slate-300">{item.stock_actual} bultos</span></p>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="text-center">
                                                <p className="text-[10px] text-slate-400 uppercase font-bold">Costo Prom. Bulto</p>
                                                <p className="text-lg font-black text-orange-500">{item.costoProm.toFixed(2)} Bs</p>
                                            </div>
                                            {item.margen !== null && (
                                                <div className={`text-center px-3 py-1 rounded-xl ${item.margen > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                                    <p className="text-[10px] font-bold uppercase text-slate-500">Margen est.</p>
                                                    <p className={`text-lg font-black ${item.margen > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600'}`}>{item.margen.toFixed(1)}%</p>
                                                    <p className="text-[9px] text-slate-400">Ref: {item.pvRef} Bs</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Detalle de compras */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead className="text-slate-400 uppercase font-bold border-b border-slate-100 dark:border-slate-800">
                                                <tr>
                                                    <th className="px-5 py-2 text-left">Fecha</th>
                                                    <th className="px-5 py-2 text-right">Precio Caja</th>
                                                    <th className="px-5 py-2 text-center">Bultos</th>
                                                    <th className="px-5 py-2 text-center">TC (Bs/$)</th>
                                                    <th className="px-5 py-2 text-right">Caja en Bs</th>
                                                    <th className="px-5 py-2 text-right">Costo x Bulto</th>
                                                    <th className="px-5 py-2 text-left">Notas</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                                {item.compras.map((c: any) => (
                                                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                        <td className="px-5 py-2.5 text-slate-500">{new Date(c.fecha).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                        <td className="px-5 py-2.5 text-right font-bold text-slate-700 dark:text-slate-200">${Number(c.precio_usd).toLocaleString()}</td>
                                                        <td className="px-5 py-2.5 text-center text-slate-600 dark:text-slate-300">{c.bultos_qty}</td>
                                                        <td className="px-5 py-2.5 text-center text-slate-600 dark:text-slate-300">{c.tipo_cambio} Bs</td>
                                                        <td className="px-5 py-2.5 text-right font-bold text-slate-700 dark:text-slate-200">{Number(c.costo_bs_total).toLocaleString()} Bs</td>
                                                        <td className="px-5 py-2.5 text-right font-black text-orange-600 dark:text-orange-400">{Number(c.costo_bs_por_bulto).toFixed(2)} Bs</td>
                                                        <td className="px-5 py-2.5 text-slate-400 italic">{c.notas || '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
