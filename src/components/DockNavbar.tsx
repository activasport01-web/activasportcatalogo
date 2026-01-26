'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Store,
    LayoutGrid,
    Truck,
    ShoppingBag,
    User,
    Search,
    ShieldCheck
} from 'lucide-react'
import { useCart } from '@/context/CartContext'

export default function DockNavbar() {
    const pathname = usePathname()
    const { cartCount } = useCart()
    const [scrolled, setScrolled] = useState(false)

    // Detectar scroll para efectos visuales si es necesario
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

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
        {
            name: 'Perfil',
            href: '/perfil',
            icon: User,
            color: 'group-hover:text-purple-400'
        }
    ]

    return (
        <>
            {/* Espaciador para no tapar contenido al final de la página */}
            <div className="h-24 md:h-32" />

            {/* Dock Container - Wrapped design for better integration */}
            <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 pt-4 bg-gradient-to-t from-black/20 to-transparent pointer-events-none">
                <div className="flex items-center gap-1 sm:gap-2 p-2 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-2xl pointer-events-auto transform transition-all hover:scale-[1.01]">

                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon

                        if (item.isMain) {
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="relative group mx-2"
                                >
                                    <div className={`
                                        w-14 h-14 rounded-full flex items-center justify-center 
                                        bg-brand-orange
                                        shadow-[0_0_15px_rgba(255,87,34,0.4)]
                                        transition-all duration-300 ease-out
                                        group-hover:-translate-y-1 group-hover:shadow-[0_0_25px_rgba(255,87,34,0.6)] group-hover:scale-105
                                        ${isActive ? 'ring-4 ring-orange-500/20' : ''}
                                    `}>
                                        <Icon size={26} className="text-white fill-white/10" />
                                    </div>
                                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        {item.name}
                                    </span>
                                </Link>
                            )
                        }

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                                    relative group p-3 sm:p-3.5 rounded-full transition-all duration-300
                                    hover:bg-gray-100 dark:hover:bg-white/10
                                    ${isActive ? 'bg-gray-100 dark:bg-white/10 text-brand-orange' : 'text-gray-500 dark:text-gray-400'}
                                `}
                            >
                                <div className="relative">
                                    <Icon
                                        size={22}
                                        className={`transition-colors duration-300 ${isActive ? 'text-brand-orange font-bold' : 'group-hover:text-gray-900 dark:group-hover:text-white'}`}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                    {item.count !== undefined && item.count > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center text-[9px] font-bold bg-brand-orange text-white rounded-full border-2 border-white dark:border-zinc-900">
                                            {item.count}
                                        </span>
                                    )}
                                </div>

                                <span className={`
                                    absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-orange transition-all duration-300
                                    ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
                                `} />

                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                    {item.name}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </>
    )
}
