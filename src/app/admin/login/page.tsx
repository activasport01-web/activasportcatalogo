'use client'

import { Suspense, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'

// Componente interno separado porque useSearchParams() requiere Suspense en Next.js
function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { profile, loading: authLoading } = useAuth()
    
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    // Redirección automática si ya tiene sesión activa
    useEffect(() => {
        if (!authLoading && profile && profile.activo) {
            const redirectTo = searchParams.get('redirect') || '/admin/dashboard'
            router.replace(redirectTo)
        }
    }, [profile, authLoading, router, searchParams])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg(null)

        try {
            const { data: authData, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) {
                let msg = error.message
                if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
                    msg = 'Credenciales incorrectas. Por favor, verifica tu correo y contraseña.'
                }
                setErrorMsg(msg)
                setLoading(false)
                return
            }

            if (!authData || !authData.user) {
                setErrorMsg('No se pudo verificar la identidad del usuario.')
                setLoading(false)
                return
            }

            // Verificar si tiene un perfil activo en el panel administrativo
            const { data: profile, error: profileError } = await supabase
                .from('usuarios')
                .select('activo')
                .eq('id', authData.user.id)
                .single()

            if (profileError || !profile || !profile.activo) {
                await supabase.auth.signOut()
                setErrorMsg('Acceso denegado. Su cuenta no tiene permisos administrativos o está inactiva.')
                setLoading(false)
                return
            }

            // Poner cookie de sesión para que el middleware pueda proteger /admin/*
            // Dura 30 días (2592000 segundos) para que la sesión se mantenga activa
            document.cookie = 'admin_session=1; path=/; SameSite=Strict; max-age=2592000'

            // Si el middleware guardó a dónde iba el usuario, volver ahí
            const redirectTo = searchParams.get('redirect') || '/admin/dashboard'
            window.location.href = redirectTo
        } catch (err: any) {
            console.error('Error inesperado en login:', err)
            setErrorMsg('Ocurrió un error inesperado de conexión. Por favor, intenta de nuevo.')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-950">
            {/* Background Decoration */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-brand-orange/20 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md p-6 mx-4">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden p-8 sm:p-10">

                    {/* Header: Logo & Title */}
                    <div className="flex flex-col items-center text-center space-y-6 mb-10">
                        <div className="relative w-48 h-16 transform transition-transform hover:scale-105 duration-500">
                            <Image
                                src="/logo.png"
                                alt="ActivaSport Logo"
                                fill
                                sizes="200px"
                                className="object-contain drop-shadow-lg"
                                priority
                            />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">
                                Panel Administrativo
                            </h1>
                            <p className="text-slate-300 font-medium text-sm">
                                Ingresa tus credenciales para gestionar la tienda
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        {errorMsg && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-xl flex items-start gap-3 animate-fade-in text-sm font-medium">
                                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block ml-1">
                                Correo Electrónico
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="text-slate-400 group-focus-within:text-brand-orange transition-colors" size={20} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-xl focus:bg-slate-900/80 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all text-white placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="admin@activasport.com"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block ml-1">
                                Contraseña
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="text-slate-400 group-focus-within:text-brand-orange transition-colors" size={20} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-4 bg-slate-900/50 border border-slate-700 rounded-xl focus:bg-slate-900/80 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all text-white placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors outline-none"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-brand-orange to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2 group mt-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Accediendo...</span>
                                </>
                            ) : (
                                <>
                                    <span>Iniciar Sesión</span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-white/10 pt-6">
                        <div className="inline-block bg-white/5 px-4 py-1.5 rounded-full mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sistema V2.0</span>
                        </div>
                        <br />
                        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest hover:underline decoration-brand-orange underline-offset-4">
                            <ArrowRight className="rotate-180" size={14} />
                            Volver a la tienda
                        </Link>
                    </div>
                </div>

                {/* Footer Credits */}
                <p className="text-center text-slate-600 text-xs mt-8">
                    &copy; {new Date().getFullYear()} ActivaSport. Todos los derechos reservados.
                </p>
            </div>
        </div>
    )
}

// Suspense es obligatorio en Next.js cuando se usa useSearchParams()
export default function AdminLogin() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    )
}
