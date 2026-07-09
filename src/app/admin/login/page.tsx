'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle, ShieldAlert, Clock } from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'

function LoginForm() {
    const searchParams = useSearchParams()
    const { profile, loading: authLoading } = useAuth()

    const [email, setEmail]               = useState('')
    const [password, setPassword]         = useState('')
    const [loading, setLoading]           = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    /* Estado de errores */
    const [errorMsg, setErrorMsg]         = useState<string | null>(null)
    const [restantes, setRestantes]       = useState<number | null>(null)   // intentos restantes
    const [bloqueadoSeg, setBloqueadoSeg] = useState(0)                     // segundos de bloqueo
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    /* Countdown cuando está bloqueado */
    useEffect(() => {
        if (bloqueadoSeg <= 0) return
        timerRef.current = setInterval(() => {
            setBloqueadoSeg(s => {
                if (s <= 1) {
                    clearInterval(timerRef.current!)
                    setErrorMsg(null)
                    setRestantes(null)
                    return 0
                }
                return s - 1
            })
        }, 1000)
        return () => clearInterval(timerRef.current!)
    }, [bloqueadoSeg])

    const minutos  = Math.floor(bloqueadoSeg / 60)
    const segundos = bloqueadoSeg % 60
    const bloqueado = bloqueadoSeg > 0

    useEffect(() => {
        if (!loading && !authLoading && profile && profile.activo) {
            const redirectTo = searchParams.get('redirect') || '/admin/dashboard'
            window.location.href = redirectTo
        }
    }, [profile, authLoading, loading, searchParams])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (bloqueado) return
        setLoading(true)
        setErrorMsg(null)
        setRestantes(null)

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const data = await res.json()

            /* ── Cuenta bloqueada ── */
            if (res.status === 429) {
                setBloqueadoSeg(data.segRestantes ?? data.minRestantes * 60)
                setErrorMsg('bloqueado')
                setLoading(false)
                return
            }

            /* ── Credenciales incorrectas ── */
            if (res.status === 401) {
                setRestantes(data.restantes ?? null)
                setErrorMsg('credenciales')
                setLoading(false)
                return
            }

            /* ── Error genérico ── */
            if (!res.ok) {
                setErrorMsg('generico')
                setLoading(false)
                return
            }

            /* ── Éxito: establecer sesión en el browser ── */
            await supabase.auth.setSession(data.session)
            const redirectTo = searchParams.get('redirect') || '/admin/dashboard'
            window.location.href = redirectTo

        } catch {
            setErrorMsg('generico')
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

                        {/* Mensaje: bloqueado con countdown */}
                        {errorMsg === 'bloqueado' && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-xl text-sm">
                                <div className="flex items-center gap-2 font-bold mb-2">
                                    <ShieldAlert size={18} className="text-red-400 shrink-0" />
                                    Acceso bloqueado temporalmente
                                </div>
                                <p className="text-red-300/80 text-xs mb-3">
                                    Demasiados intentos fallidos. Tu cuenta quedará desbloqueada automáticamente.
                                </p>
                                <div className="flex items-center justify-center gap-2 bg-red-500/15 rounded-lg py-2.5">
                                    <Clock size={16} className="text-red-300" />
                                    <span className="font-black text-white text-xl tabular-nums">
                                        {String(minutos).padStart(2, '0')}:{String(segundos).padStart(2, '0')}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Mensaje: credenciales incorrectas */}
                        {errorMsg === 'credenciales' && (
                            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 p-4 rounded-xl flex items-start gap-3 text-sm">
                                <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={18} />
                                <div>
                                    <p className="font-semibold">Correo o contraseña incorrectos.</p>
                                    {restantes !== null && restantes > 0 && (
                                        <p className="text-amber-300/70 text-xs mt-1">
                                            Te {restantes === 1 ? 'queda' : 'quedan'} <span className="font-black text-amber-200">{restantes}</span> intento{restantes !== 1 ? 's' : ''} antes de que la cuenta sea bloqueada por 15 minutos.
                                        </p>
                                    )}
                                    {restantes === 0 && (
                                        <p className="text-red-300 text-xs mt-1 font-semibold">
                                            Última oportunidad. El próximo fallo bloqueará la cuenta.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Mensaje: error genérico */}
                        {errorMsg === 'generico' && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-xl flex items-start gap-3 text-sm">
                                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                                <span>Error de conexión inesperado. Por favor, intenta de nuevo.</span>
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
                            disabled={loading || bloqueado}
                            className="w-full bg-gradient-to-r from-brand-orange to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 group mt-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Verificando...</span>
                                </>
                            ) : bloqueado ? (
                                <>
                                    <ShieldAlert size={18} />
                                    <span>Cuenta bloqueada</span>
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
