import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cliente con service role: bypass total de RLS, nunca sale al navegador
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

async function verificarAdmin() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll() {},
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: perfil } = await supabaseAdmin
        .from('usuarios')
        .select('activo, roles(nombre)')
        .eq('id', user.id)
        .single()

    const rolNombre = (perfil?.roles as any)?.nombre
    if (!perfil?.activo || rolNombre?.toLowerCase() !== 'administrador') return null

    return user
}

// POST /api/admin/usuarios — crear nuevo usuario
export async function POST(request: NextRequest) {
    const admin = await verificarAdmin()
    if (!admin) {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, nombre_completo, rol_id } = body

    if (!email?.trim() || !password?.trim()) {
        return NextResponse.json({ error: 'El correo y la contraseña son obligatorios' }, { status: 400 })
    }
    if (password.length < 6) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    // Crear usuario en auth.users (el trigger handle_new_user crea la fila en public.usuarios)
    const { data: nuevoUsuario, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: true,
    })

    if (createError || !nuevoUsuario.user) {
        return NextResponse.json(
            { error: createError?.message || 'Error al crear el usuario' },
            { status: 400 }
        )
    }

    // Actualizar la fila de public.usuarios con nombre y rol
    // (el trigger ya la creó, aquí solo se complementa)
    if (nombre_completo || rol_id) {
        await supabaseAdmin
            .from('usuarios')
            .upsert({
                id: nuevoUsuario.user.id,
                nombre_completo: nombre_completo?.trim() || null,
                rol_id: rol_id || null,
                activo: true,
            })
    }

    return NextResponse.json({ id: nuevoUsuario.user.id, email: nuevoUsuario.user.email }, { status: 201 })
}

// DELETE /api/admin/usuarios?id=... — eliminar usuario permanentemente
export async function DELETE(request: NextRequest) {
    const admin = await verificarAdmin()
    if (!admin) {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
        return NextResponse.json({ error: 'Falta el parámetro id' }, { status: 400 })
    }
    if (id === admin.id) {
        return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
}
