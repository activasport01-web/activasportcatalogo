'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Product = {
    id: string
    nombre: string
    precio: number
    url_imagen: string
    categoria: string
    etiquetas?: string[]
    disponible: boolean
}

type FavoritesContextType = {
    favorites: Product[]
    toggleFavorite: (product: Product) => void
    isFavorite: (id: string) => boolean
    favoritesCount: number
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavorites] = useState<Product[]>([])
    const [isLoaded, setIsLoaded] = useState(false)

    // Cargar favoritos al inicio
    // Cargar favoritos al inicio (Client-side only)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('user_favorites')
            if (saved) {
                try {
                    setFavorites(JSON.parse(saved))
                } catch (e) {
                    console.error("Error loading favorites", e)
                }
            }
            setIsLoaded(true)
        }
    }, [])

    // Guardar cambios
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('user_favorites', JSON.stringify(favorites))
        }
    }, [favorites, isLoaded])

    const toggleFavorite = (product: Product) => {
        setFavorites(prev => {
            const exists = prev.find(p => p.id === product.id)
            if (exists) {
                // Si existe, lo quitamos
                return prev.filter(p => p.id !== product.id)
            } else {
                // Si no existe, lo agregamos
                return [...prev, product]
            }
        })
    }

    const isFavorite = (id: string) => {
        return favorites.some(p => p.id === id)
    }

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, favoritesCount: favorites.length }}>
            {children}
        </FavoritesContext.Provider>
    )
}

export function useFavorites() {
    const context = useContext(FavoritesContext)
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider')
    }
    return context
}
