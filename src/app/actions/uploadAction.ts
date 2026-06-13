'use server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function uploadImageAction(bucket: string, path: string, formData: FormData, token?: string) {
    try {
        const file = formData.get('file') as File
        if (!file) {
            return { error: 'No file provided', url: null }
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Usamos fetch directamente en el servidor para forzar el envío del Token de Autorización.
        // Esto evita el bug de supabase-js donde no hereda los global.headers en Storage.
        const targetUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`
        
        const headers: Record<string, string> = {
            'apikey': supabaseKey,
            'Content-Type': file.type,
            'x-upsert': 'true' // Para sobreescribir si existe
        }
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: buffer
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error("Supabase upload error:", errorText)
            return { error: errorText, url: null }
        }

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
        return { error: null, url: publicUrl }
    } catch (err: any) {
        console.error("Server action error:", err)
        return { error: err.message, url: null }
    }
}
