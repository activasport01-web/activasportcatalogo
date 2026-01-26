import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import HeroSection from '@/components/HeroSection'
import ProductCard from '@/components/ProductCard'
import BrandsCarousel from '@/components/BrandsCarousel'
import { Sparkles, TrendingUp, Award, ArrowRight } from 'lucide-react'

// Esto asegura que la página no guarde caché vieja y muestre siempre lo nuevo
export const revalidate = 0;

export default async function Home() {
  // 1. Obtener Banner Activo
  const { data: heroData } = await supabase
    .from('portada_destacada')
    .select('*')
    .eq('activo', true)
    .single()

  // 2. Obtener Zapatos Disponibles
  const { data: zapatos } = await supabase
    .from('zapatos')
    .select('*')
    .eq('disponible', true)
    .order('fecha_creacion', { ascending: false })

  // Preparar datos para el Carrusel (HeroSection)
  const slides = [];

  // 1. Si hay una portada destacada manual, va primero
  if (heroData) {
    slides.push({
      id: 'portada-main',
      title: heroData.titulo,
      description: heroData.descripcion,
      image_url: heroData.url_imagen,
      product_link: heroData.id_producto ? `/producto/${heroData.id_producto}` : '/catalogo',
      tag: '⭐ DESTACADO'
    });
  }

  // 2. Rellenar con los últimos 4 productos nuevos para tener variedad
  if (zapatos) {
    const nuevos = zapatos.slice(0, 4).map((z: any) => ({
      id: z.id,
      title: z.nombre,
      description: `¡Tendencia de temporada! Disponible ahora`,
      image_url: z.url_imagen,
      product_link: `/producto/${z.id}`,
      tag: '✨ NUEVO INGRESO'
    }));
    slides.push(...nuevos);
  }

  // 3. Filtrar productos y preparar datos visuales destacados
  // Aseguramos que existan datos antes de acceder
  const pNuevo = zapatos && zapatos.length > 0 ? zapatos[0] : null

  // Buscar un producto que sea Nike o TN, si no, usar el segundo más nuevo
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
    <main className="min-h-screen bg-white dark:bg-black relative overflow-hidden transition-colors duration-300">
      {/* Navbar */}
      {/* Navbar - Global en Layout */}

      {/* Banner Principal */}
      <HeroSection slides={slides} />

      {/* Carrusel de Marcas */}
      <BrandsCarousel />

      {/* Sección de Categorías Destacadas */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* 1. NUEVO INGRESO (Dinámico) */}
          <Link href={pNuevo ? `/producto/${pNuevo.id}` : '/catalogo?sort=recientes'} className="h-64 group">
            <div className="relative bg-gradient-to-br from-black to-zinc-900 rounded-[2rem] p-6 overflow-hidden shadow-2xl h-full flex flex-col justify-between transform hover:-translate-y-2 hover:shadow-brand-orange/20 transition-all border border-brand-orange/20">

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
            <div className="relative bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] p-6 overflow-hidden shadow-xl h-full flex flex-col justify-between transform hover:-translate-y-2 transition-all border border-transparent dark:border-white/10 hover:border-brand-orange/20">

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
            <div className="relative bg-white dark:bg-black rounded-[2rem] p-6 overflow-hidden shadow-xl h-full flex flex-col justify-between transform hover:-translate-y-2 transition-all border-2 border-dashed border-gray-200 dark:border-zinc-800 hover:border-brand-orange dark:hover:border-brand-orange">

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
              <button className="px-6 py-2.5 rounded-full bg-gray-100 dark:bg-zinc-900 border border-transparent text-gray-600 dark:text-gray-300 hover:border-brand-orange hover:text-brand-orange dark:hover:text-brand-orange transition-all text-sm font-bold">
                Adulto
              </button>
            </Link>
            <Link href="/catalogo/niño">
              <button className="px-6 py-2.5 rounded-full bg-gray-100 dark:bg-zinc-900 border border-transparent text-gray-600 dark:text-gray-300 hover:border-brand-orange hover:text-brand-orange dark:hover:text-brand-orange transition-all text-sm font-bold">
                Niño
              </button>
            </Link>
            <Link href="/catalogo/deportivo">
              <button className="px-6 py-2.5 rounded-full bg-gray-100 dark:bg-zinc-900 border border-transparent text-gray-600 dark:text-gray-300 hover:border-brand-orange hover:text-brand-orange dark:hover:text-brand-orange transition-all text-sm font-bold">
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
