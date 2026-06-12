'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface UserRole {
  nombre: string
}

export interface UserProfile {
  id: string
  nombre_completo: string
  rol_id: string
  activo: boolean
  roles: UserRole
}

interface AuthContextType {
  user: any | null
  profile: UserProfile | null
  permissions: string[]
  loading: boolean
  hasPermission: (codigo: string) => boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  permissions: [],
  loading: true,
  hasPermission: () => false,
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let initialCheckDone = false

    async function initializeAuth() {
      // Timeout de seguridad: si Supabase tarda más de 8 segundos, forzamos la salida del estado de carga
      const fallbackTimer = setTimeout(() => {
        if (mounted) setLoading(false)
      }, 8000)

      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
           console.error("Session error during initialization:", error)
        }

        if (session?.user) {
          if (mounted) setUser(session.user)
          await loadProfile(session.user.id, mounted)
        } else {
          if (mounted) {
            setUser(null)
            setProfile(null)
            setPermissions([])
          }
        }
      } catch (error) {
        console.error('Error loading session:', error)
      } finally {
        clearTimeout(fallbackTimer)
        initialCheckDone = true
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignorar el evento inicial si ya se está cargando para evitar condiciones de carrera
      if (event === 'INITIAL_SESSION') return

      if (session?.user) {
        if (mounted) setUser(session.user)
        await loadProfile(session.user.id, mounted)
      } else {
        if (mounted) {
          setUser(null)
          setProfile(null)
          setPermissions([])
        }
      }
      
      if (mounted && initialCheckDone) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function loadProfile(userId: string, mounted: boolean) {
    try {
      // 1. Fetch user profile and role
      const { data: profileData, error: profileError } = await supabase
        .from('usuarios')
        .select(`
          id, 
          nombre_completo, 
          rol_id, 
          activo,
          roles (
            nombre
          )
        `)
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      if (profileData && mounted) {
        setProfile(profileData as any)

        // Si el usuario está desactivado, cerrar sesión
        if (!profileData.activo) {
          await logout()
          return
        }

        // 2. Fetch permissions for the role
        if (profileData.rol_id) {
          const { data: permsData, error: permsError } = await supabase
            .from('roles_permisos')
            .select(`
              permisos (codigo)
            `)
            .eq('rol_id', profileData.rol_id)

          if (!permsError && permsData) {
            const permsList = permsData
              .map(p => (p.permisos as any)?.codigo)
              .filter(Boolean)
            
            if (mounted) setPermissions(permsList)
          }
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const hasPermission = (codigo: string) => {
    // Si es Administrador, conceder acceso por diseño (además de los que tenga en BD)
    if (profile?.roles?.nombre === 'Administrador') return true;
    return permissions.includes(codigo)
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error during Supabase signOut:', error)
    }
    // Borrar cookie de sesión admin manual si existe
    document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    // Forzar limpieza y recarga para limpiar memoria
    setUser(null)
    setProfile(null)
    setPermissions([])
    window.location.href = '/admin/login'
  }

  return (
    <AuthContext.Provider value={{ user, profile, permissions, loading, hasPermission, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
