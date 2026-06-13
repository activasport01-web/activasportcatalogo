'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
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

  const currentUserRef = useRef<string | null>(null)

  useEffect(() => {
    let mounted = true

    // Timeout de seguridad: si Supabase tarda más de 20 segundos, forzamos la salida del estado de carga
    const fallbackTimer = setTimeout(() => {
      if (mounted) {
        console.warn("Auth check timed out, forcing loading = false")
        setLoading(false)
      }
    }, 20000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthContext] onAuthStateChange event: ${event}`, session?.user?.id || 'no user')

      try {
        if (session?.user) {
          if (currentUserRef.current === session.user.id) {
            console.log(`[AuthContext] User ${session.user.id} already loaded, skipping profile fetch.`)
            
            // Si el perfil ya está cargado, aseguremonos de detener el loader y el timeout
            if (mounted) {
              clearTimeout(fallbackTimer)
              setLoading(false)
            }
            return
          }

          currentUserRef.current = session.user.id
          if (mounted) setUser(session.user)
          await loadProfile(session.user.id, mounted)
        } else {
          currentUserRef.current = null
          if (mounted) {
            setUser(null)
            setProfile(null)
            setPermissions([])
            // Borramos la cookie de sesión si realmente no hay un usuario activo
            document.cookie = 'admin_session=; path=/; SameSite=Strict; expires=Thu, 01 Jan 1970 00:00:01 GMT'
          }
        }
      } catch (err) {
        console.error("Error handling auth state change:", err)
      } finally {
        if (mounted) {
          clearTimeout(fallbackTimer)
          setLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      clearTimeout(fallbackTimer)
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
        // Si el usuario está desactivado, cerrar sesión
        if (!profileData.activo) {
          await logout()
          return
        }

        // Escribir cookie de sesión antes de actualizar el estado para evitar condiciones de carrera en redirecciones
        document.cookie = 'admin_session=1; path=/; SameSite=Strict; max-age=2592000'
        setProfile(profileData as any)

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
