'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X, LogOut, ShoppingBag, Heart, Clock } from 'lucide-react'

export default function PerfilPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        direccion: '',
        ciudad: '',
        pais: ''
    })

    useEffect(() => {
        checkUser()
    }, [])

    const checkUser = async () => {
        try {
            const { data: { user }, error } = await supabase.auth.getUser()

            if (error || !user) {
                // No hay usuario autenticado, redirigir al login
                router.push('/admin/login')
                return
            }

            setUser(user)
            // Cargar datos del perfil
            setFormData({
                nombre: user.user_metadata?.nombre || '',
                telefono: user.user_metadata?.telefono || '',
                direccion: user.user_metadata?.direccion || '',
                ciudad: user.user_metadata?.ciudad || '',
                pais: user.user_metadata?.pais || 'Bolivia'
            })
            setLoading(false)
        } catch (err) {
            console.error('Error al verificar usuario:', err)
            router.push('/admin/login')
        }
    }

    const handleSave = async () => {
        try {
            const { error } = await supabase.auth.updateUser({
                data: formData
            })

            if (error) {
                alert('Error al actualizar perfil: ' + error.message)
            } else {
                alert('Perfil actualizado correctamente')
                setEditing(false)
                checkUser()
            }
        } catch (err: any) {
            alert('Error: ' + err.message)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 transition-colors duration-300">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Cargando perfil...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">


            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Header del Perfil */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden mb-8 transition-colors">
                    <div className="h-32 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700"></div>
                    <div className="px-8 pb-8">
                        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full bg-white dark:bg-slate-900 p-2 shadow-xl transition-colors">
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                                        <User size={48} className="text-white" />
                                    </div>
                                </div>
                                <button className="absolute bottom-2 right-2 bg-white dark:bg-slate-800 rounded-full p-2 shadow-lg hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors">
                                    <Edit2 size={16} className="text-orange-600 dark:text-orange-500" />
                                </button>
                            </div>

                            {/* Info del Usuario */}
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">
                                    {formData.nombre || 'Usuario'}
                                </h1>
                                <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2 mb-4">
                                    <Mail size={16} />
                                    {user?.email}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm font-medium">
                                        Cliente Mayorista
                                    </span>
                                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium flex items-center gap-1">
                                        <Calendar size={14} />
                                        Miembro desde {new Date(user?.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>

                            {/* Botones de Acción */}
                            <div className="flex gap-3">
                                {!editing ? (
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                                    >
                                        <Edit2 size={18} />
                                        Editar Perfil
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                                        >
                                            <Save size={18} />
                                            Guardar
                                        </button>
                                        <button
                                            onClick={() => setEditing(false)}
                                            className="px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-600 transition-all flex items-center gap-2"
                                        >
                                            <X size={18} />
                                            Cancelar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Columna Izquierda - Información Personal */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Información Personal */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 transition-colors">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Información Personal</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Nombre Completo</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 dark:text-white"
                                            placeholder="Tu nombre completo"
                                        />
                                    ) : (
                                        <p className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-800 dark:text-slate-200 font-medium">
                                            {formData.nombre || 'No especificado'}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Correo Electrónico</label>
                                    <p className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-800 dark:text-slate-200 font-medium flex items-center gap-2">
                                        <Mail size={16} className="text-slate-500 dark:text-slate-400" />
                                        {user?.email}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Teléfono</label>
                                    {editing ? (
                                        <input
                                            type="tel"
                                            value={formData.telefono}
                                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 dark:text-white"
                                            placeholder="+591 12345678"
                                        />
                                    ) : (
                                        <p className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-800 dark:text-slate-200 font-medium flex items-center gap-2">
                                            <Phone size={16} className="text-slate-500 dark:text-slate-400" />
                                            {formData.telefono || 'No especificado'}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Ciudad</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={formData.ciudad}
                                            onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 dark:text-white"
                                            placeholder="Tu ciudad"
                                        />
                                    ) : (
                                        <p className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-800 dark:text-slate-200 font-medium flex items-center gap-2">
                                            <MapPin size={16} className="text-slate-500 dark:text-slate-400" />
                                            {formData.ciudad || 'No especificado'}
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Dirección</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={formData.direccion}
                                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 dark:text-white"
                                            placeholder="Tu dirección completa"
                                        />
                                    ) : (
                                        <p className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-800 dark:text-slate-200 font-medium">
                                            {formData.direccion || 'No especificado'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Historial de Pedidos */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 transition-colors">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Historial de Pedidos</h2>
                            </div>

                            <div className="text-center py-12">
                                <ShoppingBag size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-500 dark:text-slate-400 font-medium">Aún no tienes pedidos</p>
                                <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Explora nuestro catálogo y realiza tu primer pedido</p>
                                <button className="mt-6 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg">
                                    Ver Catálogo
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha - Acciones Rápidas */}
                    <div className="space-y-6">
                        {/* Estadísticas */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 transition-colors">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Resumen</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                                            <ShoppingBag size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600 dark:text-slate-300">Total Pedidos</p>
                                            <p className="text-2xl font-bold text-slate-800 dark:text-white">0</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                                            <Heart size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600 dark:text-slate-300">Favoritos</p>
                                            <p className="text-2xl font-bold text-slate-800 dark:text-white">0</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                            <Clock size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600 dark:text-slate-300">Pendientes</p>
                                            <p className="text-2xl font-bold text-slate-800 dark:text-white">0</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 transition-colors">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Acciones</h2>
                            </div>

                            <div className="space-y-3">
                                <Link href="/catalogo">
                                    <button className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors text-left flex items-center gap-3">
                                        <ShoppingBag size={18} />
                                        Ver Catálogo
                                    </button>
                                </Link>

                                <Link href="/favoritos">
                                    <button className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors text-left flex items-center gap-3">
                                        <Heart size={18} />
                                        Mis Favoritos
                                    </button>
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 rounded-lg font-medium transition-colors text-left flex items-center gap-3"
                                >
                                    <LogOut size={18} />
                                    Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    )
}
