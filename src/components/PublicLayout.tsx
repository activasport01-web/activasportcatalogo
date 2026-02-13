'use client'

import { usePathname } from 'next/navigation'
import TopHeader from '@/components/TopHeader'
import DockNavbar from '@/components/DockNavbar'
import Footer from '@/components/Footer'
import CookieBanner from '@/components/CookieBanner'
import NetworkStatus from '@/components/NetworkStatus'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isAdmin = pathname?.startsWith('/admin')

    // Si estamos en admin, renderizamos solo el contenido (los layouts de admin se encargarán del resto)
    if (isAdmin) {
        return (
            <>
                {children}
            </>
        )
    }

    // Si es público, renderizamos todo el layout de tienda
    return (
        <>
            <TopHeader />
            {children}
            <Footer />
            <DockNavbar />
            <CookieBanner />
            <NetworkStatus />
        </>
    )
}
