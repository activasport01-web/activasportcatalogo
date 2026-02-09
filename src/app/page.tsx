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

      {/* Sección de Categorías Destacadas (Mobile Grid 2x2) */}
      <section className="relative z-10 max-w-7xl mx-auto px-2 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">

          {/* 1. NUEVO INGRESO (Vertical Grid Item) */}
          <Link href={pNuevo ? `/producto/${pNuevo.id}` : '/catalogo?sort=recientes'} className="group relative aspect-[3/4] overflow-hidden">
            {pNuevo ? (
              <>
                <img
                  src={pNuevo.url_imagen}
                  alt="Nuevo"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 transition-opacity" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="block text-[10px] uppercase tracking-widest font-bold text-brand-orange mb-1">NUEVO</span>
                  <h3 className="text-sm font-bold leading-tight line-clamp-2">{pNuevo.nombre}</h3>
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs font-bold">NUEVO</div>
            )}
          </Link>

          {/* 2. MÁS POPULAR */}
          <Link href={pPopular ? `/producto/${pPopular.id}` : '/catalogo'} className="group relative aspect-[3/4] overflow-hidden">
            {pPopular ? (
              <>
                <img
                  src={pPopular.url_imagen}
                  alt="Popular"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 transition-opacity" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="block text-[10px] uppercase tracking-widest font-bold text-green-400 mb-1">TRENDING</span>
                  <h3 className="text-sm font-bold leading-tight line-clamp-2">{pPopular.nombre}</h3>
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs font-bold">POPULAR</div>
            )}
          </Link>

          {/* 3. MEJOR OFERTA */}
          <Link href={pOferta ? `/producto/${pOferta.id}` : '/ofertas'} className="group relative aspect-[3/4] overflow-hidden col-span-2 md:col-span-1">
            {pOferta ? (
              <>
                <img
                  src={pOferta.url_imagen}
                  alt="Oferta"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1">
                  OFERTA
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 transition-opacity" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="block text-[10px] uppercase tracking-widest font-bold text-red-500 mb-1">SALE</span>
                  <h3 className="text-sm font-bold leading-tight line-clamp-2">{pOferta.nombre}</h3>
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs font-bold">OFERTAS</div>
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
          <div className="flex flex-wrap gap-2">
            <Link href="/catalogo">
              <button className="px-4 py-2 rounded-none border-b-2 border-brand-orange text-brand-orange font-bold text-sm">
                Todo
              </button>
            </Link>
            <Link href="/catalogo/adulto">
              <button className="px-4 py-2 rounded-none border-b-2 border-transparent hover:border-black text-gray-500 hover:text-black transition-all text-sm font-medium">
                Adulto
              </button>
            </Link>
            <Link href="/catalogo/niño">
              <button className="px-4 py-2 rounded-none border-b-2 border-transparent hover:border-black text-gray-500 hover:text-black transition-all text-sm font-medium">
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
