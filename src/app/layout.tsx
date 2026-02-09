import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Activa Sport",
    template: "%s | Activa Sport"
  },
  description: "El mejor catálogo de calzados al por mayor en Bolivia. Envíos nacionales. Calidad Brasilera, Peruana y Nacional.",
  openGraph: {
    title: "Activa Sport | Catálogo Mayorista",
    description: "Descubre nuestra colección de zapatos. Precios especiales para mayoristas.",
    url: 'https://activasport.com', // Reemplazar con tu dominio real cuando lo tengas
    siteName: 'Activa Sport',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1556048219-18ae6fd33138?q=80&w=1200&h=630&fit=crop', // Imagen default atractiva
        width: 1200,
        height: 630,
        alt: 'Catálogo Activa Sport',
      },
    ],
    locale: 'es_BO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Activa Sport | Venta al por Mayor",
    description: "Calzados de calidad al mejor precio. Envíos a toda Bolivia.",
    images: ['https://images.unsplash.com/photo-1556048219-18ae6fd33138?q=80&w=1200&h=630&fit=crop'],
  },
};

import SocialSpeedDial from '@/components/SocialSpeedDial';
import CookieBanner from '@/components/CookieBanner';
import NetworkStatus from '@/components/NetworkStatus';
import TopHeader from '@/components/TopHeader';
import DockNavbar from '@/components/DockNavbar';
import Footer from '@/components/Footer';
import { CartProvider } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Analytics } from "@vercel/analytics/react"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} overflow-x-hidden`}>
        <ThemeProvider>
          <CartProvider>
            <FavoritesProvider>
              <TopHeader />
              {children}
              <Footer />
              <DockNavbar />
              <CookieBanner />
              <NetworkStatus />
              <Analytics />

            </FavoritesProvider>
          </CartProvider>
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
                `
          }}
        />
      </body>
    </html>
  );
}
