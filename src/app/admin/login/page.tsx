'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

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
        <div className="min-h-screen w-full flex bg-white overflow-hidden">
            {/* Left Side - Branding Area (Black with White Logo) */}
            <div className="hidden lg:flex lg:w-1/2 bg-black relative items-center justify-center overflow-hidden">
                {/* Subtle Radial Gradient to give depth */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-80"></div>

                {/* Decorative Orange Lines */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-50"></div>

                <div className="relative z-10 p-12 flex flex-col items-center text-center">
                    <div className="relative w-80 h-32 mb-8 transform hover:scale-105 transition-transform duration-500">
                        {/* Assuming logo.png is colors/black, we invert it for black background to be white if needed. 
                             Using brightness-0 invert-1 forces it to white.
                         */}
                        <Image
                            src="/logo.png"
                            alt="ActivaSport Logo"
                            fill
                            sizes="320px"
                            className="object-contain brightness-0 invert"
                            priority
                        />
                    </div>
                    <div className="space-y-4 max-w-md">
                        <h2 className="text-3xl font-black text-white tracking-tight">
                            PANEL ADMINISTRATIVO
                        </h2>
                        <p className="text-zinc-400 font-medium leading-relaxed">
                            Accede para gestionar el catálogo, inventario y pedidos de la tienda.
                        </p>
                    </div>
                </div>

                {/* Background Pattern - Removed missing grid.svg */}
                <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            </div>

            {/* Right Side - Login Form (White) */}
            <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8 relative">
                <div className="w-full max-w-[400px] space-y-8 animate-fade-in-up">
                    {/* System Badge */}
                    <div className="flex justify-center lg:justify-start">
                        <div className="inline-block bg-brand-orange text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md mb-2">
                            Sistema V2.0
                        </div>
                    </div>

                    <div className="text-center lg:text-left">
                        <h1 className="text-4xl font-black text-zinc-900 mb-2">Bienvenido</h1>
                        <p className="text-zinc-500 font-medium">Ingresa tus credenciales para continuar.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider block">
                                Correo Electrónico
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="text-zinc-400 group-focus-within:text-brand-orange transition-colors" size={20} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/5 transition-all text-zinc-900 placeholder-zinc-400 font-bold text-sm"
                                    placeholder="admin@activasport.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider block">
                                Contraseña
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="text-zinc-400 group-focus-within:text-brand-orange transition-colors" size={20} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/5 transition-all text-zinc-900 placeholder-zinc-400 font-bold text-sm"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Verificando...</span>
                                </>
                            ) : (
                                <>
                                    <span>Iniciar Sesión</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="pt-4 text-center lg:text-left">
                        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-brand-orange transition-colors uppercase tracking-widest">
                            <ArrowRight className="rotate-180" size={14} />
                            Volver a la tienda
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
