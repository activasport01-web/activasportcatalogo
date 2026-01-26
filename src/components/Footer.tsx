import Link from 'next/link'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react'
import Image from 'next/image'

export default function Footer() {
    return (
        <footer className="relative z-10 bg-gray-50 dark:bg-zinc-950 text-gray-800 dark:text-gray-200 mt-20 transition-colors duration-300 border-t border-gray-200 dark:border-zinc-900">
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
                            <a href="https://www.facebook.com/SOES.SC.BO" target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-zinc-900 hover:bg-brand-orange hover:text-white dark:hover:bg-brand-orange dark:hover:text-white border border-gray-200 dark:border-zinc-800 p-2.5 rounded-full transition duration-300 shadow-sm">
                                <Facebook size={18} />
                            </a>
                            <a href="https://www.instagram.com/activasportbo/" target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-zinc-900 hover:bg-brand-orange hover:text-white dark:hover:bg-brand-orange dark:hover:text-white border border-gray-200 dark:border-zinc-800 p-2.5 rounded-full transition duration-300 shadow-sm">
                                <Instagram size={18} />
                            </a>
                            <a href="https://www.tiktok.com/@activasportbo?_r=1&_t=ZS-93N0l5qXtqy" target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-zinc-900 hover:bg-brand-orange hover:text-white dark:hover:bg-brand-orange dark:hover:text-white border border-gray-200 dark:border-zinc-800 p-2.5 rounded-full transition duration-300 shadow-sm flex items-center justify-center">
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

                    {/* Columna 3: Categorías */}
                    <div>
                        <h4 className="text-lg font-bold mb-6 text-black dark:text-white">Categorías</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-brand-orange dark:hover:text-brand-orange transition font-medium">
                                    Zapatos para Adulto
                                </a >
                            </li>
                            <li>
                                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-brand-orange dark:hover:text-brand-orange transition font-medium">
                                    Zapatos para Niño
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-brand-orange dark:hover:text-brand-orange transition font-medium">
                                    Deportivos
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-brand-orange dark:hover:text-brand-orange transition font-medium">
                                    Botas
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-brand-orange dark:hover:text-brand-orange transition font-medium">
                                    Sandalias
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Columna 4: Contacto */}
                    <div>
                        <h4 className="text-lg font-bold mb-6 text-black dark:text-white">Contacto</h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin size={18} className="text-brand-orange mt-0.5 flex-shrink-0" />
                                <span className="text-gray-600 dark:text-gray-400">
                                    Av. Principal #123<br />
                                    La Paz, Bolivia
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-brand-orange flex-shrink-0" />
                                <a href="tel:+59163448209" className="text-gray-600 dark:text-gray-400 hover:text-brand-orange transition">
                                    +591 63448209
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-brand-orange flex-shrink-0" />
                                <a href="mailto:ventas@activasport.com" className="text-gray-600 dark:text-gray-400 hover:text-brand-orange transition">
                                    ventas@activasport.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Línea divisoria */}
                <div className="border-t border-gray-200 dark:border-zinc-900 mt-12 pt-8">
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
