export default function PrivacidadPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-32 pb-16 px-6">
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800 animate-fade-in-up">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-8 border-b-2 border-brand-orange pb-4 inline-block">
                    Política de Privacidad
                </h1>

                <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">1. Uso de la Información</h2>
                        <p>
                            En <strong>Activa Sport</strong>, respetamos tu privacidad. La información que recopilamos (nombre, teléfono, ciudad)
                            se utiliza exclusivamente para:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li>Procesar y coordinar tus pedidos mayoristas.</li>
                            <li>Contactarte vía WhatsApp para confirmaciones y seguimiento.</li>
                            <li>Mejorar tu experiencia de navegación en nuestro catálogo digital.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">2. Protección de Datos</h2>
                        <p>
                            No compartimos, vendemos ni alquilamos tu información personal a terceros.
                            Tus datos están almacenados de forma segura y solo son accesibles por nuestro equipo de ventas y administración para fines operativos.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">3. Cookies y Almacenamiento Local</h2>
                        <p>
                            Utilizamos almacenamiento local (LocalStorage) en tu navegador para funciones esenciales como:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li>Mantener los productos en tu carrito de compras mientras navegas.</li>
                            <li>Recordar tus productos vistos recientemente o favoritos.</li>
                            <li>Guardar tus preferencias de modo oscuro/claro.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">4. Cambios en la Política</h2>
                        <p>
                            Nos reservamos el derecho de modificar esta política de privacidad en cualquier momento.
                            Cualquier cambio será reflejado en esta página.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">5. Contacto</h2>
                        <p>
                            Si tienes dudas sobre cómo manejamos tus datos, puedes contactarnos directamente a nuestro WhatsApp oficial o visitarnos en nuestra tienda en Feria Barrio Lindo.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
