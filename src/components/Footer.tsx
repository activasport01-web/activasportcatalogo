'use client'


import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, ChevronRight, Truck, CreditCard, Headphones, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

export default function Footer() {
    const [groupedCategories, setGroupedCategories] = useState<Record<string, string[]>>({})

    useEffect(() => {
        const fetchCategories = async () => {
            // Leer desde tablas maestras en vez de columnas de texto en zapatos
            const [catRes, subcatRes] = await Promise.all([
                supabase.from('categorias').select('id, nombre').eq('activa', true).order('orden'),
                supabase.from('subcategorias').select('id, nombre, categoria_id, cat_ref:categorias(nombre)').eq('activa', true).order('orden')
            ])

            if (catRes.data) {
                const groups: Record<string, string[]> = {}

                catRes.data.forEach(cat => {
                    const catNombre = cat.nombre.charAt(0).toUpperCase() + cat.nombre.slice(1).toLowerCase()
                    const subs = (subcatRes.data || [])
                        .filter(s => s.categoria_id === cat.id)
                        .map(s => s.nombre)
                        .slice(0, 5)
                    groups[catNombre] = subs
                })

                setGroupedCategories(groups)
            }
        }

        fetchCategories()
    }, [])

    return (
        <footer className="relative z-10 bg-gray-50 dark:bg-slate-950 text-gray-800 dark:text-gray-200 mt-0 transition-colors duration-300 border-t border-gray-200 dark:border-slate-900">
            {/* Features Bar (Pre-Footer) */}
            <div className="bg-slate-900 text-white py-10 border-b border-white/5 relative overflow-hidden">
                {/* Pattern ligero de fondo opcional */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

                        {/* 1. Envíos */}
                        <div className="flex gap-4 items-start group">
                            <Truck size={32} strokeWidth={1.5} className="text-brand-orange mt-1 group-hover:scale-110 transition-transform duration-300" />
                            <div>
                                <h4 className="font-bold text-lg mb-1">Envíos a todo el país</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">Expresos, correo, comisionista y envíos a domicilio.</p>
                            </div>
                        </div>

                        {/* 2. Pagos */}
                        <div className="flex gap-4 items-start group">
                            <CreditCard size={32} strokeWidth={1.5} className="text-brand-orange mt-1 group-hover:scale-110 transition-transform duration-300" />
                            <div>
                                <h4 className="font-bold text-lg mb-1">Todos los medios de pago</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">QR, Transferencia, Depósito y Efectivo.</p>
                            </div>
                        </div>

                        {/* 3. Whatsapp/Atención */}
                        <div className="flex gap-4 items-start group">
                            <Headphones size={32} strokeWidth={1.5} className="text-brand-orange mt-1 group-hover:scale-110 transition-transform duration-300" />
                            <div>
                                <h4 className="font-bold text-lg mb-1">Atención Personalizada</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">Te asesoramos por Whatsapp todos los días.</p>
                            </div>
                        </div>

                        {/* 4. Seguridad */}
                        <div className="flex gap-4 items-start group">
                            <ShieldCheck size={32} strokeWidth={1.5} className="text-brand-orange mt-1 group-hover:scale-110 transition-transform duration-300" />
                            <div>
                                <h4 className="font-bold text-lg mb-1">Compra Segura</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">Tus datos protegidos y empaques 100% cerrados.</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Columna 1: Branding */}
                    <div>
                        <div className="relative w-40 h-10 mb-6">
                            <Image
                                src="/logo.png"
                                alt="ActivaSport"
                                fill
                                sizes="160px"
                                className="object-contain dark:invert"
                            />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed text-sm">
                            Tu destino para encontrar los mejores zapatos con estilo, calidad y comodidad. Más de 10 años vistiendo tus pasos.
                        </p>
                        <div className="flex gap-4">
                            <a href="https://www.facebook.com/SOES.SC.BO" target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-slate-900 hover:bg-brand-orange hover:text-white dark:hover:bg-brand-orange dark:hover:text-white border border-gray-200 dark:border-slate-800 p-2.5 rounded-full transition duration-300 shadow-sm">
                                <Facebook size={18} />
                            </a>
                            <a href="https://www.instagram.com/activasportbo/" target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-slate-900 hover:bg-brand-orange hover:text-white dark:hover:bg-brand-orange dark:hover:text-white border border-gray-200 dark:border-slate-800 p-2.5 rounded-full transition duration-300 shadow-sm">
                                <Instagram size={18} />
                            </a>
                            <a href="https://www.tiktok.com/@activasportbo?_r=1&_t=ZS-93N0l5qXtqy" target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-slate-900 hover:bg-brand-orange hover:text-white dark:hover:bg-brand-orange dark:hover:text-white border border-gray-200 dark:border-slate-800 p-2.5 rounded-full transition duration-300 shadow-sm flex items-center justify-center">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Columna 2: Enlaces Rápidos */}
                    <div>
                        <h4 className="text-lg font-bold mb-6 text-black dark:text-white">Enlaces Rápidos</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-brand-orange dark:hover:text-brand-orange transition font-medium">
                                    Inicio
                                </Link>
                            </li>
                            <li>
                                <Link href="/nosotros" className="text-gray-600 dark:text-gray-400 hover:text-brand-orange dark:hover:text-brand-orange transition font-medium">
                                    Quiénes Somos
                                </Link>
                            </li>
                            <li>
                                <Link href="/#catalogo" className="text-gray-600 dark:text-gray-400 hover:text-brand-orange dark:hover:text-brand-orange transition font-medium">
                                    Catálogo
                                </Link>
                            </li>
                            <li>
                                <Link href="/#nuevos" className="text-gray-600 dark:text-gray-400 hover:text-brand-orange dark:hover:text-brand-orange transition font-medium">
                                    Nuevos Arrivals
                                </Link>
                            </li>
                            <li>
                                <Link href="/#ofertas" className="text-gray-600 dark:text-gray-400 hover:text-brand-orange dark:hover:text-brand-orange transition font-medium">
                                    Ofertas
                                </Link>
                            </li>
                            <li>
                                <Link href="/admin/login" className="text-gray-600 dark:text-gray-400 hover:text-brand-orange dark:hover:text-brand-orange transition font-medium">
                                    Zona Admin
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Columna 3: Categorías Dinámicas (Agrupadas) */}
                    <div>
                        <h4 className="text-lg font-bold mb-6 text-black dark:text-white">Nuestras Colecciones</h4>
                        <div className="space-y-6">
                            {Object.keys(groupedCategories).length > 0 ? (
                                Object.entries(groupedCategories).map(([categoria, subcategorias]) => (
                                    <div key={categoria}>
                                        <Link
                                            href={`/?categoria=${encodeURIComponent(categoria)}#catalogo`}
                                            className="font-bold text-black dark:text-white hover:text-brand-orange transition mb-2 block flex items-center gap-1"
                                        >
                                            {categoria}
                                        </Link>
                                        {subcategorias.length > 0 && (
                                            <ul className="space-y-1.5 pl-2 border-l-2 border-gray-100 dark:border-slate-800 ml-1">
                                                {subcategorias.map((sub, idx) => (
                                                    <li key={idx}>
                                                        <Link
                                                            href={`/?categoria=${encodeURIComponent(categoria)}&subcategoria=${encodeURIComponent(sub)}#catalogo`}
                                                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-brand-orange transition block py-0.5"
                                                        >
                                                            {sub}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 text-xs italic">Cargando colecciones...</p>
                            )}
                        </div>
                    </div>

                    {/* Columna 4: Contacto */}
                    <div>
                        <h4 className="text-lg font-bold mb-6 text-black dark:text-white">Contacto</h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin size={18} className="text-brand-orange mt-0.5 flex-shrink-0" />
                                <a
                                    href="https://maps.app.goo.gl/nqfMXkK48BTLa26E6?g_st=aw"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 dark:text-gray-400 hover:text-brand-orange transition"
                                >
                                    Feria Barrio Lindo / Comercial Tiluchi<br />
                                    Pasillo X / K12
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-brand-orange flex-shrink-0" />
                                <a href="tel:+59173643433" className="text-gray-600 dark:text-gray-400 hover:text-brand-orange transition">
                                    +591 73643433
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Línea divisoria */}
                <div className="border-t border-gray-200 dark:border-slate-900 mt-12 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-500 dark:text-gray-500 text-xs text-center md:text-left md:flex-1">
                            © {new Date().getFullYear()} ActivaSport. Todos los derechos reservados.{' '}
                            {/* nofollow a propósito: Google trata como spam los enlaces repetidos en pies de muchos sitios */}
                            <a href="https://dinamic-coding.vercel.app/" target="_blank" rel="noopener nofollow" className="group inline-flex items-center gap-[0.4em] whitespace-nowrap">
                                Desarrollado por
                                <svg viewBox="0 0 472.3 266.8" width="2.12em" height="1.2em" aria-hidden="true" className="shrink-0">
                                    <path fill="#044a92" className="dark:fill-current" d="M239.9 47.3C228.3 64 220.3 80.9 213.8 100.1C206.6 88.1 199.8 76.9 188.8 68.1C177.6 59.1 163.5 52.2 149.3 49.7C134.6 47.1 119.4 48.2 104.5 48.2C81.3 48.2 58.2 48 35.1 48.2L0.8 0.8C34 0.7 67.3 0.5 100.5 0.7C125.7 0.8 150.9-0.4 175.4 6.5C200.9 13.7 221.5 28.9 239.9 47.3ZM142.8 79.8L76.3 218.8C90.1 219 103.9 218.9 117.6 218.9C130 218.9 142.3 219 154.4 216.2C181.5 210 202.1 188.7 214.4 164.9C219.8 154.5 221.3 142.1 223.4 130.9C225.2 131.2 226.7 132.1 228.5 132.3C235.6 133 242.4 131.3 249.5 131.4C251 131.4 252.1 132.2 253.5 132.3C259.3 132.8 265.3 132.4 271 132.4C269.7 149.3 266 165.1 260.1 180.9C245.2 220.4 207.8 254.2 166.2 263C143 267.9 119.1 266.7 95.5 266.5C63.7 266.3 31.8 266.5 0 266.5L90.1 80ZM411.4 85.5L378.1 181.5L358.8 181.9L392.7 85.8ZM354.1 98.6L354 118.8L321.1 135L354.1 151.7L354.2 171.5L297.6 142.9L297.8 127.5ZM472.3 127.4L472.3 142.9L415.9 171.7L416.1 151.8L448.7 134.7L416.1 118.5L416 98.5Z" />
                                    <path fill="#0274d7" className="dark:fill-current" d="M471.3 0.3L446.6 75.3L398.3 75.6L407.6 48.5C395.6 48.4 383.5 48.4 371.5 48.3C361.7 48.3 352 48.1 342.5 50.1C310.1 56.9 286 80.6 275.5 111.5C272.8 119.4 272 128.3 271.1 136.6L221.6 135.6C225 115.8 227.9 96.9 236.6 78.6C241.8 67.4 248.6 57.8 256.4 48.3C277.3 22.5 309.1 6.7 341.6 1.8C360.5-1.1 380.4 0.3 399.5 0.4C423.4 0.5 447.4 0.6 471.3 0.3ZM278.7 171.3C286.3 183.3 293.1 195.4 304.6 204.4C330 224.2 365.1 218.5 395.2 218.6L406.7 191.3L456.9 191.5L425 266.5C403.5 266.6 382 266.3 360.5 266.6C341.8 266.9 321.6 267.9 303.8 261C282.6 252.9 267 239.3 252.6 222.1C257.4 214.4 262.9 207 267 198.9C271.6 190 275 180.6 278.7 171.3Z" />
                                </svg>
                                <span className="font-bold underline-offset-[0.2em] group-hover:underline group-focus-visible:underline">Dynamic Coding</span>
                            </a>
                        </p>
                        <div className="flex gap-6 text-xs">
                            <Link href="/terminos" className="text-gray-500 dark:text-gray-500 hover:text-brand-orange dark:hover:text-brand-orange transition">
                                Términos y Condiciones
                            </Link>
                            <Link href="/privacidad" className="text-gray-500 dark:text-gray-500 hover:text-brand-orange dark:hover:text-brand-orange transition">
                                Política de Privacidad
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
