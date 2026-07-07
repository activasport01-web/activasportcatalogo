'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
    LayoutDashboard, Package, Tags, LogOut, Clock,
    CheckCircle2, BarChart3, Users, Ruler, ShoppingCart, Warehouse,
    ShieldCheck, Boxes, Truck, Contact, Shield, Key, Menu, X, ChevronDown
} from 'lucide-react'

/* ─── Grupos de navegación ──────────────────────────────────── */
const NAV_GROUPS = [
    {
        id: 'admin',
        label: 'Administración',
        icon: ShieldCheck,
        accent: 'text-violet-400',
        accentBg: 'hover:bg-violet-500/10',
        dot: 'bg-violet-500',
        items: [
            { href: '/admin/usuarios', icon: Users,  label: 'Usuarios', perm: 'gestionar_configuracion' },
            { href: '/admin/roles',    icon: Shield, label: 'Roles',    perm: 'gestionar_configuracion' },
            { href: '/admin/permisos', icon: Key,    label: 'Permisos', perm: 'gestionar_configuracion' },
        ],
    },
    {
        id: 'catalogo',
        label: 'Catálogo',
        icon: Tags,
        accent: 'text-blue-400',
        accentBg: 'hover:bg-blue-500/10',
        dot: 'bg-blue-500',
        items: [
            { href: '/admin/categorias', icon: Tags,         label: 'Categorías', perm: 'gestionar_catalogo' },
            { href: '/admin/marcas',     icon: CheckCircle2, label: 'Marcas',     perm: 'gestionar_catalogo' },
            { href: '/admin/generos',    icon: Users,        label: 'Géneros',    perm: 'gestionar_catalogo' },
            { href: '/admin/grupos',     icon: Ruler,        label: 'Tallas',     perm: 'gestionar_catalogo' },
        ],
    },
    {
        id: 'compras',
        label: 'Compras',
        icon: Truck,
        accent: 'text-teal-400',
        accentBg: 'hover:bg-teal-500/10',
        dot: 'bg-teal-500',
        items: [
            { href: '/admin/proveedores', icon: Warehouse, label: 'Proveedores', perm: 'gestionar_catalogo' },
            { href: '/admin/productos',   icon: Package,   label: 'Productos',   perm: 'gestionar_catalogo' },
            { href: '/admin/compras',     icon: Truck,     label: 'Compras',     perm: 'gestionar_catalogo' },
        ],
    },
    {
        id: 'ventas',
        label: 'Ventas',
        icon: ShoppingCart,
        accent: 'text-green-400',
        accentBg: 'hover:bg-green-500/10',
        dot: 'bg-green-500',
        items: [
            { href: '/admin/ventas',   icon: ShoppingCart, label: 'Ventas',   perm: 'registrar_ventas' },
            { href: '/admin/pedidos',  icon: Clock,        label: 'Pedidos',  perm: 'gestionar_pedidos' },
            { href: '/admin/clientes', icon: Contact,      label: 'Clientes', perm: 'registrar_ventas' },
        ],
    },
    {
        id: 'inventario',
        label: 'Inventario',
        icon: Boxes,
        accent: 'text-cyan-400',
        accentBg: 'hover:bg-cyan-500/10',
        dot: 'bg-cyan-500',
        items: [
            { href: '/admin/inventario', icon: Boxes, label: 'Inventario', perm: 'gestionar_catalogo' },
        ],
    },
    {
        id: 'reportes',
        label: 'Reportes',
        icon: BarChart3,
        accent: 'text-orange-400',
        accentBg: 'hover:bg-orange-500/10',
        dot: 'bg-orange-500',
        items: [
            { href: '/admin/reportes', icon: BarChart3, label: 'Reportes', perm: 'ver_finanzas' },
        ],
    },
]

/* ─── Layout ────────────────────────────────────────────────── */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
    const { profile, loading: authLoading, hasPermission, logout } = useAuth()
    const pathname = usePathname()

    /* Auto-expandir el grupo que contiene la ruta activa */
    useEffect(() => {
        NAV_GROUPS.forEach(group => {
            const hasActive = group.items.some(i => pathname === i.href || pathname.startsWith(i.href + '/'))
            if (hasActive) setOpenGroups(prev => new Set([...prev, group.id]))
        })
    }, [pathname])

    /* Redirigir si no autenticado */
    useEffect(() => {
        if (!authLoading && !profile && pathname !== '/admin/login') {
            window.location.replace('/admin/login')
        }
    }, [authLoading, profile, pathname])

    const toggleGroup = (id: string) => {
        setOpenGroups(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    /* Login: sin sidebar */
    if (pathname === '/admin/login') return <>{children}</>

    /* Cargando auth */
    if (authLoading || !profile) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
        </div>
    )

    const initials = (profile.nombre_completo || 'U').charAt(0).toUpperCase()

    return (
        <div className="flex min-h-screen bg-slate-950">

            {/* CSS para scrollbar oscuro */}
            <style>{`
                .sidebar-scroll::-webkit-scrollbar { width: 4px; }
                .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
                .sidebar-scroll::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
                .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #334155; }
            `}</style>

            {/* Overlay móvil */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* ══ SIDEBAR ══════════════════════════════════════════ */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 flex flex-col w-64
                bg-slate-950 border-r border-slate-800/50
                transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}>
                {/* Logo */}
                <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b border-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
                            <img src="/logo.png" className="w-5 h-5" style={{ filter: 'brightness(0) invert(1)' }} alt="" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-white leading-none tracking-tight">
                                ACTIVA <span className="text-orange-500">SPORT</span>
                            </p>
                            <p className="text-[10px] text-slate-600 mt-0.5 uppercase tracking-widest">Admin</p>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-600">
                        <X size={15} />
                    </button>
                </div>

                {/* ── Nav ── */}
                <nav
                    className="sidebar-scroll flex-1 overflow-y-auto px-3 py-3"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}
                >
                    {/* Dashboard */}
                    <Link
                        href="/admin/dashboard"
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors mb-2 ${
                            pathname === '/admin/dashboard'
                                ? 'bg-orange-500/15 text-orange-400'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                    >
                        <LayoutDashboard size={16} />
                        Dashboard
                    </Link>

                    {/* Separador */}
                    <div className="h-px bg-slate-800/60 mb-2" />

                    {/* Grupos colapsables */}
                    <div className="space-y-0.5">
                        {NAV_GROUPS.map(group => {
                            const GroupIcon = group.icon
                            const visibleItems = group.items.filter(i => hasPermission(i.perm))
                            if (visibleItems.length === 0) return null

                            const isOpen = openGroups.has(group.id)
                            const hasActiveChild = visibleItems.some(i => pathname === i.href || pathname.startsWith(i.href + '/'))

                            return (
                                <div key={group.id}>
                                    {/* Cabecera del grupo — botón colapsable */}
                                    <button
                                        onClick={() => toggleGroup(group.id)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${group.accent} ${group.accentBg} ${hasActiveChild ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                                    >
                                        <GroupIcon size={13} className="flex-shrink-0" />
                                        <span className="flex-1 text-left">{group.label}</span>
                                        <ChevronDown
                                            size={13}
                                            className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    {/* Items — colapsable con animación */}
                                    <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="ml-3 pl-3 border-l border-slate-800 mt-0.5 mb-1 space-y-0.5">
                                            {visibleItems.map(item => {
                                                const ItemIcon = item.icon
                                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                                                return (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={() => setSidebarOpen(false)}
                                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                            isActive
                                                                ? 'bg-slate-800 text-white'
                                                                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
                                                        }`}
                                                    >
                                                        <ItemIcon size={14} className="flex-shrink-0" />
                                                        {item.label}
                                                        {isActive && <span className={`ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 ${group.dot}`} />}
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </nav>

                {/* ── Perfil ── */}
                <div className="flex-shrink-0 border-t border-slate-800/50 p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 text-xs font-black flex-shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate leading-tight">{profile.nombre_completo}</p>
                            <p className="text-[10px] text-slate-600 truncate">{profile.roles?.nombre || 'Rol'}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-red-500/15 text-slate-500 hover:text-red-400 text-xs font-semibold transition-colors border border-slate-800"
                    >
                        <LogOut size={13} /> Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* ══ CONTENIDO ════════════════════════════════════════ */}
            <div className="lg:ml-64 flex-1 flex flex-col min-h-screen bg-slate-950">
                {/* Top bar solo en móvil */}
                <div className="lg:hidden sticky top-0 z-30 bg-slate-950 border-b border-slate-800/50 px-4 py-3 flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
                        <Menu size={18} />
                    </button>
                    <span className="text-sm font-black text-white">ACTIVA <span className="text-orange-500">SPORT</span></span>
                </div>

                {children}
            </div>
        </div>
    )
}
