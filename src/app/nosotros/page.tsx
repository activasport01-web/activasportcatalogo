import type { Metadata } from 'next'
import { Rocket, Target, Heart, Zap, Users, ShieldCheck, Briefcase, Smile } from 'lucide-react'
import Image from 'next/image'

export const metadata: Metadata = {
    title: 'Quiénes Somos | Activa Sport',
    description: 'Conoce la historia, misión y visión de Activa Sport. Importadora líder de zapatos deportivos en Bolivia.',
}

export default function AboutPage() {
    return (
        <div className="bg-white dark:bg-slate-950 font-sans transition-colors duration-300">
            {/* HERO SECTION - Dynamic & Orange */}
            <div className="relative py-32 bg-slate-950 overflow-hidden">
                <div className="absolute inset-0 opacity-50">
                    {/* Usamos una de las imágenes de marca (mockup polo) de fondo pero oscurecida para textura, o mantenemos la de stock si tiene mejor resolución para Hero */}
                    <Image
                        src="https://images.unsplash.com/photo-1511886929837-354d827aae26?q=80&w=2564&auto=format&fit=crop"
                        alt="Activa Sport Background"
                        fill
                        className="object-cover object-center"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>

                <div className="relative max-w-7xl mx-auto px-6 text-center z-10">
                    <div className="flex justify-center gap-3 mb-6 flex-wrap animate-fade-in-up">
                        {['PASIÓN', 'PROGRESO', 'JUVENTUD', 'ACCIÓN', 'DINÁMICO'].map((word) => (
                            <span key={word} className="px-3 py-1 bg-brand-orange/20 border border-brand-orange text-brand-orange text-xs font-bold tracking-widest uppercase rounded-full">
                                {word}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-5xl md:text-8xl font-bold text-white mb-6 uppercase tracking-tighter">
                        Activa <span className="text-brand-orange">Sport</span>
                    </h1>
                    <p className="text-gray-300 text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed font-light">
                        Tu destino para encontrar los mejores zapatos con estilo, calidad y comodidad.
                    </p>
                </div>
            </div>

            {/* SECTION: BRAND SHOWCASE (IMÁGENES DEL CLIENTE) */}
            <section className="py-10 bg-slate-950">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Mockup Polo */}
                        <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden group">
                            <Image
                                src="/images/about/polo.jpg"
                                alt="Camiseta Activa Sport"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                            <div className="absolute bottom-4 left-4">
                                <span className="text-white font-bold text-lg uppercase tracking-wider">Identidad</span>
                            </div>
                        </div>
                        {/* Mockup Gorra */}
                        <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden group">
                            <Image
                                src="/images/about/gorra.jpg"
                                alt="Gorra Activa Sport"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                            <div className="absolute bottom-4 left-4">
                                <span className="text-white font-bold text-lg uppercase tracking-wider">Estilo</span>
                            </div>
                        </div>
                        {/* Mockup Botella/Shaker (Recorte centrado) */}
                        <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden group">
                            <Image
                                src="/images/about/botella.jpg"
                                alt="Accesorios Activa Sport"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                            <div className="absolute bottom-4 left-4">
                                <span className="text-white font-bold text-lg uppercase tracking-wider">Deporte</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* DETRÁS DE LA IDENTIDAD & ACERCA DE LA MARCA */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    {/* Texto Izquierda */}
                    <div className="space-y-8 order-2 md:order-1">
                        <div>
                            <h4 className="text-brand-orange font-bold uppercase tracking-wider mb-2">02 Detrás de la Identidad</h4>
                            <h2 className="text-4xl font-bold text-black dark:text-white mb-6">
                                Nuestra Esencia
                            </h2>
                            <div className="w-24 h-1.5 bg-brand-orange rounded-full mb-8"></div>
                        </div>

                        <div className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed text-justify space-y-6">
                            <p>
                                Activa Sport es una empresa dedicada a la importación y distribución de zapatos
                                deportivos de calidad, económicos. Nuestra empresa se especializa en traer al mercado
                                local los últimos avances en calzado deportivo, combinando innovación,
                                tecnología, comodidad y estilo para satisfacer las necesidades de los atletas y
                                entusiastas del deporte.
                            </p>
                            <div className="p-6 bg-gray-50 dark:bg-slate-900 border-l-4 border-brand-orange rounded-r-xl">
                                <p className="font-medium italic text-black dark:text-gray-200">
                                    "Nace a partir de la agilidad y el dinamismo como factor esencial para una mejor
                                    calidad a la hora de tener actividad física. Somos una importadora que
                                    distribuye zapatos deportivos a nivel nacional en Bolivia."
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="relative order-1 md:order-2 h-[500px] w-full bg-gray-100 rounded-3xl overflow-hidden shadow-2xl skew-y-1">
                        <Image
                            src="/images/about/bolivia_activa_shoe.png"
                            alt="Fútbol en Bolivia"
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-orange/90 to-transparent opacity-60 mix-blend-multiply"></div>
                        <div className="absolute bottom-8 left-8 text-white">
                            <p className="text-3xl font-bold uppercase tracking-tighter">Bolivia Activa</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* MISIÓN & VISIÓN (Diseño Tarjetas Grandes) */}
            <section className="bg-slate-900 text-white py-24 px-6 relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <h2 className="text-5xl font-bold text-center mb-20">Nuestro Norte</h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Misión */}
                        <div className="group bg-slate-800/50 backdrop-blur-sm p-10 rounded-3xl border border-white/5 hover:border-brand-orange/50 transition-colors duration-500">
                            <div className="w-16 h-16 bg-brand-orange rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform">
                                <Target size={32} />
                            </div>
                            <h3 className="text-3xl font-bold mb-6 text-brand-orange uppercase">Misión</h3>
                            <p className="text-gray-300 leading-relaxed text-lg">
                                Proporcionar a nuestros clientes acceso a una amplia gama
                                de zapatos deportivos de alta calidad y marcas, importando
                                productos que combinan innovación, comodidad y estilo,
                                satisfaciendo las necesidades de los consumidores a través
                                de un enfoque centrado en el cliente.
                            </p>
                        </div>

                        {/* Visión */}
                        <div className="group bg-slate-800/50 backdrop-blur-sm p-10 rounded-3xl border border-white/5 hover:border-brand-orange/50 transition-colors duration-500">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-black mb-8 group-hover:scale-110 transition-transform">
                                <Rocket size={32} />
                            </div>
                            <h3 className="text-3xl font-bold mb-6 text-white uppercase">Visión</h3>
                            <p className="text-gray-300 leading-relaxed text-lg">
                                Ser la importadora líder de zapatos deportivos en el mercado,
                                reconocida por nuestra capacidad de traer las últimas tendencias y
                                tecnologías en calzado deportivo de todo el mundo. Aspiramos a
                                construir una red de distribución eficiente y sostenible.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* VALORES (Grid Moderno) */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="col-span-1 md:col-span-1 flex flex-col justify-center">
                        <span className="text-brand-orange font-bold uppercase tracking-wider mb-2">Valores</span>
                        <h2 className="text-4xl font-bold text-black dark:text-white mb-6">Lo que nos define</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Principios inquebrantables que guían cada paso que damos en Activa Sport.
                        </p>
                    </div>

                    <div className="col-span-1 md:col-span-2 grid sm:grid-cols-2 gap-6">
                        {/* Innovación */}
                        <div className="bg-orange-50 dark:bg-slate-900 p-8 rounded-2xl hover:bg-brand-orange hover:text-white transition-colors duration-300 group">
                            <Zap className="mb-4 text-brand-orange group-hover:text-white" size={32} />
                            <h3 className="text-xl font-bold mb-3">Innovación</h3>
                            <p className="text-sm opacity-90">
                                Activa Sport innova importando zapatillas con diseños
                                creativos para ofrecer el mejor rendimiento a sus clientes.
                            </p>
                        </div>

                        {/* Calidad */}
                        <div className="bg-orange-50 dark:bg-slate-900 p-8 rounded-2xl hover:bg-brand-orange hover:text-white transition-colors duration-300 group">
                            <ShieldCheck className="mb-4 text-brand-orange group-hover:text-white" size={32} />
                            <h3 className="text-xl font-bold mb-3">Calidad</h3>
                            <p className="text-sm opacity-90">
                                Compromiso con durabilidad, rendimiento y estilo en cada producto que importamos.
                            </p>
                        </div>

                        {/* Pasión */}
                        <div className="bg-orange-50 dark:bg-slate-900 p-8 rounded-2xl hover:bg-brand-orange hover:text-white transition-colors duration-300 group sm:col-span-2">
                            <Heart className="mb-4 text-brand-orange group-hover:text-white" size={32} />
                            <h3 className="text-xl font-bold mb-3">Pasión por el Deporte</h3>
                            <p className="text-sm opacity-90">
                                Promovemos la actividad física inspirando a las personas a alcanzar sus metas deportivas y personales.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* AUDIENCIA - Full Width Image Banner Concept */}
            <section className="relative py-24 bg-slate-900 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <Image
                        src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2832&auto=format&fit=crop"
                        alt="Audience Background"
                        fill
                        className="object-cover grayscale"
                    />
                </div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">Nuestra Audiencia</h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { icon: Users, title: "Jóvenes", desc: "Gran atractivo por el estilo de vida deportivo y fútbol." },
                            { icon: Briefcase, title: "Mayoristas", desc: "Grandes cantidades, calidad, precio y suministro garantizado." },
                            { icon: Smile, title: "Familias", desc: "Zapatos duraderos y económicos para todas las edades." },
                            { icon: Zap, title: "Deportistas", desc: "Comodidad y calidad para el máximo rendimiento." },
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:-translate-y-2 transition-transform">
                                <div className="bg-brand-orange w-12 h-12 rounded-full flex items-center justify-center mb-4 text-white">
                                    <item.icon size={20} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                <p className="text-gray-400 text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
