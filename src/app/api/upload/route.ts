import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const bucket = searchParams.get('bucket') || 'imagenes-zapatos'
    const path = searchParams.get('path')
    const contentType = request.headers.get('Content-Type') || 'image/jpeg'

    console.log(`[API Upload] Petición de subida recibida. Bucket: ${bucket}, Path: ${path}`)

    if (!path) {
        console.error("[API Upload] Falta el parámetro obligatorio 'path'.")
        return NextResponse.json({ error: 'Falta el parámetro path' }, { status: 400 })
    }

    try {
        // Leemos el cuerpo crudo como ArrayBuffer.
        // Esto es seguro en Vercel y evita bloqueos de streaming de duplex='half'.
        console.log("[API Upload] Leyendo datos binarios del cuerpo...")
        const arrayBuffer = await request.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        console.log(`[API Upload] Datos recibidos con éxito: ${buffer.length} bytes.`)

        if (buffer.length === 0) {
            console.error("[API Upload] El archivo está vacío.")
            return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 })
        }

        const targetUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`
        
        const headers: Record<string, string> = {
            'apikey': supabaseKey,
            'Content-Type': contentType,
            'x-upsert': 'true',
            'Authorization': `Bearer ${supabaseKey}` // Service Role Key para ignorar RLS
        }

        console.log(`[API Upload] Subiendo a Supabase Storage: ${targetUrl}...`)
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: buffer
        })

        console.log(`[API Upload] Respuesta de Supabase. Status: ${response.status}`)

        if (!response.ok) {
            const errorText = await response.text()
            console.error("[API Upload] Error de Supabase:", errorText)
            return NextResponse.json({ error: errorText }, { status: response.status })
        }

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
        console.log(`[API Upload] Subida completada. URL pública: ${publicUrl}`)
        
        return NextResponse.json({ url: publicUrl })
    } catch (err: any) {
        console.error("[API Upload] Error crítico en servidor:", err)
        return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
    }
}
