'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('light')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        // Verificar preferencia del sistema o guardada
        const savedTheme = localStorage.getItem('theme') as Theme
        if (savedTheme) {
            setTheme(savedTheme)
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark')
        }
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return

        // Actualizar clase en el root
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(theme)

        // Guardar preferencia
        localStorage.setItem('theme', theme)
    }, [theme, mounted])

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light')
    }

    // No condicionamos el renderizado del Provider al montado para que el contexto esté disponible en SSR
    // Solo evitamos el renderizado de componentes dependientes del tema visual si es crítico, 
    // pero aquí necesitamos el contexto siempre.

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
