import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateExpense, deleteExpense } from '@/lib/services/expenseService'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH - Actualizar un gasto/ingreso específico
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, expenseData } = body

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

    // Verificar que el gasto pertenece al usuario
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: id,
        user_id: user.id
      }
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found or unauthorized' },
        { status: 404 }
      )
    }

    // Validar que el amount no exceda el límite de la base de datos (Decimal(10,2))
    if (expenseData.amount && expenseData.amount >= 100000000) {
      return NextResponse.json(
        { error: 'El monto no puede exceder $99,999,999.99' },
        { status: 400 }
      )
    }

    // Actualizar el gasto usando el servicio
    const updatedExpense = await updateExpense(id, user.id, {
      amount: expenseData.amount,
      title: expenseData.title,
      category: expenseData.category,
      type: expenseData.type,
      date: new Date(expenseData.date),
    })

    return NextResponse.json({
      success: true,
      expense: updatedExpense,
    })
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un gasto/ingreso específico
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

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

    // Verificar que el gasto pertenece al usuario
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: id,
        user_id: user.id
      }
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found or unauthorized' },
        { status: 404 }
      )
    }

    // Eliminar el gasto
    await prisma.expense.delete({
      where: { id: id }
    })

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    )
  }
}
