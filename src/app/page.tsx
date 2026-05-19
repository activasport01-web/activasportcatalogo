import Link from 'next/link'
import { supabase, proxyImageUrl } from '@/lib/supabase'
import HeroSection from '@/components/HeroSection'
import ProductCard from '@/components/ProductCard'
import BrandsCarousel from '@/components/BrandsCarousel'
import { Sparkles, TrendingUp, Award, ArrowRight } from 'lucide-react'

// ISR (Incremental Static Regeneration): Actualiza la caché en segundo plano cada 60 segundos 
// para que la web vuele sin saturar las consultas a Supabase.
export const revalidate = 60;

export default async function Home() {
  // 1. Obtener TODAS las Portadas activas (carrusel de portadas)
  const { data: portadas } = await supabase
    .from('portada_destacada')
    .select('*')
    .eq('activo', true)
    .order('id', { ascending: false })

  // 2. Obtener Zapatos Disponibles (Con Prioridad a Marca "Activa")
  // Buscar el ID de la marca "Activa" primero
  const { data: activaMarca } = await supabase
    .from('marcas')
    .select('id')
    .ilike('nombre', '%activa%')
    .limit(1)
    .single()

  let activaProducts: any[] = []
  if (activaMarca?.id) {
    const { data } = await supabase
      .from('zapatos')
      .select('*, marca_obj:marcas(nombre), cat_obj:categorias(nombre), gen_obj:generos(nombre)')
      .eq('disponible', true)
      .eq('marca_id', activaMarca.id)
      .order('fecha_creacion', { ascending: false })
      .limit(4)
    activaProducts = data || []
  }

  const { data: generalProducts } = await supabase
    .from('zapatos')
    .select('*, marca_obj:marcas(nombre), cat_obj:categorias(nombre), gen_obj:generos(nombre)')
    .eq('disponible', true)
    .order('fecha_creacion', { ascending: false })
    .limit(12)

  const combinedZapatos = [
    ...(activaProducts || []),
    ...(generalProducts || [])
  ]

  const uniqueZapatosRaw = combinedZapatos.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
  const zapatos = uniqueZapatosRaw.slice(0, 12)

  // ═══════════════════════════════════════════════════════════════
  // PREPARAR SLIDES PARA EL HERO (Solo Portadas del Admin)
  // 1 portada = sin carrusel  |  2-3+ portadas = carrusel
  // ═══════════════════════════════════════════════════════════════
  const slides: { id: string; title: string; subtitle?: string; description: string; image_url: string | null; link: string; tag?: string }[] = [];

  // SLIDES: Todas las portadas activas (Admin > Portada Web)
  if (portadas && portadas.length > 0) {
    portadas.forEach((p: any) => {
      slides.push({
        id: `portada-${p.id}`,
        title: p.titulo,
        description: p.descripcion || '',
        image_url: p.url_imagen,
        link: '/catalogo'
      });
    });
  }

  // Fallback absoluto
  if (slides.length === 0) {
    slides.push({
      id: 'fallback',
      title: 'Activa Sport',
      description: 'Explora nuestra colección completa de calzados al por mayor.',
      image_url: null,
      link: '/catalogo',
      tag: '👟 CATÁLOGO 2024'
    })
  }

  // 3. Filtrar productos para las tarjetas destacadas inferiores
  const pNuevo = zapatos && zapatos.length > 0 ? zapatos[0] : null

  const pPopular = zapatos && zapatos.length > 0 ? (
    zapatos.find((z: any) => z.nombre.toLowerCase().includes('activa') || (z.marca_obj?.nombre || z.marca || '').toLowerCase().includes('activa'))
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

      {/* Promociones integradas en el HeroSection */}

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
