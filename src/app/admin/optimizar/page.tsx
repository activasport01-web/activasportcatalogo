'use client'

import { useState } from 'react'
import { supabase, safeUpload, proxyImageUrl } from '@/lib/supabase'
import { compressImage } from '@/lib/imageCompression'

// Imágenes ya livianas (webp pequeño) no se tocan.
const SKIP_UNDER_KB = 130

type Row = { name: string; before: number; after: number; status: string }

/**
 * Herramienta de una sola pasada para recomprimir a WebP las imágenes pesadas
 * que ya están en Supabase Storage (subidas antes de activar la compresión).
 * Reutiliza compressImage() y safeUpload() — no agrega dependencias.
 *
 * Por defecto corre en modo "solo analizar": descarga y comprime en memoria
 * para estimar el ahorro SIN modificar nada. Al desmarcar la casilla, sube la
 * versión comprimida a la MISMA ruta (la url_imagen en la base no cambia).
 */
export default function OptimizarImagenesPage() {
    const [running, setRunning] = useState(false)
    const [dryRun, setDryRun] = useState(true)
    const [rows, setRows] = useState<Row[]>([])
    const [log, setLog] = useState('')
    const [totals, setTotals] = useState({ before: 0, after: 0, done: 0, skipped: 0, failed: 0 })

    const parsePath = (url: string) => {
        const i = url.indexOf('/object/public/')
        if (i === -1) return null
        const rest = url.slice(i + '/object/public/'.length) // bucket/ruta...
        const slash = rest.indexOf('/')
        if (slash === -1) return null
        return { bucket: rest.slice(0, slash), path: rest.slice(slash + 1) }
    }

    const collectUrls = (products: any[]): string[] => {
        const set = new Set<string>()
        for (const p of products) {
            if (p.url_imagen) set.add(p.url_imagen)
            if (p.imagen_hover) set.add(p.imagen_hover)
            if (Array.isArray(p.colores)) {
                for (const c of p.colores) {
                    if (c && typeof c === 'object') {
                        if (c.imagen) set.add(c.imagen)
                        if (Array.isArray(c.imagenes)) c.imagenes.forEach((g: string) => g && set.add(g))
                    }
                }
            }
        }
        return [...set].filter(u => typeof u === 'string' && u.includes('.supabase.co'))
    }

    const run = async () => {
        setRunning(true)
        setRows([])
        setLog('Cargando productos...')
        const t = { before: 0, after: 0, done: 0, skipped: 0, failed: 0 }

        const { data: products, error } = await supabase
            .from('zapatos')
            .select('url_imagen, imagen_hover, colores')
        if (error || !products) {
            setLog('Error cargando productos: ' + (error?.message || 'sin datos'))
            setRunning(false)
            return
        }

        const urls = collectUrls(products)
        const out: Row[] = []

        for (let idx = 0; idx < urls.length; idx++) {
            const url = urls[idx]
            const short = url.split('/').pop() || url
            setLog(`(${idx + 1}/${urls.length}) ${short}`)
            try {
                const res = await fetch(proxyImageUrl(url))
                if (!res.ok) { t.failed++; out.push({ name: short, before: 0, after: 0, status: 'no accesible' }); setRows([...out]); continue }
                const blob = await res.blob()
                const beforeKB = Math.round(blob.size / 1024)

                if (blob.size / 1024 < SKIP_UNDER_KB && blob.type === 'image/webp') {
                    t.skipped++; out.push({ name: short, before: beforeKB, after: beforeKB, status: 'ya optimizada' }); setRows([...out]); continue
                }

                const base = short.replace(/\.[^.]+$/, '')
                const file = new File([blob], `${base}.${(blob.type.split('/')[1] || 'jpg')}`, { type: blob.type })
                const compressed = await compressImage(file, { maxWidth: 1200, quality: 0.78, format: 'webp' })
                const afterKB = Math.round(compressed.size / 1024)

                // Solo vale la pena si baja al menos 10%.
                if (compressed.size >= blob.size * 0.9) {
                    t.skipped++; out.push({ name: short, before: beforeKB, after: beforeKB, status: 'sin ganancia' }); setRows([...out]); continue
                }

                t.before += blob.size; t.after += compressed.size

                if (dryRun) {
                    out.push({ name: short, before: beforeKB, after: afterKB, status: 'se optimizaría' })
                } else {
                    const loc = parsePath(url)
                    if (!loc) { t.failed++; out.push({ name: short, before: beforeKB, after: afterKB, status: 'ruta inválida' }); setRows([...out]); continue }
                    const up = await safeUpload(loc.bucket, loc.path, compressed)
                    if (up.error) { t.failed++; out.push({ name: short, before: beforeKB, after: afterKB, status: 'error al subir' }); setRows([...out]); continue }
                    t.done++
                    out.push({ name: short, before: beforeKB, after: afterKB, status: 'optimizada ✓' })
                }
            } catch (e: any) {
                t.failed++
                out.push({ name: short, before: 0, after: 0, status: 'error: ' + (e?.message || 'desconocido') })
            }
            setRows([...out])
            setTotals({ ...t })
        }

        const savedMB = ((t.before - t.after) / 1024 / 1024).toFixed(1)
        setLog(dryRun
            ? `Análisis listo (${urls.length} imágenes). Se ahorrarían ${savedMB} MB. Desmarca "Solo analizar" y vuelve a ejecutar para aplicar.`
            : `Listo. ${t.done} optimizadas · ${t.skipped} saltadas · ${t.failed} errores. Ahorro real: ${savedMB} MB.`)
        setRunning(false)
    }

    const savedMB = ((totals.before - totals.after) / 1024 / 1024).toFixed(1)

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-xl font-bold mb-1">Optimizar imágenes del catálogo</h1>
            <p className="text-sm text-slate-500 mb-4">
                Recomprime a WebP (máx. 1200px) las imágenes pesadas ya subidas. Usa la misma
                compresión que el formulario de productos y sube a la misma ruta, así que los
                enlaces de la base de datos no cambian.
            </p>

            <label className="flex items-center gap-2 mb-3 text-sm">
                <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} disabled={running} />
                Solo analizar (no modifica nada)
            </label>

            <button
                onClick={run}
                disabled={running}
                className="px-4 py-2 rounded-lg bg-orange-500 text-white font-bold disabled:opacity-50"
            >
                {running ? 'Procesando...' : dryRun ? 'Analizar' : 'Optimizar y subir'}
            </button>

            <p className="mt-3 text-xs text-slate-500 min-h-[1.5em]">{log}</p>

            {rows.length > 0 && (
                <>
                    <div className="mt-2 text-sm font-bold">
                        Ahorro: {savedMB} MB &nbsp;|&nbsp; {totals.done} subidas · {totals.skipped} saltadas · {totals.failed} errores
                    </div>
                    <div className="mt-2 max-h-[55vh] overflow-auto border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
                        {rows.map((r, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 px-3 py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="truncate flex-1" title={r.name}>{r.name}</span>
                                <span className="tabular-nums whitespace-nowrap text-slate-500">{r.before} → {r.after} KB</span>
                                <span className="w-32 text-right">{r.status}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
