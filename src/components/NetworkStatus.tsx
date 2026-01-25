'use client'
import { useState, useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

export default function NetworkStatus() {
    const [isOnline, setIsOnline] = useState(true)
    const [showToast, setShowToast] = useState(false)

    useEffect(() => {
        // Definir estado inicial (asumiendo online si window no está definido aún)
        if (typeof window !== 'undefined') {
            setIsOnline(navigator.onLine)
        }

        const handleOnline = () => {
            setIsOnline(true)
            setShowToast(true)
            // Ocultar mensaje de "Online" después de 3 segundos
            setTimeout(() => setShowToast(false), 3000)
        }

        const handleOffline = () => {
            setIsOnline(false)
            setShowToast(true)
            // El mensaje de "Offline" se queda hasta que vuelva internet
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    if (!showToast && isOnline) return null

    return (
        <div className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-500 ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border ${isOnline
                    ? 'bg-green-500/90 text-white border-green-400'
                    : 'bg-red-500/90 text-white border-red-400'
                }`}>
                {isOnline ? (
                    <>
                        <Wifi size={20} className="animate-pulse" />
                        <span className="font-bold text-sm">¡Conexión restablecida!</span>
                    </>
                ) : (
                    <>
                        <WifiOff size={20} />
                        <span className="font-bold text-sm">Sin conexión a internet</span>
                    </>
                )}
            </div>
        </div>
    )
}
