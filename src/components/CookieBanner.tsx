'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

export default function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Verificar si ya aceptó las cookies antes
        const consent = localStorage.getItem('cookieConsent')
        if (!consent) {
            // Esperar un poquito para que sea una animación suave al entrar
            const timer = setTimeout(() => setIsVisible(true), 1500)
            return () => clearTimeout(timer)
        }
    }, [])

    const acceptCookies = () => {
        localStorage.setItem('cookieConsent', 'true')
        setIsVisible(false)
    }

    if (!isVisible) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-fade-in-up">
            <div className="max-w-4xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center gap-4 md:gap-8 justify-between">

                <div className="flex items-start gap-4">
                    <div className="hidden sm:flex p-3 bg-brand-orange/10 rounded-full text-brand-orange flex-shrink-0">
                        <Cookie size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                            Usamos cookies para mejorar tu experiencia
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Utilizamos almacenamiento local para recordar tu carrito, favoritos y preferencias.
                            Al continuar navegando, aceptas nuestra{' '}
                            <Link href="/privacidad" className="text-brand-orange hover:underline font-medium">
                                Política de Privacidad
                            </Link>.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={acceptCookies}
                        className="flex-1 md:flex-none px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:bg-black dark:hover:bg-slate-200 transition-colors shadow-lg whitespace-nowrap"
                    >
                        Aceptar todo
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-lg"
                        aria-label="Cerrar"
                    >
                        <X size={20} />
                    </button>
                </div>

            </div>
        </div>
    )
}
