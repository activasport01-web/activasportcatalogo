import Link from 'next/link'
import { supabase, proxyImageUrl } from '@/lib/supabase'
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
  // 2. Obtener Zapatos Disponibles (Con Prioridad a Marca "Activa")
  // Estrategia Doble Consulta: Traer 4 de Activa + 8 Generales, luego combinar.
  const activaQuery = supabase
    .from('zapatos')
    .select('*')
    .eq('disponible', true)
    .ilike('marca', '%activa%')
    .order('fecha_creacion', { ascending: false })
    .limit(4)

  const generalQuery = supabase
    .from('zapatos')
    .select('*')
    .eq('disponible', true)
    .order('fecha_creacion', { ascending: false })
    .limit(12)

  const [{ data: activaProducts }, { data: generalProducts }] = await Promise.all([
    activaQuery,
    generalQuery
  ])

  // Combinar: Primero Activa, luego el resto (sin duplicados)
  const combinedZapatos = [
    ...(activaProducts || []),
    ...(generalProducts || [])
  ]

  // Deduplicar por ID
  const uniqueZapatosRaw = combinedZapatos.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)

  // Limitar total a 12 para la grilla
  const zapatos = uniqueZapatosRaw.slice(0, 12)

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
      (z.nombre.toLowerCase().includes('activa') || (z.marca && z.marca.toLowerCase().includes('activa'))) && z.id !== zapatos[0].id
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

  const pPopular = zapatos && zapatos.length > 0 ? (
    zapatos.find((z: any) => z.nombre.toLowerCase().includes('activa') || (z.marca && z.marca.toLowerCase().includes('activa')))
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

      {/* Sección de Categorías Destacadas (Banners Premium) */}
      <section className="relative z-10 max-w-5xl mx-auto px-3 py-6 md:py-10">
        <style dangerouslySetInnerHTML={{ __html: `
          .banner-premium .shoe-img { transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1); }
          .banner-premium:hover .shoe-img { transform: scale(1.08) rotate(-2deg); }
          .banner-premium .deco-stripe { transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1); }
          .banner-premium:hover .deco-stripe { transform: skewX(-12deg) scaleX(1.15); }
        `}} />
        <div className="flex flex-col gap-4 md:gap-6">

          {/* 1. NUEVO INGRESO (Banner Oscuro) */}
          <Link href={pNuevo ? `/producto/${pNuevo.id}` : '/catalogo?sort=recientes'} className="banner-premium group relative w-full h-48 md:h-60 overflow-hidden rounded-3xl shadow-lg block bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
            {pNuevo ? (
              <>
                {/* Decoración diagonal */}
                <div className="deco-stripe absolute -right-10 top-0 w-[45%] h-full bg-white/[0.07] skew-x-[-12deg] z-[1]" />
                <div className="absolute -right-20 top-0 w-[30%] h-full bg-white/[0.04] skew-x-[-12deg] z-[1]" />

                {/* Círculo decorativo sutil */}
                <div className="absolute -bottom-16 -right-16 w-56 h-56 md:w-72 md:h-72 rounded-full border border-white/10 z-[1]" />

                {/* Imagen del zapato (mix-blend-multiply elimina fondo blanco) */}
                <div className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 w-[45%] md:w-[40%] h-[85%] z-[2] flex items-center justify-center">
                  <img src={proxyImageUrl(pNuevo.url_imagen)} alt="Nuevo" className="shoe-img w-full h-full object-contain mix-blend-lighten drop-shadow-[0_5px_25px_rgba(255,255,255,0.15)] filter brightness-110" />
                </div>

                {/* Textos */}
                <div className="relative z-20 flex flex-col justify-center h-full w-[55%] md:w-[50%] pl-5 md:pl-10 py-4">
                  <span className="inline-block px-2.5 py-1 bg-white/10 text-white text-[10px] md:text-xs uppercase font-bold tracking-widest rounded-full w-max mb-2 backdrop-blur-md border border-white/20 shadow-sm">
                    ⭐ NUEVO INGRESO
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mb-1 drop-shadow-md line-clamp-2">{pNuevo.nombre}</h3>
                  <p className="text-[11px] md:text-sm text-slate-400 mb-3 font-medium line-clamp-2 drop-shadow">Últimos modelos de la temporada.</p>
                  <div className="flex items-center text-[10px] md:text-xs font-bold text-brand-orange uppercase tracking-wider mt-auto">
                    Explorar modelo <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">NUEVO</div>
            )}
          </Link>

          {/* 2. MÁS POPULAR (Banner Azul Vibrante) */}
          <Link href={pPopular ? `/producto/${pPopular.id}` : '/catalogo'} className="banner-premium group relative w-full h-48 md:h-60 overflow-hidden rounded-3xl shadow-lg block bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500">
            {pPopular ? (
              <>
                <div className="deco-stripe absolute -right-10 top-0 w-[45%] h-full bg-white/[0.1] skew-x-[-12deg] z-[1]" />
                <div className="absolute -right-20 top-0 w-[30%] h-full bg-white/[0.05] skew-x-[-12deg] z-[1]" />
                <div className="absolute -top-16 -right-16 w-56 h-56 md:w-72 md:h-72 rounded-full border border-white/15 z-[1]" />

                <div className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 w-[45%] md:w-[40%] h-[85%] z-[2] flex items-center justify-center">
                  <img src={proxyImageUrl(pPopular.url_imagen)} alt="Popular" className="shoe-img w-full h-full object-contain mix-blend-multiply drop-shadow-[0_5px_25px_rgba(0,0,0,0.2)] filter brightness-105" />
                </div>

                <div className="relative z-20 flex flex-col justify-center h-full w-[55%] md:w-[50%] pl-5 md:pl-10 py-4">
                  <span className="inline-block px-2.5 py-1 bg-white/20 text-white text-[10px] md:text-xs uppercase font-black tracking-widest rounded-full w-max mb-2 shadow-sm border border-white/30 backdrop-blur-sm">
                    🔥 MÁS BUSCADO
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mb-1 drop-shadow-md line-clamp-2">{pPopular.nombre}</h3>
                  <p className="text-[11px] md:text-sm text-blue-100 mb-3 font-medium line-clamp-2 drop-shadow">El favorito de nuestros clientes.</p>
                  <div className="flex items-center text-[10px] md:text-xs font-bold text-white uppercase tracking-wider mt-auto">
                    Ver modelo <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">POPULAR</div>
            )}
          </Link>

          {/* 3. MEJOR OFERTA (Banner Rojo Impacto) */}
          <Link href={pOferta ? `/producto/${pOferta.id}` : '/ofertas'} className="banner-premium group relative w-full h-48 md:h-60 overflow-hidden rounded-3xl shadow-lg block bg-gradient-to-br from-red-800 via-red-700 to-red-600">
            {pOferta ? (
              <>
                <div className="deco-stripe absolute -right-10 top-0 w-[45%] h-full bg-white/[0.08] skew-x-[-12deg] z-[1]" />
                <div className="absolute -right-20 top-0 w-[30%] h-full bg-white/[0.04] skew-x-[-12deg] z-[1]" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 md:w-56 md:h-56 rounded-full bg-yellow-400/10 z-[1]" />

                <div className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 w-[45%] md:w-[40%] h-[85%] z-[2] flex items-center justify-center">
                  <img src={proxyImageUrl(pOferta.url_imagen)} alt="Oferta" className="shoe-img w-full h-full object-contain mix-blend-multiply drop-shadow-[0_5px_25px_rgba(0,0,0,0.2)] filter brightness-105" />
                </div>

                <div className="relative z-20 flex flex-col justify-center h-full w-[55%] md:w-[50%] pl-5 md:pl-10 py-4">
                  <span className="inline-block px-2.5 py-1 bg-yellow-400 text-red-900 text-[10px] md:text-xs uppercase font-black tracking-widest rounded-full w-max mb-2 shadow-sm">
                    🏷️ MEJOR PRECIO
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mb-1 drop-shadow-md line-clamp-2">{pOferta.nombre}</h3>
                  
                  <p className="text-[11px] md:text-sm text-red-100 mb-3 font-medium drop-shadow">🔥 Precio exclusivo por mayor. ¡Consulta ahora!</p>

                  <div className="flex items-center text-[10px] md:text-xs font-bold text-white uppercase tracking-wider mt-auto">
                    Ver oferta <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">OFERTAS</div>
            )}
          </Link>

        </div>
      </section>

      {/* Catálogo de Zapatos */}
      <div id="catalogo" className="relative z-10 max-w-7xl mx-auto py-8 px-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 px-2">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-black dark:text-white uppercase tracking-tight">Catálogo</h2>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3">
            <Link href="/catalogo">
              <button className="px-5 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                Todo
              </button>
            </Link>
            <Link href="/catalogo/adulto">
              <button className="px-5 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium text-sm shadow-sm hover:border-slate-400 dark:hover:border-slate-500 hover:-translate-y-0.5 transition-all">
                Adulto
              </button>
            </Link>
            <Link href="/catalogo/niño">
              <button className="px-5 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium text-sm shadow-sm hover:border-slate-400 dark:hover:border-slate-500 hover:-translate-y-0.5 transition-all">
                Niño
              </button>
            </Link>
          </div>
        </div>

        {/* Grid de Productos (2 Columnas en Móvil asegurado) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 pb-10">
          {zapatos?.map((zapato) => (
            <ProductCard key={zapato.id} zapato={zapato} />
          ))}
        </div>
      </div>

      {/* Footer */}
      {/* Footer - Global en Layout */}
    </main >
  )
}
