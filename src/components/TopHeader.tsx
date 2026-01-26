'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, User as UserIcon, LogOut, Package, Heart, Sun, Moon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useDebouncedCallback } from 'use-debounce'
import { useTheme } from '@/context/ThemeContext'
import Image from 'next/image'

export default function TopHeader() {
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [user, setUser] = useState<User | null>(null)
    const { theme, toggleTheme } = useTheme()

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
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-sm shadow-sm dark:shadow-orange-900/10 transition-colors duration-300">
            {/* Top Bar - ActivaSport Black & Orange */}
            <div className="bg-black text-brand-orange border-b border-brand-orange/20">
                <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center text-[10px] sm:text-xs md:text-sm overflow-hidden">
                    <div className="flex gap-2 sm:gap-4 shrink-0">
                        <Link href="/admin/login" className="hover:text-white transition font-bold tracking-wide whitespace-nowrap">
                            🔐 ADMIN
                        </Link>
                    </div>
                    <div className="text-right truncate ml-2">
                        <span className="font-bold tracking-wider hidden md:block text-white">📦 VENTA MAYORISTA - PEDIDO MÍNIMO: 6 PARES</span>
                        <span className="font-bold tracking-wider md:hidden text-white truncate">📦 VENTA MAYORISTA</span>
                    </div>
                </div>
            </div>

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

                    {/* Search Bar - Full Width on Mobile */}
                    <div className="flex-1 max-w-xl relative">
                        <div className="flex items-center bg-gray-100 dark:bg-zinc-900 rounded-full px-4 py-2 gap-2 border-2 border-transparent focus-within:border-brand-orange focus-within:bg-white dark:focus-within:bg-black transition-all w-full">
                            <Search size={18} className="text-gray-500 dark:text-gray-400" />
                            <input
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
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden z-[60] animate-fade-in">
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

                    {/* Theme Toggle - Always Visible */}
                    <button
                        onClick={toggleTheme}
                        className="w-9 h-9 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-yellow-400 transition-colors shrink-0"
                        aria-label="Cambiar tema"
                    >
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    </button>

                    {/* User Profile - Desktop Only */}
                    <div className="relative hidden md:block">
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center gap-2 text-black dark:text-white hover:text-brand-orange transition"
                        >
                            {user ? (
                                <div className="w-9 h-9 rounded-full bg-black dark:bg-zinc-800 border border-brand-orange flex items-center justify-center">
                                    <UserIcon size={18} className="text-brand-orange" />
                                </div>
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-gray-200">
                                    <UserIcon size={20} className="text-gray-600 dark:text-gray-300" />
                                </div>
                            )}
                        </button>

                        {/* Dropdown */}
                        {userMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden z-[60]">
                                {user ? (
                                    <div className="p-2">
                                        <div className="px-3 py-2 border-b border-gray-100 dark:border-zinc-800 mb-2">
                                            <p className="font-bold text-sm truncate text-black dark:text-white">{user.user_metadata?.nombre || 'Usuario'}</p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                        <Link href="/mis-pedidos"><button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg"><Package size={16} /> Mis Pedidos</button></Link>
                                        <Link href="/favoritos"><button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg"><Heart size={16} /> Favoritos</button></Link>
                                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mt-1"><LogOut size={16} /> Cerrar Sesión</button>
                                    </div>
                                ) : (
                                    <div className="p-4 text-center">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Inicia sesión para ver tus pedidos</p>
                                        <Link href="/admin/login" className="block w-full bg-brand-orange text-white py-2 rounded-lg font-bold text-sm hover:opacity-90">
                                            Iniciar Sesión
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
