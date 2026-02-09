'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, User as UserIcon, LogOut, Package, Heart, Sun, Moon, Users, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useDebouncedCallback } from 'use-debounce'
import { useTheme } from '@/context/ThemeContext'
import Image from 'next/image'
import { usePathname } from 'next/navigation' // Importar usePathname

export default function TopHeader() {
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [user, setUser] = useState<User | null>(null)
    const { theme, toggleTheme } = useTheme()
    const pathname = usePathname() // Obtener ruta actual

    // Scroll Hide Logic
    const [isVisible, setIsVisible] = useState(true)
    const lastScrollY = useRef(0)

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            // Hide if scrolling down > 50px
            if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
                setIsVisible(false)
            } else {
                setIsVisible(true)
            }
            lastScrollY.current = currentScrollY
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Estados para búsqueda
    const [searchTerm, setSearchTerm] = useState('')
    type SearchResult = {
        id: string
        nombre: string
        precio: number
        url_imagen: string
        categoria: string
    }
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showResults, setShowResults] = useState(false)

    // Búsqueda
    const handleSearch = useDebouncedCallback(async (term: string) => {
        if (!term || term.length < 2) {
            setSearchResults([])
            return
        }

        setIsSearching(true)
        const { data } = await supabase
            .from('zapatos')
            .select('id, nombre, precio, url_imagen, categoria')
            .ilike('nombre', `%${term}%`)
            .eq('disponible', true)
            .limit(5)

        setSearchResults(data || [])
        setIsSearching(false)
        setShowResults(true)
    }, 300)

    useEffect(() => {
        checkUser()
    }, [])

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setUserMenuOpen(false)
    }

    return (
        <header
            className={`sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm shadow-sm dark:shadow-slate-900/10 
            transition-all duration-300 ease-in-out
            ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
            suppressHydrationWarning
        >


            {/* Main Header */}
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    {/* Logo - Adaptive */}
                    <Link href="/" className="flex items-center gap-2 group shrink-0 relative w-48 h-12">
                        <Image
                            src="/logo.png"
                            alt="ActivaSport"
                            fill
                            sizes="192px"
                            className="object-contain dark:invert transition-all duration-300"
                            priority
                        />
                    </Link>

                    {/* Search Bar - Hidden on Mobile, Visible on Desktop (except on Catalog page where we have dedicated search) */}
                    <div className={`flex-1 max-w-xl relative ${pathname === '/catalogo' ? 'hidden' : 'hidden md:block'}`}>
                        <div className="flex items-center bg-gray-100 dark:bg-slate-900 rounded-full px-4 py-2 gap-2 border-2 border-transparent focus-within:border-brand-orange focus-within:bg-white dark:focus-within:bg-slate-950 transition-all w-full">
                            <Search size={18} className="text-gray-500 dark:text-gray-400" />
                            <input
                                suppressHydrationWarning
                                type="text"
                                placeholder="Buscar zapatos..."
                                className="bg-transparent outline-none text-sm w-full text-gray-700 dark:text-gray-200 placeholder-gray-500"
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    handleSearch(e.target.value)
                                }}
                                onFocus={() => {
                                    if (searchResults.length > 0) setShowResults(true)
                                }}
                                onBlur={() => {
                                    setTimeout(() => setShowResults(false), 200)
                                }}
                            />
                            {isSearching && <div className="w-4 h-4 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"></div>}
                        </div>

                        {/* Search Results Dropdown */}
                        {showResults && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden z-[60] animate-fade-in">
                                <div className="p-2">
                                    <p className="text-xs font-bold text-gray-400 px-2 py-1 uppercase">Resultados</p>
                                    {searchResults.map((result) => (
                                        <Link
                                            key={result.id}
                                            href={`/producto/${result.id}`}
                                            className="flex items-center gap-3 p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors group"
                                        >
                                            <img src={result.url_imagen} alt={result.nombre} className="w-10 h-10 object-contain bg-white rounded-md border border-gray-100" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-black dark:text-white truncate group-hover:text-brand-orange">{result.nombre}</p>
                                                <p className="text-xs text-gray-500">{result.categoria}</p>
                                            </div>
                                            <span className="text-sm font-bold text-brand-orange">${result.precio}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Botón CATÁLOGO Móvil (En lugar de barra de búsqueda) */}
                    {pathname !== '/catalogo' && (
                        <Link
                            href="/catalogo"
                            className="md:hidden flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
                        >
                            <Search size={14} className="text-brand-orange" />
                            CATÁLOGO
                        </Link>
                    )}

                    {/* Theme Toggle - Always Visible */}
                    {/* Unified User & Theme Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors shrink-0 border border-transparent focus:border-brand-orange"
                        >
                            {user ? (
                                <div className="w-full h-full rounded-full bg-slate-900 border border-brand-orange/50 flex items-center justify-center text-white">
                                    <span className="font-bold text-xs">
                                        {user.email?.substring(0, 2).toUpperCase()}
                                    </span>
                                </div>
                            ) : (
                                <UserIcon size={20} className="text-gray-600 dark:text-gray-300" />
                            )}
                        </button>

                        {/* Dropdown Menu */}
                        {userMenuOpen && (
                            <div className="absolute right-0 top-full mt-3 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden z-[70] animate-fade-in origin-top-right">
                                {/* 1. User Info Section */}
                                <div className="p-4 bg-gray-50 dark:bg-slate-950/50 border-b border-gray-100 dark:border-slate-800">
                                    {user ? (
                                        <div>
                                            <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                                {user.user_metadata?.nombre || 'Usuario Registrado'}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="font-bold text-sm text-slate-900 dark:text-white">Invitado</p>
                                            <p className="text-xs text-slate-500">Inicia sesión para ver tus pedidos</p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-2 space-y-1">
                                    {/* 2. Theme Toggle (Inside Menu) */}
                                    <button
                                        onClick={toggleTheme}
                                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                            {theme === 'light' ? <Sun size={18} className="text-orange-500" /> : <Moon size={18} className="text-blue-400" />}
                                            <span className="font-medium">Tema: {theme === 'light' ? 'Claro' : 'Oscuro'}</span>
                                        </div>
                                        <div className="w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded-full relative">
                                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 ${theme === 'dark' ? 'left-4.5' : 'left-0.5'}`}></div>
                                        </div>
                                    </button>

                                    {/* 3. Navigation Links */}
                                    <Link href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                        <Lock size={18} className="text-slate-400" />
                                        <span className="font-medium">Panel Admin</span>
                                    </Link>

                                    {user && (
                                        <>
                                            <div className="h-px bg-gray-100 dark:bg-slate-800 my-1 mx-2"></div>
                                            <Link href="/mis-pedidos" className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                                <Package size={18} className="text-slate-400" />
                                                <span className="font-medium">Mis Pedidos</span>
                                            </Link>
                                            <Link href="/favoritos" className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                                <Heart size={18} className="text-slate-400" />
                                                <span className="font-medium">Favoritos</span>
                                            </Link>
                                        </>
                                    )}
                                </div>

                                {/* 4. Footer Actions */}
                                <div className="p-2 border-t border-gray-100 dark:border-slate-800 mt-1">
                                    {user ? (
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-red-600 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                        >
                                            <LogOut size={16} />
                                            Cerrar Sesión
                                        </button>
                                    ) : (
                                        <Link href="/admin/login" className="block">
                                            <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-white bg-slate-900 dark:bg-brand-orange hover:opacity-90 rounded-xl transition-colors shadow-lg shadow-brand-orange/20">
                                                <UserIcon size={16} />
                                                Iniciar Sesión
                                            </button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
