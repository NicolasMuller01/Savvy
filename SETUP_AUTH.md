# 🔐 CONFIGURACIÓN DE SUPABASE Y GOOGLE OAUTH

## 📋 Pasos para completar la configuración:

### 1. Crear proyecto en Supabase
1. Ve a https://supabase.com
2. Crea una cuenta/inicia sesión
3. Crea un nuevo proyecto
4. Ve a Settings > API
5. Copia la URL del proyecto y la clave anon

### 2. Configurar Google OAuth
1. Ve a https://console.developers.google.com
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita Google+ API
4. Crea credenciales OAuth 2.0
5. Agrega estas URLs autorizadas:
   - http://localhost:3000 (desarrollo)
   - https://tu-dominio.com (producción)
6. Agrega estas URLs de callback:
   - http://localhost:3000/auth/callback
   - https://tu-dominio.com/auth/callback

### 3. Configurar en Supabase
1. En tu proyecto Supabase, ve a Authentication > Providers
2. Habilita Google
3. Agrega tu Client ID y Client Secret de Google
4. Configura las URLs de callback:
   - http://localhost:3000/auth/callback (desarrollo)
   - https://tu-dominio.com/auth/callback (producción)

### 4. Actualizar variables de entorno
Edita el archivo `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-aquí
```

### 5. Reiniciar el servidor
```bash
npm run dev
```

## ✅ Funcionalidades implementadas:

- ✅ Login con Google OAuth
- ✅ Protección de rutas con middleware
- ✅ Context de autenticación global
- ✅ Perfil de usuario automático
- ✅ Botón de logout en configuración
- ✅ Redirecciones automáticas
- ✅ Loading states
- ✅ Manejo de errores

## 🔄 Flujo de autenticación:

1. Usuario visita la app
2. Si no está autenticado → Redirige a /login
3. Usuario hace clic en "Continuar con Google"
4. Supabase redirige a Google OAuth
5. Google redirige a /auth/callback
6. Callback procesa la sesión
7. Usuario es redirigido a la app principal
8. Datos del usuario se cargan automáticamente

## 🚨 Notas importantes:

- Las variables de entorno son requeridas
- Google OAuth debe estar configurado correctamente
- Las URLs de callback deben coincidir exactamente
- El middleware protege todas las rutas automáticamente
