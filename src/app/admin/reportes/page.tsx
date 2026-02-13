'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, FileText, Calendar, Download, Search, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import Link from 'next/link'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

    useEffect(() => {
        loadMovimientos()
    }, [startDate, endDate]) // Recargar cuando cambian fechas

    useEffect(() => {
        applyFilters()
    }, [movimientos, searchTerm, filterType])

    const loadMovimientos = async () => {
        setLoading(true)

        // Crear fechas locales y ajustar a inicio/fin del día
        const start = new Date(startDate + 'T00:00:00')
        const end = new Date(endDate + 'T23:59:59.999')

        console.log('Consultando rango:', start.toISOString(), end.toISOString())

        const { data, error } = await supabase
            .from('movimientos_kardex')
            .select(`
                *,
                zapatos (nombre, codigo, categoria)
            `)
            .gte('fecha', start.toISOString())
            .lte('fecha', end.toISOString())
            .order('fecha', { ascending: false })

        if (error) {
            console.error('Error cargando movimientos:', error)
            alert('Error al cargar reportes: ' + error.message)
        } else {
            console.log('Movimientos encontrados:', data?.length)
            setMovimientos(data || [])
            calculateStats(data || [])
        }
        setLoading(false)
    }

    const calculateStats = (data: any[]) => {
        const today = new Date().toISOString().split('T')[0]

        let ventasHoy = 0
        let ingresosHoy = 0
        let ventasPeriodo = 0
        let ingresosPeriodo = 0
        let comprasPeriodo = 0
        let costoComprasPeriodo = 0

        data.forEach(m => {
            const fechaMov = new Date(m.fecha).toISOString().split('T')[0]
            const isVenta = m.tipo === 'VENTA'
            const isEntrada = m.tipo === 'ENTRADA'
            const precioTotal = m.precio_total || 0

            // Comparar fechas usando locale string para evitar problemas de zona horaria en contador "Hoy"
            const fechaMovStr = new Date(m.fecha).toLocaleDateString()
            const todayStr = new Date().toLocaleDateString()

            // Stats Periodo (Todo lo cargado)
            if (isVenta) {
                ventasPeriodo += m.cantidad
                ingresosPeriodo += precioTotal
            } else if (isEntrada) {
                comprasPeriodo += m.cantidad
                costoComprasPeriodo += precioTotal
            }

            // Stats Hoy
            if (fechaMovStr === todayStr) {
                if (isVenta) {
                    ventasHoy += m.cantidad
                    ingresosHoy += precioTotal
                }
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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 md:p-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/dashboard" className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                            <FileText className="text-brand-orange" size={32} />
                            Reportes
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Historial de movimientos y ventas</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
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
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Ventas Hoy */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800/50">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Hoy</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-1">
                        {stats.ingresosHoy.toFixed(2)} <span className="text-sm font-normal text-slate-500">Bs</span>
                    </h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                        <span className="font-bold text-green-500">{stats.ventasHoy}</span> Bultos vendidos hoy
                    </p>
                </div>

                {/* Ventas Periodo */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800/50">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                            <DollarSign size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Periodo</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-1">
                        {stats.ingresosPeriodo.toFixed(2)} <span className="text-sm font-normal text-slate-500">Bs</span>
                    </h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                        Total ingresos en fechas seleccionadas
                    </p>
                </div>

                {/* Entradas / Compras Periodo */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800/50">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                            <TrendingDown size={24} className="rotate-180" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Entradas</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-1">
                        {stats.costoComprasPeriodo.toFixed(2)} <span className="text-sm font-normal text-slate-500">Bs</span>
                    </h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                        <span className="font-bold text-slate-800 dark:text-slate-300">{stats.comprasPeriodo}</span> Bultos ingresados
                    </p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setFilterType('ALL')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${filterType === 'ALL' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterType('VENTA')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${filterType === 'VENTA' ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                        Ventas
                    </button>
                    <button
                        onClick={() => setFilterType('ENTRADA')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${filterType === 'ENTRADA' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                        Entradas
                    </button>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por producto, detalle..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none transition-all text-sm"
                    />
                </div>
            </div>

            {/* Table */}
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
                                <th className="px-6 py-4">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto mb-2"></div>
                                        Cargando movimientos...
                                    </td>
                                </tr>
                            ) : filteredMovimientos.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        No se encontraron movimientos en este periodo.
                                    </td>
                                </tr>
                            ) : (
                                filteredMovimientos.map((mov) => (
                                    <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {new Date(mov.fecha).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase
                                                ${mov.tipo === 'VENTA' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    mov.tipo === 'ENTRADA' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>
                                                {mov.tipo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800 dark:text-slate-200">
                                                {mov.zapatos?.nombre || 'Producto Desconocido'}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {mov.zapatos?.categoria}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                                            {mov.cantidad}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                                            {mov.precio_total ? `${mov.precio_total} Bs` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs max-w-xs truncate" title={mov.detalle}>
                                            {mov.detalle || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
