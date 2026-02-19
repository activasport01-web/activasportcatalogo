'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
    ArrowLeft, Plus, Trash2, Search, Download, ShoppingCart,
    User, Package, X, CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface LineaVenta {
    producto_id: string
    nombre: string
    codigo: string
    cantidad: number
    precio_unitario: number
}

interface Producto {
    id: string
    nombre: string
    codigo: string | null
    caja: string | null
    categoria: string
    stock_bultos: number
}

export default function VentasPage() {
    const [productos, setProductos] = useState<Producto[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showSearch, setShowSearch] = useState(false)
    const [cliente, setCliente] = useState('')
    const [lineas, setLineas] = useState<LineaVenta[]>([])
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)

    useEffect(() => { loadProductos() }, [])

    const loadProductos = async () => {
        const { data } = await supabase
            .from('zapatos')
            .select('id, nombre, codigo, caja, categoria, stock_bultos')
            .eq('disponible', true)
            .gt('stock_bultos', 0)
            .order('nombre')
        setProductos(data || [])
    }

    const filteredProductos = productos.filter(p => {
        const term = searchTerm.toLowerCase()
        return (
            p.nombre.toLowerCase().includes(term) ||
            p.codigo?.toLowerCase().includes(term) ||
            p.caja?.toLowerCase().includes(term) ||
            p.categoria?.toLowerCase().includes(term)
        )
    })

    const agregarProducto = (p: Producto) => {
        const existe = lineas.find(l => l.producto_id === p.id)
        if (existe) {
            setLineas(lineas.map(l =>
                l.producto_id === p.id ? { ...l, cantidad: l.cantidad + 1 } : l
            ))
        } else {
            setLineas([...lineas, {
                producto_id: p.id,
                nombre: p.nombre,
                codigo: p.codigo || p.caja || '—',
                cantidad: 1,
                precio_unitario: 0,
            }])
        }
        setSearchTerm('')
        setShowSearch(false)
    }

    const updateLinea = (idx: number, field: keyof LineaVenta, value: any) => {
        setLineas(lineas.map((l, i) => i === idx ? { ...l, [field]: value } : l))
    }

    const removeLinea = (idx: number) => {
        setLineas(lineas.filter((_, i) => i !== idx))
    }

    const total = lineas.reduce((sum, l) => sum + l.cantidad * l.precio_unitario, 0)

    const limpiarFormulario = () => {
        setCliente('')
        setLineas([])
        setSuccess(false)
    }

    const handleGuardarYDescargar = async () => {
        if (!cliente.trim()) return alert('Ingresa el nombre del cliente.')
        if (lineas.length === 0) return alert('Agrega al menos un producto.')
        const sinPrecio = lineas.filter(l => l.precio_unitario <= 0)
        if (sinPrecio.length > 0) return alert(`Falta el precio en: ${sinPrecio.map(l => l.nombre).join(', ')}`)

        setSaving(true)
        try {
            // 1. Guardar en movimientos_kardex + actualizar stock
            for (const linea of lineas) {
                const precioTotal = linea.cantidad * linea.precio_unitario

                // Registrar movimiento
                await supabase.from('movimientos_kardex').insert({
                    zapato_id: linea.producto_id,
                    tipo: 'VENTA',
                    cantidad: linea.cantidad,
                    precio_total: precioTotal,
                    detalle: `Nota de venta — Cliente: ${cliente}`,
                    fecha: new Date().toISOString(),
                })

                // Actualizar stock
                const prod = productos.find(p => p.id === linea.producto_id)
                if (prod) {
                    await supabase.from('zapatos')
                        .update({ stock_bultos: Math.max(0, prod.stock_bultos - linea.cantidad) })
                        .eq('id', linea.producto_id)
                }
            }

            // 2. Generar PDF
            generarPDF()

            setSuccess(true)
            loadProductos() // Recargar stock actualizado
        } catch (err) {
            console.error(err)
            alert('Error al guardar la venta. Intenta de nuevo.')
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
        const fechaSolo = ahora.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
        const horaSolo = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        const nroNota = ahora.getTime().toString().slice(-7)

        // ── ENCABEZADO NARANJA ──────────────────────────────────────────
        doc.setFillColor(249, 115, 22)
        doc.rect(0, 0, 210, 36, 'F')

        // Nombre empresa
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(22)
        doc.setFont('helvetica', 'bold')
        doc.text('ACTIVA SPORT', 14, 14)

        // Subtítulo
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text('Importación y distribución de calzado deportivo', 14, 21)
        doc.text('Cochabamba, Bolivia  ·  Tel: +591 70000000  ·  activasport@gmail.com', 14, 28)

        // Número de nota + tipo (derecha)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('NOTA DE VENTA', 196, 12, { align: 'right' })
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(`N° ${nroNota}`, 196, 20, { align: 'right' })

        // ── BLOQUE FECHA / HORA ─────────────────────────────────────────
        doc.setFillColor(255, 245, 235)     // fondo naranja muy claro
        doc.roundedRect(130, 38, 66, 20, 3, 3, 'F')
        doc.setTextColor(180, 80, 10)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.text('FECHA DE VENTA', 163, 44, { align: 'center' })
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(120, 50, 5)
        doc.text(fechaSolo, 163, 50, { align: 'center' })
        doc.setFontSize(8)
        doc.text(horaSolo, 163, 56, { align: 'center' })

        // ── INFO CLIENTE ────────────────────────────────────────────────
        doc.setTextColor(30, 30, 30)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('CLIENTE:', 14, 46)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(11)
        doc.text(cliente.toUpperCase(), 14, 54)

        // ── LÍNEA SEPARADORA ────────────────────────────────────────────
        doc.setDrawColor(249, 115, 22)
        doc.setLineWidth(0.5)
        doc.line(14, 62, 196, 62)
        doc.setLineWidth(0.2)
        doc.setDrawColor(220, 220, 220)

        // ── TABLA DE PRODUCTOS ──────────────────────────────────────────
        const tableRows = lineas.map((l, i) => [
            i + 1,
            l.nombre,
            l.codigo,
            l.cantidad === 0.5 ? '½ doc.' : `${l.cantidad} doc.`,
            `${l.precio_unitario.toFixed(2)} Bs`,
            `${(l.cantidad * l.precio_unitario).toFixed(2)} Bs`,
        ])

        autoTable(doc, {
            startY: 66,
            head: [['#', 'Producto', 'Cód./Caja', 'Doc.', 'Precio/Docena', 'Subtotal']],
            body: tableRows,
            styles: { fontSize: 9, cellPadding: 4 },
            headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [255, 250, 245] },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'right' },
                5: { halign: 'right', fontStyle: 'bold' },
            },
        })

        // ── TOTAL ───────────────────────────────────────────────────────
        const finalY = (doc as any).lastAutoTable.finalY + 8
        doc.setFillColor(249, 115, 22)
        doc.roundedRect(120, finalY, 76, 18, 4, 4, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text(`TOTAL: ${total.toFixed(2)} Bs`, 158, finalY + 11, { align: 'center' })

        // ── PIE DE PÁGINA ───────────────────────────────────────────────
        const pieY = finalY + 34
        doc.setDrawColor(220, 220, 220)
        doc.line(14, pieY - 4, 196, pieY - 4)

        doc.setTextColor(130, 130, 130)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'bold')
        doc.text('ACTIVA SPORT', 105, pieY, { align: 'center' })
        doc.setFont('helvetica', 'normal')
        doc.text('Importación y distribución de calzado deportivo · Cochabamba, Bolivia', 105, pieY + 5, { align: 'center' })
        doc.text(`Tel: +591 70000000  ·  activasport@gmail.com  ·  Emitido: ${fechaHora}`, 105, pieY + 10, { align: 'center' })
        doc.setFontSize(7)
        doc.setTextColor(200, 200, 200)
        doc.text('Este documento es una nota de venta interna — No válida como factura fiscal', 105, pieY + 16, { align: 'center' })

        const nombreCliente = cliente.replace(/\s+/g, '_').toLowerCase()
        doc.save(`nota_venta_${nombreCliente}_${fechaSolo.replace(/\//g, '-')}.pdf`)
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black uppercase flex items-center gap-2">
                                <ShoppingCart className="text-orange-500" size={26} />
                                Nueva Venta
                            </h1>
                            <p className="text-slate-500 text-sm">Genera una nota de venta y descárgala en PDF</p>
                        </div>
                    </div>
                    <Link href="/admin/reportes" className="text-sm text-orange-500 hover:underline font-bold hidden md:block">
                        Ver Reportes →
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

                {/* Éxito */}
                {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-400 rounded-2xl p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="text-green-500" size={28} />
                            <div>
                                <p className="font-black text-green-700 dark:text-green-400">¡Venta registrada y PDF descargado!</p>
                                <p className="text-sm text-green-600 dark:text-green-500">El movimiento ya aparece en los Reportes.</p>
                            </div>
                        </div>
                        <button onClick={limpiarFormulario} className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors text-sm">
                            Nueva Venta
                        </button>
                    </div>
                )}

                {/* Datos del cliente */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-md">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                        <User size={13} className="inline mr-1" />
                        Nombre del Cliente *
                    </label>
                    <input
                        value={cliente}
                        onChange={e => setCliente(e.target.value)}
                        placeholder="Ej: Margarita López"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 text-sm font-bold transition-all"
                    />
                </div>

                {/* Agregar Productos */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Package size={18} className="text-orange-500" />
                            Productos
                        </h2>
                        <button
                            onClick={() => setShowSearch(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-md transition-all"
                        >
                            <Plus size={16} /> Agregar Producto
                        </button>
                    </div>

                    {/* Buscador */}
                    {showSearch && (
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    autoFocus
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Nombre, código (ej: T13), caja o categoría..."
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-orange-300 dark:border-orange-600 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                                />
                                <button onClick={() => { setShowSearch(false); setSearchTerm('') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                                    <X size={16} />
                                </button>
                            </div>
                            {searchTerm && (
                                <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xl max-h-60 overflow-y-auto">
                                    {filteredProductos.length === 0 ? (
                                        <p className="text-center py-4 text-slate-400 text-sm">Sin resultados</p>
                                    ) : filteredProductos.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => agregarProducto(p)}
                                            className="w-full text-left px-4 py-3 bg-white dark:bg-slate-900 hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="font-bold text-sm text-slate-800 dark:text-white">{p.nombre}</p>
                                                <p className="text-xs text-slate-400">{p.codigo || p.caja} · {p.categoria}</p>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.stock_bultos > 3 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {p.stock_bultos} doc.
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Líneas de venta */}
                    {lineas.length === 0 ? (
                        <div className="text-center py-10 text-slate-300 dark:text-slate-700">
                            <ShoppingCart size={40} className="mx-auto mb-2 opacity-40" />
                            <p className="text-sm">Agrega productos para crear la nota de venta</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Encabezado */}
                            <div className="hidden md:grid grid-cols-12 gap-3 text-xs font-black text-slate-400 uppercase px-2">
                                <div className="col-span-5">Producto</div>
                                <div className="col-span-2 text-center">Docenas</div>
                                <div className="col-span-3 text-right">Precio/Docena (Bs)</div>
                                <div className="col-span-2 text-right">Subtotal</div>
                            </div>

                            {lineas.map((linea, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="col-span-11 md:col-span-5">
                                        <p className="font-bold text-sm text-slate-800 dark:text-white leading-tight">{linea.nombre}</p>
                                        <p className="text-xs text-slate-400">{linea.codigo}</p>
                                    </div>
                                    <input
                                        type="number"
                                        min={0.5}
                                        step={0.5}
                                        value={linea.cantidad}
                                        onChange={e => updateLinea(idx, 'cantidad', Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                                        className="col-span-6 md:col-span-2 text-center px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-orange-400"
                                    />
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.5"
                                        placeholder="0.00"
                                        value={linea.precio_unitario || ''}
                                        onChange={e => updateLinea(idx, 'precio_unitario', parseFloat(e.target.value) || 0)}
                                        className="col-span-5 md:col-span-3 text-right px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-orange-400"
                                    />
                                    <div className="col-span-4 md:col-span-2 text-right">
                                        <p className="font-black text-slate-800 dark:text-white text-sm">
                                            {(linea.cantidad * linea.precio_unitario).toFixed(2)} <span className="text-xs font-normal text-slate-400">Bs</span>
                                        </p>
                                    </div>
                                    <button onClick={() => removeLinea(idx)} className="col-span-1 text-red-400 hover:text-red-600 transition-colors flex justify-end">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            ))}

                            {/* Total */}
                            <div className="flex justify-end pt-2">
                                <div className="bg-orange-500 text-white rounded-2xl px-8 py-4 text-right shadow-lg shadow-orange-500/20">
                                    <p className="text-xs font-bold uppercase opacity-75">Total</p>
                                    <p className="text-3xl font-black">{total.toFixed(2)} <span className="text-lg font-normal opacity-80">Bs</span></p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Botón guardar */}
                {lineas.length > 0 && !success && (
                    <button
                        onClick={handleGuardarYDescargar}
                        disabled={saving}
                        className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all disabled:opacity-60"
                    >
                        <Download size={22} />
                        {saving ? 'Guardando...' : 'Guardar Venta y Descargar PDF'}
                    </button>
                )}
            </div>
        </div>
    )
}
