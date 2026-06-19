'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import {
    ArrowLeft, Plus, Trash2, Search, Download, PackagePlus,
    Truck, X, CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface LineaCompra {
    producto_id: string
    nombre: string
    codigo: string
    precio_usd: number | string
    bultos_qty: number | string
    precio_venta_ref: number | string
    notas: string
    variante_idx?: number
    talla_rango?: string
}

interface Producto {
    id: string
    nombre: string
    codigo: string | null
    caja: string | null
    cat_obj: any
    stock_bultos: number
    variantes_tallas?: any[]
}

interface Proveedor {
    id: string
    nombre: string
    pais: string | null
}

export default function ComprasPage() {
    const { profile } = useAuth()
    const [productos, setProductos] = useState<Producto[]>([])
    const [proveedores, setProveedores] = useState<Proveedor[]>([])
    const [proveedorId, setProveedorId] = useState('')
    const [tipoCambio, setTipoCambio] = useState<number | string>('')
    const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0])
    const [searchTerm, setSearchTerm] = useState('')
    const [showSearch, setShowSearch] = useState(false)
    const [lineas, setLineas] = useState<LineaCompra[]>([])
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        loadProductos()
        loadProveedores()
    }, [])

    const loadProductos = async () => {
        const { data } = await supabase
            .from('zapatos')
            .select('id, nombre, codigo, caja, cat_obj:categorias(nombre), stock_bultos, variantes_tallas')
            .order('nombre')
        setProductos(data || [])
    }

    const loadProveedores = async () => {
        const { data } = await supabase
            .from('proveedores')
            .select('id, nombre, pais')
            .eq('activo', true)
            .order('nombre')
        setProveedores(data || [])
    }

    const filteredProductos = productos.filter(p => {
        const term = searchTerm.toLowerCase()
        const catNombre = p.cat_obj?.nombre || ''
        return (
            p.nombre.toLowerCase().includes(term) ||
            p.codigo?.toLowerCase().includes(term) ||
            p.caja?.toLowerCase().includes(term) ||
            catNombre.toLowerCase().includes(term)
        )
    })

    const agregarProducto = (p: Producto, varianteIdx?: number, variant?: any) => {
        const existeIdx = lineas.findIndex(l =>
            l.producto_id === p.id && l.variante_idx === varianteIdx
        )

        if (existeIdx >= 0) {
            setLineas(lineas.map((l, i) =>
                i === existeIdx ? { ...l, bultos_qty: Number(l.bultos_qty) + 1 } : l
            ))
        } else {
            setLineas([...lineas, {
                producto_id: p.id,
                nombre: p.nombre,
                codigo: p.codigo || p.caja || '—',
                precio_usd: '',
                bultos_qty: 1,
                precio_venta_ref: '',
                notas: '',
                variante_idx: varianteIdx,
                talla_rango: variant?.rango
            }])
        }
        setSearchTerm('')
        setShowSearch(false)
    }

    const updateLinea = (idx: number, field: keyof LineaCompra, value: any) => {
        setLineas(lineas.map((l, i) => i === idx ? { ...l, [field]: value } : l))
    }

    const removeLinea = (idx: number) => {
        setLineas(lineas.filter((_, i) => i !== idx))
    }

    const tc = Number(tipoCambio) || 0
    const totalUSD = lineas.reduce((sum, l) => sum + (Number(l.precio_usd) || 0), 0)
    const totalBs = totalUSD * tc

    const limpiarFormulario = () => {
        setProveedorId('')
        setTipoCambio('')
        setLineas([])
        setSuccess(false)
    }

    const handleGuardarYDescargar = async () => {
        if (!tc || tc <= 0) return alert('Ingresa el tipo de cambio (Bs por USD).')
        if (lineas.length === 0) return alert('Agrega al menos un producto.')
        const incompletas = lineas.filter(l => !Number(l.precio_usd) || !Number(l.bultos_qty))
        if (incompletas.length > 0) return alert(`Falta el precio USD o los bultos en: ${incompletas.map(l => l.nombre).join(', ')}`)

        setSaving(true)
        try {
            // Mapa en memoria del stock para reflejar correctamente cuando hay
            // varias líneas del mismo producto (igual que en Ventas)
            const stockMap: { [id: string]: { stock_bultos: number; variantes_tallas: any[] } } = {}
            for (const p of productos) {
                stockMap[p.id] = {
                    stock_bultos: p.stock_bultos,
                    variantes_tallas: p.variantes_tallas ? p.variantes_tallas.map(v => ({ ...v })) : []
                }
            }

            for (const linea of lineas) {
                const usd = Number(linea.precio_usd)
                const qty = Number(linea.bultos_qty)
                const costoTotal = usd * tc
                const costoPorBulto = qty > 0 ? costoTotal / qty : 0

                // 1. Registrar la compra (financiero)
                const { error: compraError } = await supabase.from('compras_producto').insert({
                    producto_id: linea.producto_id,
                    proveedor_id: proveedorId || null,
                    fecha,
                    precio_usd: usd,
                    bultos_qty: qty,
                    tipo_cambio: tc,
                    precio_venta_ref: Number(linea.precio_venta_ref) || null,
                    notas: linea.notas
                        ? linea.notas
                        : (linea.talla_rango ? `Talla: ${linea.talla_rango}` : null),
                    usuario_id: profile?.id ?? null
                })
                if (compraError) throw compraError

                // 2. Actualizar stock usando el mapa en memoria
                const stock = stockMap[linea.producto_id]
                if (stock) {
                    const actualizaciones: any = { precio_costo: costoPorBulto }

                    if (
                        stock.variantes_tallas.length > 0 &&
                        linea.variante_idx !== undefined &&
                        stock.variantes_tallas[linea.variante_idx]
                    ) {
                        const variantStock = Number(stock.variantes_tallas[linea.variante_idx].stock_bultos) || 0
                        stock.variantes_tallas[linea.variante_idx].stock_bultos = variantStock + qty
                        stock.stock_bultos = stock.variantes_tallas.reduce(
                            (acc, v) => acc + (Number(v.stock_bultos) || 0), 0
                        )
                        actualizaciones.variantes_tallas = stock.variantes_tallas
                    } else {
                        stock.stock_bultos = stock.stock_bultos + qty
                    }
                    actualizaciones.stock_bultos = stock.stock_bultos

                    const { error: stockError } = await supabase.from('zapatos')
                        .update(actualizaciones)
                        .eq('id', linea.producto_id)
                    if (stockError) throw stockError
                }

                // 3. Registrar movimiento ENTRADA en kardex
                const tallaInfo = linea.talla_rango ? ` (Talla: ${linea.talla_rango})` : ''
                const { error: kardexError } = await supabase.from('movimientos_kardex').insert({
                    producto_id: linea.producto_id,
                    tipo: 'ENTRADA',
                    cantidad: qty,
                    precio_total: costoTotal,
                    detalle: `Compra registrada${tallaInfo}: $${usd} USD × TC ${tc} = ${costoTotal.toFixed(2)} Bs (${qty} bultos)`,
                    fecha: new Date().toISOString(),
                    usuario_id: profile?.id ?? null
                })
                if (kardexError) throw kardexError
            }

            generarPDF()
            setSuccess(true)
            loadProductos()
        } catch (err: any) {
            console.error(err)
            alert('Error al guardar la compra: ' + (err?.message || 'Intenta de nuevo.'))
        }
        setSaving(false)
    }

    const generarPDF = () => {
        const doc = new jsPDF()
        const ahora = new Date()
        const fechaHora = ahora.toLocaleString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        })
        const fechaSolo = new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
        const nroOrden = ahora.getTime().toString().slice(-7)
        const proveedorNombre = proveedores.find(p => p.id === proveedorId)?.nombre || 'No especificado'

        doc.setFillColor(30, 41, 59)
        doc.rect(0, 0, 210, 36, 'F')

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(22)
        doc.setFont('helvetica', 'bold')
        doc.text('ACTIVA SPORT', 14, 14)

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text('Importación y distribución de calzado deportivo', 14, 21)
        doc.text('Cochabamba, Bolivia  ·  Tel: +591 70000000  ·  activasport@gmail.com', 14, 28)

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('ORDEN DE COMPRA', 196, 12, { align: 'right' })
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(`N° ${nroOrden}`, 196, 20, { align: 'right' })

        doc.setFillColor(241, 245, 249)
        doc.roundedRect(130, 38, 66, 20, 3, 3, 'F')
        doc.setTextColor(71, 85, 105)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.text('FECHA DE COMPRA', 163, 44, { align: 'center' })
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(51, 65, 85)
        doc.text(fechaSolo, 163, 50, { align: 'center' })
        doc.setFontSize(8)
        doc.text(`TC: ${tc} Bs/$`, 163, 56, { align: 'center' })

        doc.setTextColor(30, 30, 30)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('PROVEEDOR:', 14, 46)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(11)
        doc.text(proveedorNombre.toUpperCase(), 14, 54)

        doc.setDrawColor(30, 41, 59)
        doc.setLineWidth(0.5)
        doc.line(14, 62, 196, 62)
        doc.setLineWidth(0.2)
        doc.setDrawColor(220, 220, 220)

        const tableRows = lineas.map((l, i) => [
            i + 1,
            l.talla_rango ? `${l.nombre} (Talla: ${l.talla_rango})` : l.nombre,
            l.codigo,
            l.bultos_qty,
            `$${Number(l.precio_usd).toFixed(2)}`,
            `${(Number(l.precio_usd) * tc).toFixed(2)} Bs`,
        ])

        autoTable(doc, {
            startY: 66,
            head: [['#', 'Producto', 'Cód./Caja', 'Bultos', 'Precio USD', 'Costo Bs']],
            body: tableRows,
            styles: { fontSize: 9, cellPadding: 4 },
            headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'right' },
                5: { halign: 'right', fontStyle: 'bold' },
            },
        })

        const finalY = (doc as any).lastAutoTable.finalY + 8
        doc.setFillColor(30, 41, 59)
        doc.roundedRect(110, finalY, 86, 18, 4, 4, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.text(`TOTAL: $${totalUSD.toFixed(2)} (${totalBs.toFixed(2)} Bs)`, 153, finalY + 11, { align: 'center' })

        const pieY = finalY + 34
        doc.setDrawColor(220, 220, 220)
        doc.line(14, pieY - 4, 196, pieY - 4)

        doc.setTextColor(130, 130, 130)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'bold')
        doc.text('ACTIVA SPORT', 105, pieY, { align: 'center' })
        doc.setFont('helvetica', 'normal')
        doc.text('Importación y distribución de calzado deportivo · Santa Cruz, Bolivia', 105, pieY + 5, { align: 'center' })
        doc.text(`Emitido: ${fechaHora}`, 105, pieY + 10, { align: 'center' })
        doc.setFontSize(7)
        doc.setTextColor(200, 200, 200)
        doc.text('Documento interno de control de compras', 105, pieY + 16, { align: 'center' })

        const nombreProv = proveedorNombre.replace(/\s+/g, '_').toLowerCase()
        doc.save(`orden_compra_${nombreProv}_${fechaSolo.replace(/\//g, '-')}.pdf`)
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black uppercase flex items-center gap-2">
                                <Truck className="text-cyan-600" size={26} />
                                Nueva Compra
                            </h1>
                            <p className="text-slate-500 text-sm">Registra mercadería recibida de un proveedor</p>
                        </div>
                    </div>
                    <Link href="/admin/proveedores" className="text-sm text-cyan-600 hover:underline font-bold hidden md:block">
                        Ver Proveedores →
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

                {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-400 rounded-2xl p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="text-green-500" size={28} />
                            <div>
                                <p className="font-black text-green-700 dark:text-green-400">¡Compra registrada y PDF descargado!</p>
                                <p className="text-sm text-green-600 dark:text-green-500">El stock ya fue actualizado y el movimiento aparece en Reportes.</p>
                            </div>
                        </div>
                        <button onClick={limpiarFormulario} className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors text-sm">
                            Nueva Compra
                        </button>
                    </div>
                )}

                {/* Datos generales */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                                <Truck size={13} className="inline mr-1" />
                                Proveedor
                            </label>
                            <select
                                value={proveedorId}
                                onChange={e => setProveedorId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-cyan-400 text-sm font-bold transition-all"
                            >
                                <option value="">Sin especificar</option>
                                {proveedores.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre}{p.pais ? ` (${p.pais})` : ''}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                                Fecha
                            </label>
                            <input
                                type="date"
                                value={fecha}
                                onChange={e => setFecha(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-cyan-400 text-sm font-bold transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                                Tipo de Cambio (Bs/$) *
                            </label>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                placeholder="Ej: 9.25"
                                value={tipoCambio}
                                onChange={e => setTipoCambio(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-cyan-400 text-sm font-bold transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Agregar Productos */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <PackagePlus size={18} className="text-cyan-600" />
                            Productos Recibidos
                        </h2>
                        <button
                            onClick={() => setShowSearch(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-sm shadow-md transition-all"
                        >
                            <Plus size={16} /> Agregar Producto
                        </button>
                    </div>

                    {showSearch && (
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    autoFocus
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Nombre, código, caja o categoría..."
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-cyan-300 dark:border-cyan-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-400 text-sm"
                                />
                                <button onClick={() => { setShowSearch(false); setSearchTerm('') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                                    <X size={16} />
                                </button>
                            </div>
                            {searchTerm && (
                                <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xl max-h-60 overflow-y-auto">
                                    {filteredProductos.length === 0 ? (
                                        <p className="text-center py-4 text-slate-400 text-sm">Sin resultados</p>
                                    ) : filteredProductos.map(p => {
                                        const hasVariants = p.variantes_tallas && p.variantes_tallas.length > 0

                                        if (!hasVariants) {
                                            return (
                                                <button
                                                    key={p.id}
                                                    onClick={() => agregarProducto(p)}
                                                    className="w-full text-left px-4 py-3 bg-white dark:bg-slate-900 hover:bg-cyan-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"
                                                >
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-800 dark:text-white">{p.nombre}</p>
                                                        <p className="text-xs text-slate-400">{p.codigo || p.caja} · {p.cat_obj?.nombre || ''}</p>
                                                    </div>
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                        {p.stock_bultos} bultos
                                                    </span>
                                                </button>
                                            )
                                        }

                                        return p.variantes_tallas!.map((v: any, vIdx: number) => (
                                            <button
                                                key={`${p.id}-${vIdx}`}
                                                onClick={() => agregarProducto(p, vIdx, v)}
                                                className="w-full text-left px-4 py-3 bg-white dark:bg-slate-900 hover:bg-cyan-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"
                                            >
                                                <div>
                                                    <p className="font-bold text-sm text-slate-800 dark:text-white">{p.nombre} <span className="text-cyan-600 font-black">[{v.rango}]</span></p>
                                                    <p className="text-xs text-slate-400">{p.codigo || p.caja} · {p.cat_obj?.nombre || ''} · {v.pares_por_bulto} pares/bulto</p>
                                                </div>
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                    {Number(v.stock_bultos) || 0} bultos
                                                </span>
                                            </button>
                                        ))
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {lineas.length === 0 ? (
                        <div className="text-center py-10 text-slate-300 dark:text-slate-700">
                            <PackagePlus size={40} className="mx-auto mb-2 opacity-40" />
                            <p className="text-sm">Agrega productos para registrar la compra</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="hidden md:grid grid-cols-12 gap-3 text-xs font-black text-slate-400 uppercase px-2">
                                <div className="col-span-4">Producto</div>
                                <div className="col-span-2 text-center">Bultos</div>
                                <div className="col-span-2 text-right">Precio USD</div>
                                <div className="col-span-2 text-right">Costo Bs</div>
                                <div className="col-span-2 text-right">Venta Ref.</div>
                            </div>

                            {lineas.map((linea, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="col-span-11 md:col-span-4">
                                        <p className="font-bold text-sm text-slate-800 dark:text-white leading-tight">
                                            {linea.nombre} {linea.talla_rango && <span className="text-cyan-600">[{linea.talla_rango}]</span>}
                                        </p>
                                        <p className="text-xs text-slate-400">{linea.codigo}</p>
                                    </div>
                                    <input
                                        type="number"
                                        min={0.5}
                                        step={0.5}
                                        value={linea.bultos_qty}
                                        onChange={e => updateLinea(idx, 'bultos_qty', Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                                        className="col-span-6 md:col-span-2 text-center px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-400"
                                    />
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        placeholder="0.00"
                                        value={linea.precio_usd}
                                        onChange={e => updateLinea(idx, 'precio_usd', e.target.value)}
                                        className="col-span-5 md:col-span-2 text-right px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-400"
                                    />
                                    <div className="col-span-4 md:col-span-2 text-right">
                                        <p className="font-black text-slate-800 dark:text-white text-sm">
                                            {((Number(linea.precio_usd) || 0) * tc).toFixed(2)} <span className="text-xs font-normal text-slate-400">Bs</span>
                                        </p>
                                    </div>
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        placeholder="Opcional"
                                        value={linea.precio_venta_ref}
                                        onChange={e => updateLinea(idx, 'precio_venta_ref', e.target.value)}
                                        className="col-span-7 md:col-span-2 text-right px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-400"
                                    />
                                    <button onClick={() => removeLinea(idx)} className="col-span-1 text-red-400 hover:text-red-600 transition-colors flex justify-end">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            ))}

                            <div className="flex justify-end pt-2">
                                <div className="bg-cyan-700 text-white rounded-2xl px-8 py-4 text-right shadow-lg shadow-cyan-700/20">
                                    <p className="text-xs font-bold uppercase opacity-75">Total</p>
                                    <p className="text-3xl font-black">${totalUSD.toFixed(2)} <span className="text-lg font-normal opacity-80">({totalBs.toFixed(2)} Bs)</span></p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {lineas.length > 0 && !success && (
                    <button
                        onClick={handleGuardarYDescargar}
                        disabled={saving}
                        className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all disabled:opacity-60"
                    >
                        <Download size={22} />
                        {saving ? 'Guardando...' : 'Guardar Compra y Descargar PDF'}
                    </button>
                )}
            </div>
        </div>
    )
}
