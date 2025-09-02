import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

// PUT - Actualizar inversión
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const body = await request.json()
    const { 
      name, 
      symbol, 
      type, 
      platform,
      quantity, 
      purchasePrice, 
      currentPrice, 
      purchaseDate, 
      notes,
      userId
    } = body

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Buscar usuario por supabase_id (igual que en GET y DELETE)
    const dbUser = await prisma.user.findUnique({
      where: { supabase_id: userId }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Verificar que la inversión pertenece al usuario usando el ID interno
    const existingInvestment = await prisma.investment.findFirst({
      where: {
        id: params.id,
        user_id: dbUser.id,
        is_active: true
      }
    })

    if (!existingInvestment) {
      return NextResponse.json(
        { error: "Investment not found" },
        { status: 404 }
      )
    }

    // Validaciones
    if (quantity <= 0 || purchasePrice <= 0) {
      return NextResponse.json(
        { error: "Quantity and purchase price must be greater than 0" },
        { status: 400 }
      )
    }

    if (quantity >= 1000000000 || purchasePrice >= 1000000000) {
      return NextResponse.json(
        { error: "Values cannot exceed 999,999,999.99" },
        { status: 400 }
      )
    }

    const totalInvested = quantity * purchasePrice
    const currentValue = currentPrice ? quantity * currentPrice : null
    const profitLoss = currentValue ? currentValue - totalInvested : null
    const profitLossPercentage = profitLoss && totalInvested > 0 
      ? (profitLoss / totalInvested) * 100 
      : null

    const investment = await prisma.investment.update({
      where: { id: params.id },
      data: {
        name,
        symbol: symbol?.toUpperCase(),
        type: type.toUpperCase(),
        quantity: parseFloat(quantity.toString()),
        purchase_price: parseFloat(purchasePrice.toString()),
        current_price: currentPrice ? parseFloat(currentPrice.toString()) : null,
        purchase_date: new Date(purchaseDate),
        total_invested: totalInvested,
        current_value: currentValue,
        profit_loss: profitLoss,
        profit_loss_percentage: profitLossPercentage,
        notes
      }
    })

    return NextResponse.json({ investment })

  } catch (error) {
    console.error('Error updating investment:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar inversión
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    console.log('DELETE request:', { id, userId })

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Buscar usuario por supabase_id (igual que en GET)
    const dbUser = await prisma.user.findUnique({
      where: { supabase_id: userId }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Verificar que la inversión pertenece al usuario usando el ID interno
    const existingInvestment = await prisma.investment.findFirst({
      where: {
        id: id,
        user_id: dbUser.id,
        is_active: true
      }
    })

    console.log('Found investment:', existingInvestment)

    if (!existingInvestment) {
      return NextResponse.json(
        { error: "Investment not found" },
        { status: 404 }
      )
    }

    // Soft delete - marcar como inactivo
    const result = await prisma.investment.update({
      where: { id: id },
      data: { is_active: false }
    })

    console.log('Delete successful:', result)

    return NextResponse.json({ message: "Investment deleted successfully" })

  } catch (error) {
    console.error('Error deleting investment:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
