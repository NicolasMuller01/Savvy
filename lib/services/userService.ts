import { prisma } from '@/lib/prisma'
import { User } from '@supabase/supabase-js'
import { createDefaultCategories } from './categoryService'

export interface CreateUserData {
  email: string
  name?: string
  phone?: string
  avatar_url?: string
  currency?: string
  language?: string
  supabase_id: string
}

export interface UpdateUserData {
  name?: string
  phone?: string
  avatar_url?: string
  currency?: string
  language?: string
}

// Crear o actualizar usuario cuando se registra/logea con Google
export async function upsertUser(supabaseUser: User) {
  try {
    const userData: CreateUserData = {
      email: supabaseUser.email!,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
      phone: supabaseUser.user_metadata?.phone,
      avatar_url: supabaseUser.user_metadata?.avatar_url,
      supabase_id: supabaseUser.id,
    }

    const user = await prisma.user.upsert({
      where: { supabase_id: supabaseUser.id },
      update: {
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        avatar_url: userData.avatar_url,
        updated_at: new Date(),
      },
      create: userData,
      include: {
        settings: true,
        categories: true,
      },
    })

    // Crear configuraciones por defecto si no existen
    if (!user.settings) {
      await prisma.userSettings.create({
        data: {
          user_id: user.id,
        },
      })
    }

    return user
  } catch (error) {
    throw error
  }
}

// Obtener usuario por ID de Supabase
export async function getUserBySupabaseId(supabaseId: string) {
  try {
    return await prisma.user.findUnique({
      where: { supabase_id: supabaseId },
      include: {
        settings: true,
        categories: true,
      },
    })
  } catch (error) {
    throw error
  }
}

// Actualizar datos del usuario
export async function updateUser(userId: string, data: UpdateUserData) {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updated_at: new Date(),
      },
    })
  } catch (error) {
    throw error
  }
}

// Actualizar configuraciones del usuario
export async function updateUserSettings(userId: string, settings: any) {
  try {
    return await prisma.userSettings.upsert({
      where: { user_id: userId },
      update: {
        ...settings,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        ...settings,
      },
    })
  } catch (error) {
    throw error
  }
}

// Eliminar todos los datos del usuario (GDPR compliance)
export async function deleteUserData(userId: string) {
  try {
    await prisma.user.delete({
      where: { id: userId },
    })
  } catch (error) {
    throw error
  }
}
