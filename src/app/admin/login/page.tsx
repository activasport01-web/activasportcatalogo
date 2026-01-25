'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react'

export default function AdminLogin() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            alert('Error: ' + error.message)
            setLoading(false)
        } else {
            router.push('/admin/dashboard')
        }
    }

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
            {/* Imagen de Fondo con Overlay */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-camo-300">
                    {/* Camo Pattern Simulation */}
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: 'radial-gradient(#1A1A1A 2px, transparent 2px), radial-gradient(#1A1A1A 2px, transparent 2px)',
                        backgroundSize: '30px 30px',
                        backgroundPosition: '0 0, 15px 15px'
                    }}></div>
                </div>
                {/* Overlay Neon */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-black/80 via-transparent to-brand-black/90"></div>

                {/* Elementos decorativos */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-neon-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            {/* Contenido */}
            <div className="relative z-10 w-full max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Lado Izquierdo - Branding */}
                <div className="hidden lg:block text-white space-y-8 animate-fade-in">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="text-neon-500" size={32} />
                            <h1 className="text-5xl font-black">
                                <span className="text-white">Importadora</span>
                                <span className="text-neon-500"> Fernández</span>
                            </h1>
                        </div>
                        <h2 className="text-4xl font-bold leading-tight">
                            Bienvenido al
                            <span className="block text-neon-500">Panel de Administración</span>
                        </h2>
                        <p className="text-xl text-gray-300 leading-relaxed">
                            Gestiona tu inventario, productos y ventas desde un solo lugar.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-4 pt-8">
                        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-neon-500/30">
                            <div className="w-12 h-12 bg-neon-500/20 border border-neon-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-neon-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Gestión Completa</h3>
                                <p className="text-sm text-gray-300">Control total de productos y categorías</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-neon-500/30">
                            <div className="w-12 h-12 bg-neon-500/20 border border-neon-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-neon-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Rápido y Eficiente</h3>
                                <p className="text-sm text-gray-300">Interfaz optimizada para productividad</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-neon-500/30">
                            <div className="w-12 h-12 bg-neon-500/20 border border-neon-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-neon-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Seguro y Confiable</h3>
                                <p className="text-sm text-gray-300">Protección de datos garantizada</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lado Derecho - Formulario de Login */}
                <div className="w-full max-w-md mx-auto animate-slide-up">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20">
                        {/* Header del Formulario */}
                        {/* Header del Formulario */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-black border-2 border-neon-500 rounded-2xl mb-4 shadow-lg shadow-neon-500/20">
                                <Lock className="text-neon-500" size={28} />
                            </div>
                            <h2 className="text-3xl font-black text-brand-black mb-2">Inicia Sesión</h2>
                            <p className="text-slate-500">Acceso exclusivo administrativo</p>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={handleLogin} className="space-y-6">
                            {/* Email */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Correo Electrónico
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="text-slate-400" size={20} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-neon-500 focus:ring-4 focus:ring-neon-500/10 transition-all text-brand-black placeholder-slate-400 font-bold"
                                        placeholder="tu@email.com"
                                    />
                                </div>
                            </div>

                            {/* Contraseña */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="text-slate-400" size={20} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3.5 border-2 border-slate-200 rounded-xl focus:border-neon-500 focus:ring-4 focus:ring-neon-500/10 transition-all text-brand-black placeholder-slate-400 font-bold"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Recordar / Olvidé contraseña */}
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-neon-500 focus:ring-neon-500" />
                                    <span className="text-slate-600">Recordarme</span>
                                </label>
                                <a href="#" className="text-neon-600 hover:text-brand-black font-bold">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>

                            {/* Botón de Login */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-brand-black text-neon-500 py-4 rounded-xl font-black text-lg hover:bg-neon-500 hover:text-brand-black focus:ring-4 focus:ring-neon-500/50 transition-all shadow-lg hover:shadow-neon-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group uppercase tracking-widest border border-neon-500/20"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Iniciando sesión...
                                    </>
                                ) : (
                                    <>
                                        Ingresar al Panel
                                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Volver a la tienda */}
                        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                            <Link href="/" className="text-slate-500 hover:text-neon-600 font-bold inline-flex items-center gap-2 transition-colors uppercase text-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Volver a la tienda
                            </Link>
                        </div>
                    </div>

                    {/* Logo móvil */}
                    <div className="lg:hidden text-center mt-8">
                        <h1 className="text-3xl font-black text-white">
                            <span>Importadora</span>
                            <span className="text-neon-500"> Fernández</span>
                        </h1>
                    </div>
                </div>
            </div>
        </div>
    )
}
