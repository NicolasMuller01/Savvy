import { NextRequest, NextResponse } from 'next/server'
import { getUserBudgets, createBudget } from '@/lib/services'
import { prisma } from '@/lib/prisma'

// GET - Obtener presupuestos del usuario para un mes específico
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const month = searchParams.get('month') // formato: "2025-08"
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Buscar el usuario en la base de datos usando el supabase_id
    const user = await prisma.user.findUnique({
      where: { supabase_id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let startDate: Date | undefined
    let endDate: Date | undefined

    if (month) {
      const [year, monthNum] = month.split('-')
      startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
      endDate = new Date(parseInt(year), parseInt(monthNum), 0) // último día del mes
    }

    const budgets = await getUserBudgets(user.id, {
      start_date: startDate,
      end_date: endDate,
    })

    return NextResponse.json({
      success: true,
      budgets,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get budgets' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo presupuesto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, budgetData } = body

    if (!userId || !budgetData) {
      return NextResponse.json(
        { error: 'User ID and budget data are required' },
        { status: 400 }
      )
    }

    // Buscar el usuario en la base de datos usando el supabase_id
    const user = await prisma.user.findUnique({
      where: { supabase_id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const budget = await createBudget(user.id, budgetData)

    return NextResponse.json({
      success: true,
      budget,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    )
  }
}
