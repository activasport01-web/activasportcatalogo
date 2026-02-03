'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Definimos la estructura de un item en el carrito mayorista
export type CartItem = {
    id_producto: string
    nombre: string
    precio_unitario: number
    imagen: string
    tipo_curva: 'Niño (27-32)' | 'Juvenil (32-37)' | 'Adulto (38-43)'
    cantidad_pares: 6 | 12 // Media docena o Docena
    color?: string // Nuevo: Color específico del bulto
    marca?: string // Marca del producto
    total_item: number
}

type CartContextType = {
    items: CartItem[]
    addToCart: (item: CartItem) => void
    removeFromCart: (index: number) => void
    clearCart: () => void
    cartTotal: number
    cartCount: number // Cantidad de "Cajones/Paquetes", no de pares individuales
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
    console.log('[CartContext] CartProvider rendering') // DEBUG
    const [items, setItems] = useState<CartItem[]>([])
    const [isLoaded, setIsLoaded] = useState(false)

    // Cargar carrito de localStorage al iniciar
    useEffect(() => {
        const savedCart = localStorage.getItem('wholesale_cart')
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart))
            } catch (e) {
                console.error("Error cargando carrito", e)
            }
        }
        setIsLoaded(true)
    }, [])

    // Guardar en localStorage cada vez que cambia
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('wholesale_cart', JSON.stringify(items))
        }
    }, [items, isLoaded])

    const addToCart = (newItem: CartItem) => {
        setItems(prev => [...prev, newItem])
        // Podríamos agregar un toast/notificación aquí
    }

    const removeFromCart = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index))
    }

    const clearCart = () => {
        setItems([])
    }

    // Calcular el total de dinero en el carrito
    const cartTotal = items.reduce((sum, item) => sum + item.total_item, 0)

    const cartCount = items.length

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, cartTotal, cartCount }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        // Fallback robusto para evitar crash en producción/SSR si el contexto falla
        console.error('CRITICAL: useCart used outside CartProvider! Returning dummy context.')
        if (typeof window === 'undefined') {
            console.log('CRITICAL: This is happening on SERVER SIDE')
        }
        return {
            items: [],
            addToCart: () => console.warn('addToCart called without provider'),
            removeFromCart: () => { },
            clearCart: () => { },
            cartTotal: 0,
            cartCount: 0
        }
    }
    return context
}
