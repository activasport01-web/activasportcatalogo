export default function TerminosPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-32 pb-16 px-6">
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800 animate-fade-in-up">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-8 border-b-2 border-brand-orange pb-4 inline-block">
                    Términos y Condiciones
                </h1>

                <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">1. Introducción</h2>
                        <p>
                            Bienvenido a <strong>Activa Sport</strong>. Al acceder a nuestro catálogo digital y realizar pedidos, aceptas cumplir con los siguientes términos y condiciones.
                            Nos especializamos en la venta mayorista de calzados deportivos e informales.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">2. Pedidos y Venta Mayorista</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>La venta es exclusivamente por mayor, por cajas cerradas o surtidas según disponibilidad.</li>
                            <li>Los pedidos realizados a través de la web son solicitudes de compra sujetas a confirmación de stock.</li>
                            <li>Una vez realizado el pedido, nos pondremos en contacto vía WhatsApp para confirmar los detalles finales.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">3. Precios y Pagos</h2>
                        <p>
                            Los precios mostrados en el catálogo pueden estar sujetos a cambios sin previo aviso.
                            Aceptamos pagos mediante Transferencia Bancaria, Código QR, Depósito Bancario y Efectivo en tienda.
                            El pedido solo se despacha una vez confirmado el pago.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">4. Envíos y Entregas</h2>
                        <p>
                            Realizamos envíos a todo el territorio nacional (Bolivia). Trabajamos con empresas de transporte y encomiendas de confianza.
                            El costo del envío corre por cuenta del cliente, salvo promociones específicas.
                            Activa Sport no se hace responsable por demoras ocasionadas por la empresa de transporte.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">5. Cambios y Devoluciones</h2>
                        <p>
                            Debido a la naturaleza mayorista, solo se aceptan cambios por <strong>fallas de fábrica</strong> comprobables dentro de las 48 horas de recibido el pedido.
                            No se realizan cambios por rotación de producto o elección incorrecta de modelos por parte del cliente.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
