'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Store,
    LayoutGrid,
    Truck,
    ShoppingBag,
    User,
    Share2
} from 'lucide-react'
import { useCart } from '@/context/CartContext'

export default function DockNavbar() {
    const pathname = usePathname()
    const { cartCount } = useCart()
    const [isVisible, setIsVisible] = useState(true)
    const [showSocials, setShowSocials] = useState(false)
    const lastScrollY = useRef(0)

    // Detectar dirección del scroll para ocultar/mostrar
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
                setIsVisible(false)
                setShowSocials(false) // Close socials on scroll down
            } else {
                setIsVisible(true)
            }
            lastScrollY.current = currentScrollY
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const socials = [
        {
            name: 'WhatsApp',
            color: 'bg-[#25D366]',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
            ),
            href: 'https://wa.me/59163448209'
        },
        {
            name: 'Instagram',
            color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
            ),
            href: 'https://www.instagram.com/activasportbo/'
        },
        {
            name: 'TikTok',
            color: 'bg-black',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
            ),
            href: 'https://www.tiktok.com/@activasportbo?_r=1&_t=ZS-93N0l5qXtqy'
        },
        {
            name: 'Facebook',
            color: 'bg-[#1877F2]',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
            ),
            href: 'https://www.facebook.com/SOES.SC.BO'
        }
    ]

    const navItems = [
        {
            name: 'Catálogo',
            href: '/catalogo',
            icon: LayoutGrid,
            color: 'group-hover:text-blue-400'
        },
        {
            name: 'Pedidos',
            href: '/mis-pedidos',
            icon: Truck,
            color: 'group-hover:text-green-400'
        },
        {
            name: 'Inicio',
            href: '/',
            icon: Store,
            isMain: true,
            color: 'text-white'
        },
        {
            name: 'Carrito',
            href: '/carrito',
            icon: ShoppingBag,
            count: cartCount,
            color: 'group-hover:text-orange-400'
        },
        // Reemplazamos "Cuenta" por "Redes" para equilibrar, o agregamos "Cuenta" si es critico?
        // El usuario pidió "cuando ese boton de mas lo cambies que digan redes"
        // Asumiremos que quiere Redes EN VEZ de Cuenta o como item final.
        // Voy a poner Redes como 5to item. Acceso a Cuenta/Admin sigue arriba en desktop o sidebar si existe.
        {
            name: 'Redes',
            onClick: () => setShowSocials(!showSocials),
            icon: Share2,
            isActiveOverride: showSocials, // Para marcarlo activo cuando está abierto
            color: 'group-hover:text-pink-500'
        }
    ]

    return (
        <>
            {/* Espaciador para no tapar contenido al final de la página */}
            <div className="h-24 md:h-32" />

            {/* Barra Flotante de Redes (Popup) */}
            <div className={`
                fixed bottom-24 left-1/2 -translate-x-1/2 z-50 
                flex items-center gap-3 px-4 py-3 rounded-full 
                bg-white dark:bg-slate-900 shadow-xl border border-gray-100 dark:border-slate-800
                transition-all duration-300 transform origin-bottom
                ${showSocials && isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10 pointer-events-none'}
            `}>
                {socials.map((social) => (
                    <a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center p-2 rounded-full transition-transform hover:scale-110 shadow-md ${social.color}`}
                        title={social.name}
                    >
                        {social.icon}
                    </a>
                ))}

                {/* Flechita decorativa hacia abajo */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-900 rotate-45 border-r border-b border-gray-100 dark:border-slate-800"></div>
            </div>

            {/* Dock Container - Hide on scroll */}
            <div className={`
                fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 pt-4 
                bg-gradient-to-t from-slate-950/20 to-transparent pointer-events-none
                transition-transform duration-500 ease-in-out
                ${isVisible ? 'translate-y-0' : 'translate-y-[150%]'}
            `}>
                <div className="flex items-end gap-1 sm:gap-2 px-4 py-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-2xl pointer-events-auto">

                    {navItems.map((item) => {
                        const isActive = item.isActiveOverride || pathname === item.href
                        const Icon = item.icon

                        if (item.isMain) {
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href || '#'}
                                    className="relative group -mt-8 mx-2 flex flex-col items-center"
                                >
                                    <div className={`
                                        w-14 h-14 rounded-full flex items-center justify-center 
                                        bg-brand-orange text-white
                                        shadow-[0_4px_15px_rgba(255,87,34,0.4)]
                                        transition-all duration-300 ease-out
                                        group-hover:scale-110
                                        ${isActive ? 'ring-4 ring-orange-100 dark:ring-orange-900/40' : ''}
                                    `}>
                                        <Icon size={26} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[10px] font-bold mt-1 text-slate-600 dark:text-slate-300">
                                        Inicio
                                    </span>
                                </Link>
                            )
                        }

                        // Botón Normal (Link o Acción)
                        const content = (
                            <>
                                <div className="relative">
                                    <Icon
                                        size={22}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className="transition-all duration-300"
                                    />
                                    {item.count !== undefined && item.count > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center text-[9px] font-bold bg-brand-orange text-white rounded-full border-2 border-white dark:border-slate-900">
                                            {item.count}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[9px] font-semibold tracking-wide ${isActive ? 'text-brand-orange' : ''}`}>
                                    {item.name}
                                </span>
                            </>
                        )

                        if (item.onClick) {
                            return (
                                <button
                                    key={item.name}
                                    onClick={item.onClick}
                                    className={`
                                        relative group p-2 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 min-w-[50px]
                                        ${isActive ? 'text-brand-orange' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}
                                    `}
                                >
                                    {content}
                                </button>
                            )
                        }

                        return (
                            <Link
                                key={item.name}
                                href={item.href || '#'}
                                className={`
                                    relative group p-2 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 min-w-[50px]
                                    ${isActive ? 'text-brand-orange' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}
                                `}
                            >
                                {content}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </>
    )
}
