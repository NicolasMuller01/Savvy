'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// API constants
const USER_API = process.env.USER_API_URL || '/api/user'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  isConfigured: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  isConfigured: false,
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const configured = isSupabaseConfigured()

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }

    // Get initial session
    const getSession = async () => {
      if (!supabase) return
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          // Error getting session
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        // Error during session check
      }
      setLoading(false)
    }

    getSession()

    // Listen for auth changes only if supabase is configured
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)

          // Si el usuario se logueó exitosamente, crear/actualizar en la base de datos
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              // Llamar a la API route para crear/actualizar usuario
              const response = await fetch(USER_API, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  supabaseUser: session.user,
                }),
              })

              if (!response.ok) {
                const errorData = await response.json()
                // Error from API
              }
            } catch (error) {
              // No fallar el login si hay problemas con la base de datos
            }
          }
        }
      )

      return () => subscription.unsubscribe()
    }
  }, [configured])

  const signInWithGoogle = async () => {
    if (!configured) {
      alert('Supabase no está configurado. Por favor configura las variables de entorno.')
      return
    }

    try {
      setLoading(true)
      if (!supabase) return
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      alert('Error al iniciar sesión: ' + (error as Error).message)
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!configured || !supabase) return

    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
    isConfigured: configured,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
