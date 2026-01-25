import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import HeroSection from '@/components/HeroSection'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
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
      description: `Disponible por Bs ${z.precio}. ¡Tendencia de temporada!`,
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
    <main className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Decoración de fondo */}
      {/* Decoración de fondo */}
      <div className="fixed top-20 right-10 w-72 h-72 bg-neon-400 rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob"></div>
      <div className="fixed top-40 left-10 w-72 h-72 bg-gray-400 rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      <div className="fixed bottom-20 right-1/3 w-72 h-72 bg-neon-600 rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

      {/* Navbar */}
      <Navbar />

      {/* Banner Principal */}
      <HeroSection slides={slides} />

      {/* Sección de Categorías Destacadas */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* 1. NUEVO INGRESO (Dinámico) */}
          <Link href={pNuevo ? `/producto/${pNuevo.id}` : '/catalogo?sort=recientes'} className="h-64 group">
            <div className="relative bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-6 overflow-hidden shadow-xl h-full flex flex-col justify-between transform hover:-translate-y-1 transition-all border border-white/20">

              {/* Texto a la Izquierda */}
              <div className="relative z-20 max-w-[50%]">
                <div className="inline-block bg-brand-black/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-white mb-3 border border-white/30 uppercase tracking-widest">
                  ✨ Nuevo Ingreso
                </div>
                <h3 className="text-white text-2xl font-black leading-tight line-clamp-2 drop-shadow-md">
                  {pNuevo?.nombre || 'Nueva Colección'}
                </h3>
                <p className="text-neon-200 text-sm font-medium mt-1">
                  {getColorName(pNuevo)}
                </p>
              </div>

              {pNuevo && (
                <div className="absolute top-4 right-4 w-[45%] h-[90%] pointer-events-none">
                  {/* Imagen Sólida, sin opacidad, con bordes redondeados */}
                  <img
                    src={pNuevo.url_imagen}
                    alt={pNuevo.nombre}
                    className="w-full h-full object-cover rounded-2xl shadow-lg transform rotate-[-6deg] group-hover:rotate-0 group-hover:scale-105 transition-all duration-500"
                  />
                </div>
              )}
            </div>
          </Link>

          {/* 2. MÁS POPULAR (Dinámico) */}
          <Link href={pPopular ? `/producto/${pPopular.id}` : '/catalogo'} className="h-64 group">
            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 overflow-hidden shadow-xl h-full flex flex-col justify-between transform hover:-translate-y-1 transition-all border border-white/20">

              <div className="relative z-20 max-w-[50%]">
                <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white mb-3">
                  🔥 Más Buscado
                </div>
                <h3 className="text-white text-2xl font-black leading-tight line-clamp-2 drop-shadow-md">
                  {pPopular?.nombre || 'Tendencias'}
                </h3>
                <p className="text-blue-100 text-sm font-medium mt-1">
                  {getColorName(pPopular)}
                </p>
              </div>

              {pPopular && (
                <div className="absolute top-4 right-4 w-[45%] h-[90%] pointer-events-none">
                  <img
                    src={pPopular.url_imagen}
                    alt={pPopular.nombre}
                    className="w-full h-full object-cover rounded-2xl shadow-lg transform rotate-[-6deg] group-hover:rotate-0 group-hover:scale-105 transition-all duration-500"
                  />
                </div>
              )}
            </div>
          </Link>

          {/* 3. MEJOR OFERTA (Dinámico) */}
          <Link href={pOferta ? `/producto/${pOferta.id}` : '/ofertas'} className="h-64 group">
            <div className="relative bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-6 overflow-hidden shadow-xl h-full flex flex-col justify-between transform hover:-translate-y-1 transition-all border border-white/20">

              <div className="relative z-20 max-w-[50%]">
                <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white mb-3">
                  🏷️ Super Oferta
                </div>
                <h3 className="text-white text-2xl font-black leading-tight line-clamp-2 drop-shadow-md">
                  {pOferta?.nombre || 'Descuentos'}
                </h3>
                <p className="text-rose-100 text-2xl font-black mt-1">
                  Bs {pOferta?.precio}
                </p>
              </div>

              {pOferta && (
                <div className="absolute top-4 right-4 w-[45%] h-[90%] pointer-events-none">
                  <img
                    src={pOferta.url_imagen}
                    alt={pOferta.nombre}
                    className="w-full h-full object-cover rounded-2xl shadow-lg transform rotate-[-6deg] group-hover:rotate-0 group-hover:scale-105 transition-all duration-500"
                  />
                </div>
              )}
            </div>
          </Link>
        </div>
      </section>

      {/* Catálogo de Zapatos */}
      <div id="catalogo" className="relative z-10 max-w-7xl mx-auto py-16 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Catálogo</h2>
            <p className="text-gray-600">Explora todos nuestros modelos disponibles</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/catalogo">
              <button className="px-5 py-2.5 rounded-full bg-brand-black text-neon-500 font-bold hover:bg-neon-500 hover:text-brand-black transition shadow-md border border-neon-500/30">
                Ver Todo
              </button>
            </Link>
            <Link href="/catalogo/adulto">
              <button className="px-5 py-2.5 rounded-full bg-white border border-slate-200 text-brand-black hover:border-neon-500 hover:bg-neon-50 transition text-sm font-bold">
                Adulto
              </button>
            </Link>
            <Link href="/catalogo/niño">
              <button className="px-5 py-2.5 rounded-full bg-white border border-slate-200 text-brand-black hover:border-neon-500 hover:bg-neon-50 transition text-sm font-bold">
                Niño
              </button>
            </Link>
            <Link href="/catalogo/deportivo">
              <button className="px-5 py-2.5 rounded-full bg-white border border-slate-200 text-brand-black hover:border-neon-500 hover:bg-neon-50 transition text-sm font-bold">
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
      </div>

      {/* Footer */}
      <Footer />
    </main>
  )
}
