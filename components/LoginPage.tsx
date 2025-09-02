'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useState } from 'react'
import Logo from './ui/logo'

export default function LoginPage() {
  const { signInWithGoogle, loading, isConfigured } = useAuth()

  const handleGoogleSignIn = async () => {
    if (!isConfigured) {
      alert('Supabase no está configurado correctamente')
      return
    }
    try {
      await signInWithGoogle()
    } catch (error) {
      // Error handled by AuthContext
    }
  }

  const handleDemoLogin = () => {
    localStorage.setItem('demo_user', 'true')
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div 
            className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{
              background: 'linear-gradient(to right, var(--primary), var(--primary-dark))',
              boxShadow: `0 10px 25px var(--primary-glow)`
            }}
          >
            <Logo />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Savvy</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Gestiona tus finanzas personales de manera inteligente
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
              Iniciar Sesión
            </CardTitle>
            <p className="text-center text-gray-500 dark:text-gray-400">
              Accede a tu cuenta para continuar
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6 pb-8">
            {/* Google OAuth Button */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading || !isConfigured}
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 text-base font-medium"
              variant="outline"
            >
              <div className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>
                  {loading ? 'Conectando...' : 'Continuar con Google'}
                </span>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ¿Primera vez aquí? No te preocupes, es súper fácil empezar
          </p>
          <div className="flex justify-center gap-4 text-xs text-gray-400 dark:text-gray-500">
            <span>Seguro</span>
            <span>•</span>
            <span>Privado</span>
            <span>•</span>
            <span>Gratuito</span>
          </div>
        </div>
      </div>
    </div>
  )
}
