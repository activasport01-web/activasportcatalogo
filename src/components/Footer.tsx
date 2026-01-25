import Link from 'next/link'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="relative z-10 bg-gradient-to-br from-gray-900 to-gray-800 text-white mt-20">
            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Columna 1: Sobre Nosotros */}
                    <div>
                        <h3 className="text-2xl font-black mb-4">
                            <span className="text-neon-500">Importadora</span> Fernández
                        </h3>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            Tu destino para encontrar los mejores zapatos con estilo, calidad y comodidad. Más de 10 años vistiendo tus pasos.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="bg-brand-black hover:bg-neon-500 hover:text-brand-black border border-gray-700 p-3 rounded-md transition duration-300">
                                <Facebook size={20} />
                            </a>
                            <a href="#" className="bg-brand-black hover:bg-neon-500 hover:text-brand-black border border-gray-700 p-3 rounded-md transition duration-300">
                                <Instagram size={20} />
                            </a>
                            <a href="#" className="bg-brand-black hover:bg-neon-500 hover:text-brand-black border border-gray-700 p-3 rounded-md transition duration-300">
                                <Twitter size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Columna 2: Enlaces Rápidos */}
                    <div>
                        <h4 className="text-lg font-bold mb-4">Enlaces Rápidos</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/" className="text-gray-400 hover:text-neon-500 transition font-medium">
                                    Inicio
                                </Link>
                            </li>
                            <li>
                                <Link href="/#catalogo" className="text-gray-400 hover:text-neon-500 transition font-medium">
                                    Catálogo
                                </Link>
                            </li>
                            <li>
                                <Link href="/#nuevos" className="text-gray-400 hover:text-neon-500 transition font-medium">
                                    Nuevos Arrivals
                                </Link>
                            </li>
                            <li>
                                <Link href="/#ofertas" className="text-gray-400 hover:text-neon-500 transition font-medium">
                                    Ofertas
                                </Link>
                            </li>
                            <li>
                                <Link href="/admin/login" className="text-gray-400 hover:text-neon-500 transition font-medium">
                                    Admin
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Columna 3: Categorías */}
                    <div>
                        <h4 className="text-lg font-bold mb-4">Categorías</h4>
                        <ul className="space-y-3">
                            <li>
                                <a href="#" className="text-gray-400 hover:text-neon-500 transition font-medium">
                                    Zapatos para Adulto
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-neon-500 transition font-medium">
                                    Zapatos para Niño
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-neon-500 transition font-medium">
                                    Deportivos
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-neon-500 transition font-medium">
                                    Botas
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-neon-500 transition font-medium">
                                    Sandalias
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Columna 4: Contacto */}
                    <div>
                        <h4 className="text-lg font-bold mb-4">Contacto</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <MapPin size={20} className="text-neon-500 mt-1 flex-shrink-0" />
                                <span className="text-gray-400">
                                    Av. Principal #123<br />
                                    La Paz, Bolivia
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={20} className="text-neon-500 flex-shrink-0" />
                                <a href="tel:+59178303866" className="text-gray-400 hover:text-neon-500 transition">
                                    +591 78303866
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={20} className="text-neon-500 flex-shrink-0" />
                                <a href="mailto:ventas@importadorafernandez.com" className="text-gray-400 hover:text-neon-500 transition">
                                    ventas@importadorafernandez.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Línea divisoria */}
                <div className="border-t border-gray-700 mt-12 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-500 text-sm">
                            © 2024 Importadora Fernández. Todos los derechos reservados.
                        </p>
                        <div className="flex gap-6 text-sm">
                            <a href="#" className="text-gray-400 hover:text-orange-500 transition">
                                Términos y Condiciones
                            </a>
                            <a href="#" className="text-gray-400 hover:text-orange-500 transition">
                                Política de Privacidad
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
