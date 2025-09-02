import { NextRequest, NextResponse } from 'next/server'
import { upsertUser, createDefaultCategories } from '@/lib/services'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { supabaseUser } = body

    if (!supabaseUser || !supabaseUser.id) {
      return NextResponse.json(
        { error: 'Supabase user data is required' },
        { status: 400 }
      )
    }

    // Crear o actualizar usuario en la base de datos
    const dbUser = await upsertUser(supabaseUser)

    // Si es un usuario nuevo (no tiene categorías), crear categorías por defecto
    let categoriesCreated = false
    if (dbUser.categories.length === 0) {
      await createDefaultCategories(dbUser.id)
      categoriesCreated = true
    }

    return NextResponse.json({
      success: true,
      user: dbUser,
      categoriesCreated,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process user data' },
      { status: 500 }
    )
  }
}
