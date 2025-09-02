import { NextRequest, NextResponse } from 'next/server'
import { getUserExpenses, createExpense, getExpenseSummary } from '@/lib/services'
import { prisma } from '@/lib/prisma'

// GET - Obtener gastos del usuario para un mes específico
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const month = searchParams.get('month') // formato: "2025-08"
    const type = searchParams.get('type') as 'INCOME' | 'EXPENSE' | undefined
    
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
      endDate = new Date(parseInt(year), parseInt(monthNum), 0)
      
      console.log('📅 API Expenses - Month filter:', {
        month,
        year: parseInt(year),
        monthNum: parseInt(monthNum),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
    }

    const expenses = await getUserExpenses(user.id, {
      type,
      start_date: startDate,
      end_date: endDate,
    })

    return NextResponse.json({
      success: true,
      expenses,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get expenses' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo gasto/ingreso
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, expenseData } = body

    console.log('🔍 API: Received expense data:', expenseData)
    console.log('🔍 API: Expense type:', expenseData.type)
    console.log('🔍 API: Type validation:', typeof expenseData.type, expenseData.type)

    if (!userId || !expenseData) {
      return NextResponse.json(
        { error: 'User ID and expense data are required' },
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

    console.log('🔍 API: User found:', user.id)
    console.log('🔍 API: About to call createExpense with:', { userId: user.id, data: expenseData })

    const expense = await createExpense(user.id, expenseData)
    
    console.log('🔍 API: Created expense result:', expense)
    console.log('🔍 API: Created expense type:', expense.type)

    return NextResponse.json({
      success: true,
      expense,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}
