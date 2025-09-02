import { createClient } from '@supabase/supabase-js'

// Verificar si las variables de entorno están configuradas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Crear cliente solo si las variables están configuradas
export const supabase = (supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'your-supabase-url-here' && 
  supabaseAnonKey !== 'your-supabase-anon-key-here') 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    })
  : null

// Helper functions for auth
export const signInWithGoogle = async () => {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Por favor configura las variables de entorno.')
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

export const signOut = async () => {
  if (!supabase) {
    throw new Error('Supabase no está configurado.')
  }
  
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  if (!supabase) {
    return { user: null, error: new Error('Supabase no está configurado.') }
  }
  
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Verificar si Supabase está configurado
export const isSupabaseConfigured = () => {
  return supabase !== null
}
