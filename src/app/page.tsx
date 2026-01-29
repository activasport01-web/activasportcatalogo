import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import HeroSection from '@/components/HeroSection'
import PromoCarousel from '@/components/PromoCarousel'
import ProductCard from '@/components/ProductCard'
import BrandsCarousel from '@/components/BrandsCarousel'
import { Sparkles, TrendingUp, Award, ArrowRight } from 'lucide-react'

// Esto asegura que la página no guarde caché vieja y muestre siempre lo nuevo
export const revalidate = 0;

export default async function Home() {
  // 1. Obtener Portada Destacada (Para el Slide Principal)
  const { data: portada } = await supabase
    .from('portada_destacada')
    .select('*')
    .eq('activo', true)
    .single()

  // 2. Obtener Zapatos Disponibles (Para Slides de Novedades/Tendencias)
  const { data: zapatos } = await supabase
    .from('zapatos')
    .select('*')
    .eq('disponible', true)
    .order('fecha_creacion', { ascending: false })
    .limit(10)

  // Preparar datos para el Carrusel Principal (HeroSection)
  // SUGERENCIA DEL USUARIO: Mostrar solo Novedades, Tendencias y Branding aquí.
  const slides = [];

  // SLIDE 1: Portada Principal (Configurable desde Admin > Portada)
  // Ideal para: Mensaje Institucional, Bienvenida Mayorista, o Aviso Importante.
  if (portada) {
    slides.push({
      id: 'portada-main',
      title: portada.titulo,
      description: portada.descripcion,
      image_url: portada.url_imagen,
      product_link: '/catalogo', // Link general al catálogo
      tag: '⭐ DESTACADO'
    });
  }

  // SLIDE 2: Él Último Ingreso (Automático)
  // Ideal para: Mostrar que la tienda se actualiza constantemente.
  if (zapatos && zapatos.length > 0) {
    const nuevo = zapatos[0];
    slides.push({
      id: `new-${nuevo.id}`,
      title: '¡Acaba de Llegar!',
      description: `Nuevo ${nuevo.nombre} disponible en curvas completas.`,
      image_url: nuevo.url_imagen,
      product_link: `/producto/${nuevo.id}`,
      tag: '✨ NUEVO INGRESO'
    });
  }

  // SLIDE 3: Tendencia / Popular (Lógica "Nike" o "TN" o el segundo más nuevo)
  // Ideal para: Mostrar productos de alta demanda.
  if (zapatos && zapatos.length > 1) {
    const popular = zapatos.find((z: any) =>
      (z.nombre.toLowerCase().includes('nike') || z.nombre.toLowerCase().includes('tn')) && z.id !== zapatos[0].id
    ) || zapatos[1];

    if (popular) {
      slides.push({
        id: `trend-${popular.id}`,
        title: 'Tendencia Mayorista',
        description: 'Los modelos más buscados por tus clientes.',
        image_url: popular.url_imagen,
        product_link: `/producto/${popular.id}`,
        tag: '🔥 MÁS VENDIDO'
      });
    }
  }

  // Fallback si no hay nada (raro, pero por seguridad visual)
  if (slides.length === 0) {
    slides.push({
      id: 'fallback',
      title: 'Catálogo 2024',
      description: 'Explora nuestra colección completa de calzados al por mayor.',
      image_url: null, // HeroSection manejará el fallback visual
      product_link: '/catalogo',
      tag: '👟 ACTIVA SPORT'
    })
  }

  // 3. Filtrar productos para las tarjetas destacadas inferiores
  const pNuevo = zapatos && zapatos.length > 0 ? zapatos[0] : null

  // Buscar el producto popular para la tarjeta (reutilizando lógica)
  const pPopular = zapatos && zapatos.length > 0 ? (
    zapatos.find((z: any) => z.nombre.toLowerCase().includes('nike') || z.nombre.toLowerCase().includes('tn'))
    || zapatos[1]
    || zapatos[0]
  ) : null

  // Buscar el más barato
  const pOferta = zapatos && zapatos.length > 0 ? [...zapatos].sort((a: any, b: any) => a.precio - b.precio)[0] : null

  // Helper para obtener color principal
  const getColorName = (p: any) => {
    if (!p?.colores || p.colores.length === 0) return 'Varios Colores'
    return p.colores.length > 1 ? `${p.colores.length} Colores` : 'Color Único'
  }

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
      {/* Navbar */}
      {/* Navbar - Global en Layout */}

      {/* Banner Principal */}
      <HeroSection slides={slides} />

      {/* Promociones Activas */}
      <PromoCarousel />

      {/* Carrusel de Marcas */}
      <BrandsCarousel />

      {/* Sección de Categorías Destacadas */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* 1. NUEVO INGRESO (Dinámico) */}
          <Link href={pNuevo ? `/producto/${pNuevo.id}` : '/catalogo?sort=recientes'} className="h-64 group">
            <div className="relative bg-gradient-to-br from-slate-950 to-slate-900 rounded-[2rem] p-6 overflow-hidden shadow-2xl h-full flex flex-col justify-between transform hover:-translate-y-2 hover:shadow-brand-orange/20 transition-all border border-brand-orange/20">

              {/* Texto a la Izquierda */}
              <div className="relative z-20 max-w-[50%]">
                <div className="inline-block bg-brand-orange text-white px-3 py-1 rounded-full text-xs font-black mb-3 shadow-lg shadow-brand-orange/40 uppercase tracking-widest">
                  ✨ Nuevo
                </div>
                <h3 className="text-white text-2xl font-black leading-tight line-clamp-2 drop-shadow-md group-hover:text-brand-orange transition-colors">
                  {pNuevo?.nombre || 'Nueva Colección'}
                </h3>
                <p className="text-gray-400 text-sm font-medium mt-1">
                  {getColorName(pNuevo)}
                </p>
              </div>

              {pNuevo && (
                <div className="absolute top-4 right-4 w-[50%] h-[90%] pointer-events-none">
                  <img
                    src={pNuevo.url_imagen}
                    alt={pNuevo.nombre}
                    className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(255,87,34,0.3)] transform rotate-[-12deg] group-hover:rotate-0 group-hover:scale-110 transition-all duration-500"
                  />
                </div>
              )}
            </div>
          </Link>

          {/* 2. MÁS POPULAR (Dinámico) */}
          <Link href={pPopular ? `/producto/${pPopular.id}` : '/catalogo'} className="h-64 group">
            <div className="relative bg-zinc-100 dark:bg-slate-900 rounded-[2rem] p-6 overflow-hidden shadow-xl h-full flex flex-col justify-between transform hover:-translate-y-2 transition-all border border-transparent dark:border-slate-800 hover:border-brand-orange/20">

              <div className="relative z-20 max-w-[50%]">
                <div className="inline-block bg-black dark:bg-white px-3 py-1 rounded-full text-xs font-bold text-white dark:text-black mb-3">
                  🔥 Trending
                </div>
                <h3 className="text-black dark:text-white text-2xl font-black leading-tight line-clamp-2 drop-shadow-sm group-hover:text-brand-orange transition-colors">
                  {pPopular?.nombre || 'Tendencias'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">
                  {getColorName(pPopular)}
                </p>
              </div>

              {pPopular && (
                <div className="absolute top-4 right-4 w-[50%] h-[90%] pointer-events-none">
                  <img
                    src={pPopular.url_imagen}
                    alt={pPopular.nombre}
                    className="w-full h-full object-contain drop-shadow-xl transform rotate-[-6deg] group-hover:rotate-0 group-hover:scale-110 transition-all duration-500"
                  />
                </div>
              )}
            </div>
          </Link>

          {/* 3. MEJOR OFERTA (Dinámico) */}
          <Link href={pOferta ? `/producto/${pOferta.id}` : '/ofertas'} className="h-64 group">
            <div className="relative bg-white dark:bg-slate-950 rounded-[2rem] p-6 overflow-hidden shadow-xl h-full flex flex-col justify-between transform hover:-translate-y-2 transition-all border-2 border-dashed border-gray-200 dark:border-slate-800 hover:border-brand-orange dark:hover:border-brand-orange">

              <div className="relative z-20 max-w-[50%]">
                <div className="inline-block bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold mb-3">
                  % Oferta
                </div>
                <h3 className="text-black dark:text-white text-2xl font-black leading-tight line-clamp-2 drop-shadow-sm">
                  {pOferta?.nombre || 'Descuentos'}
                </h3>
                <p className="text-brand-orange text-xl font-black mt-1">
                  Descuento Especial
                </p>
              </div>

              {pOferta && (
                <div className="absolute top-4 right-4 w-[50%] h-[90%] pointer-events-none">
                  <img
                    src={pOferta.url_imagen}
                    alt={pOferta.nombre}
                    className="w-full h-full object-contain drop-shadow-xl transform rotate-[-6deg] group-hover:rotate-0 group-hover:scale-110 transition-all duration-500"
                  />
                </div>
              )}
            </div>
          </Link>
        </div>
      </section >

      {/* Catálogo de Zapatos */}
      < div id="catalogo" className="relative z-10 max-w-7xl mx-auto py-16 px-4" >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-black dark:text-white mb-2 tracking-tight">Catálogo</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Explora todos nuestros modelos disponibles</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/catalogo">
              <button className="px-6 py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-brand-orange dark:hover:bg-brand-orange hover:text-white dark:hover:text-white transition-all shadow-lg hover:shadow-brand-orange/30">
                Ver Todo
              </button>
            </Link>
            <Link href="/catalogo/adulto">
              <button className="px-6 py-2.5 rounded-full bg-gray-100 dark:bg-slate-900 border border-transparent text-gray-600 dark:text-gray-300 hover:border-brand-orange hover:text-brand-orange dark:hover:text-brand-orange transition-all text-sm font-bold">
                Adulto
              </button>
            </Link>
            <Link href="/catalogo/niño">
              <button className="px-6 py-2.5 rounded-full bg-gray-100 dark:bg-slate-900 border border-transparent text-gray-600 dark:text-gray-300 hover:border-brand-orange hover:text-brand-orange dark:hover:text-brand-orange transition-all text-sm font-bold">
                Niño
              </button>
            </Link>
            <Link href="/catalogo/deportivo">
              <button className="px-6 py-2.5 rounded-full bg-gray-100 dark:bg-slate-900 border border-transparent text-gray-600 dark:text-gray-300 hover:border-brand-orange hover:text-brand-orange dark:hover:text-brand-orange transition-all text-sm font-bold">
                Deportivo
              </button>
            </Link>
          </div>
        </div>

        {/* Grid de Productos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {zapatos?.map((zapato) => (
            <ProductCard key={zapato.id} zapato={zapato} />
          ))}
        </div>
      </div >

      {/* Footer */}
      {/* Footer - Global en Layout */}
    </main >
  )
}
