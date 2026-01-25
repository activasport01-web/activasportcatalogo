'use client'
import { useFavorites } from '@/context/FavoritesContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react'
import ProductCard from '@/components/ProductCard'

export default function Favoritos() {
    // Usamos el hook real
    const { favorites } = useFavorites()

    // Ya no necesitamos loading porque localStorage es síncrono (o cargó muy rápido en el provider)
    // El Context maneja su propio estado de carga si fuera necesario, pero simplifiquemos aquí.

    return (
        <main className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />

            <div className="flex-1 pt-8 pb-12">
                <div className="max-w-7xl mx-auto px-6">

                    {/* Header */}
                    <div className="mb-8 animate-fade-in flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                                <Heart className="text-red-500 fill-red-500" size={32} />
                                Mis Favoritos
                            </h1>
                            <p className="text-slate-500 mt-2">
                                {favorites.length} productos guardados para después.
                            </p>
                        </div>
                        {favorites.length > 0 && (
                            <Link href="/">
                                <button className="text-orange-600 font-semibold hover:text-orange-700 flex items-center gap-2 group">
                                    Seguir comprando
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </Link>
                        )}
                    </div>

                    {favorites.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-slide-up">
                            {favorites.map((producto) => (
                                <ProductCard key={producto.id} zapato={producto} />
                            ))}
                        </div>
                    ) : (
                        // Empty State
                        <div className="bg-white rounded-3xl shadow-xl p-12 text-center animate-fade-in border border-slate-100 max-w-2xl mx-auto mt-12">
                            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Heart className="text-red-400" size={48} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Tu lista de deseos está vacía</h2>
                            <p className="text-slate-500 mb-8">
                                Guarda los zapatos que te encantan haciendo clic en el corazón. ¡Así no los perderás de vista!
                            </p>
                            <Link href="/">
                                <button className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mx-auto">
                                    <ShoppingBag size={20} />
                                    Ver Novedades
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </main>
    )
}
