'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'

export default function SocialSpeedDial() {
    const [isOpen, setIsOpen] = useState(false)

    const toggleOpen = () => setIsOpen(!isOpen)

    const socials = [
        {
            name: 'WhatsApp',
            color: 'bg-[#25D366]',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
            ),
            href: 'https://wa.me/59163448209'
        },
        {
            name: 'Instagram',
            color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500', // Gradiente oficial de Instagram
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
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
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
            ),
            href: 'https://www.tiktok.com/@activasportbo?_r=1&_t=ZS-93N0l5qXtqy'
        },
        {
            name: 'Facebook',
            color: 'bg-[#1877F2]',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
            ),
            href: 'https://www.facebook.com/SOES.SC.BO'
        }
    ]

    return (
        <div className="fixed bottom-28 right-6 z-50 flex flex-col items-center gap-4">
            {/* Burbujas de Redes Sociales */}
            <div className="flex flex-col-reverse gap-3">
                {socials.map((social, index) => (
                    <a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`
                            relative group flex items-center justify-center w-12 h-12 rounded-full shadow-lg text-white transition-all duration-300 transform
                            ${social.color}
                            ${isOpen
                                ? 'translate-y-0 opacity-100 scale-100'
                                : 'translate-y-10 opacity-0 scale-0 pointer-events-none'}
                        `}
                        style={{
                            transitionDelay: isOpen ? `${index * 50}ms` : '0ms'
                        }}
                    >
                        {social.icon}

                        {/* Tooltip Lateral */}
                        <span className="absolute right-14 bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {social.name}
                        </span>
                    </a>
                ))}
            </div>

            {/* Botón Principal (Toggle) */}
            <button
                onClick={toggleOpen}
                className={`
                    flex items-center justify-center w-14 h-14 rounded-full shadow-2xl text-white transition-all duration-300 z-50
                    ${isOpen ? 'bg-gray-800 rotate-45' : 'bg-orange-500 hover:scale-110 hover:bg-orange-600'}
                `}
                aria-label="Abrir redes sociales"
            >
                <Plus size={32} />
            </button>
        </div>
    )
}
