'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function uploadImageAction(bucket: string, path: string, formData: FormData, token?: string) {
    try {
        // Inicializamos el cliente con el token del usuario para respetar las políticas RLS
        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false },
            global: {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            }
        })

        const file = formData.get('file') as File
        if (!file) {
            return { error: 'No file provided', url: null }
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, buffer, {
                contentType: file.type,
                upsert: true
            })

        if (error) {
            console.error("Supabase upload error:", error)
            return { error: error.message, url: null }
        }

        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path)
        return { error: null, url: publicData.publicUrl }
    } catch (err: any) {
        console.error("Server action error:", err)
        return { error: err.message, url: null }
    }
}
