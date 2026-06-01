import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Activa Sport",
    template: "%s | Activa Sport"
  },
  description: "El mejor catálogo de calzados al por mayor en Bolivia. Envíos nacionales. Variedad de modelos, calidad garantizada y la mejor rentabilidad para tu negocio.",
  openGraph: {
    title: "Activa Sport | Catálogo Mayorista",
    description: "Descubre nuestra colección de zapatos. Precios especiales para mayoristas.",
    url: 'https://activasportbo.com', // Reemplazar con tu dominio real cuando lo tengas
    siteName: 'Activa Sport',
    images: [
      {
        url: 'https://activasportbo.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Activa Sport — Catálogo Mayorista de Calzado Bolivia',
      },
    ],
    locale: 'es_BO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Activa Sport",
    description: "Calzados de calidad al mejor precio. Envíos a toda Bolivia.",
    images: ['https://activasportbo.com/og-image.png'],
  },
  icons: {
    icon: '/activa_logo_exacto.svg',
    shortcut: '/activa_logo_exacto.svg',
    apple: '/activa_logo_exacto.svg',
  },
};

import SocialSpeedDial from '@/components/SocialSpeedDial';
import PublicOnly from '@/components/PublicOnly';
import CookieBanner from '@/components/CookieBanner';
import NetworkStatus from '@/components/NetworkStatus';
import TopHeader from '@/components/TopHeader';
import DockNavbar from '@/components/DockNavbar';
import Footer from '@/components/Footer';
import { CartProvider } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { Analytics } from "@vercel/analytics/react"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${outfit.className} overflow-x-hidden`}>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <FavoritesProvider>
                <PublicOnly>
                  <TopHeader />
                </PublicOnly>
                {children}
                <PublicOnly>
                  <Footer />
                  <DockNavbar />
                  <CookieBanner />
                  <NetworkStatus />
                </PublicOnly>
                <Analytics debug={false} />

              </FavoritesProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>

        {/* Script para silenciar logs de desarrollo molestos */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
                    const originalLog = console.log;
                    console.log = (...args) => {
                        if (typeof args[0] === 'string' && (args[0].includes('[Fast Refresh]') || args[0].includes('[HMR]'))) return;
                        originalLog.apply(console, args);
                    };

                    const originalError = console.error;
                    console.error = (...args) => {
                        // Silenciar el error molesto de Supabase en desarrollo cuando expira la sesión
                        if (typeof args[0] === 'string' && args[0].includes('Invalid Refresh Token')) return;
                        if (args[0]?.name === 'AuthApiError' && args[0]?.message?.includes('Refresh Token')) return;
                        originalError.apply(console, args);
                    };
                `
          }}
        />
      </body>
    </html>
  );
}
