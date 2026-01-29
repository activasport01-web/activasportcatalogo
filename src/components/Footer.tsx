'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

export default function Footer() {
    const [groupedCategories, setGroupedCategories] = useState<Record<string, string[]>>({})

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase
                .from('zapatos')
                .select('categoria, subcategoria')
                .eq('disponible', true)

            if (data) {
                const groups: Record<string, Set<string>> = {}

                data.forEach(item => {
                    if (item.categoria) {
                        const catNormalizada = item.categoria.charAt(0).toUpperCase() + item.categoria.slice(1).toLowerCase();
                        if (!groups[catNormalizada]) {
                            groups[catNormalizada] = new Set()
                        }
                        if (item.subcategoria) {
                            groups[catNormalizada].add(item.subcategoria)
                        }
                    }
                })

                const finalGroups: Record<string, string[]> = {}
                Object.keys(groups).sort().forEach(key => {
                    finalGroups[key] = Array.from(groups[key]).slice(0, 5)
                })

                setGroupedCategories(finalGroups)
            }
        }

        fetchCategories()
    }, [])

    return (
        <footer className="relative z-10 bg-gray-50 dark:bg-slate-950 text-gray-800 dark:text-gray-200 mt-20 transition-colors duration-300 border-t border-gray-200 dark:border-slate-900">
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
                                <span className="text-gray-600 dark:text-gray-400 capitalize">
                                    Av. Carmelo Ortiz, Av. Dr. Carmelo Ortiz Taborga<br />
                                    Santa Cruz de la Sierra, Bolivia
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-brand-orange flex-shrink-0" />
                                <a href="tel:+59163448209" className="text-gray-600 dark:text-gray-400 hover:text-brand-orange transition">
                                    +591 63448209
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Línea divisoria */}
                <div className="border-t border-gray-200 dark:border-slate-900 mt-12 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-500 dark:text-gray-500 text-xs">
                            © {new Date().getFullYear()} ActivaSport. Todos los derechos reservados.
                        </p>
                        <div className="flex gap-6 text-xs">
                            <a href="#" className="text-gray-500 dark:text-gray-500 hover:text-brand-orange dark:hover:text-brand-orange transition">
                                Términos y Condiciones
                            </a>
                            <a href="#" className="text-gray-500 dark:text-gray-500 hover:text-brand-orange dark:hover:text-brand-orange transition">
                                Política de Privacidad
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
