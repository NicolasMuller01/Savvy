import { NextRequest, NextResponse } from 'next/server'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import PriceService from '@/lib/services/priceService'

const priceService = PriceService.getInstance()

// GET - Obtener inversiones del usuario
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Buscar usuario por supabase_id
    const dbUser = await prisma.user.findUnique({
      where: { supabase_id: userId }
    })

    if (!dbUser) {
      // Crear usuario si no existe
      try {
        const newUser = await prisma.user.create({
          data: {
            supabase_id: userId,
            email: `user_${userId}@temp.com`,
            name: `User ${userId.slice(0, 8)}`,
          }
        })
        
        return NextResponse.json({ investments: [] })
      } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json(
          { error: 'Error creando usuario' },
          { status: 500 }
        )
      }
    }

    const investments = await prisma.investment.findMany({
      where: {
        user_id: dbUser.id,
        is_active: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json({ investments })
  } catch (error) {
    console.error('Error fetching investments:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva inversión
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      name, 
      symbol, 
      type, 
      quantity, 
      purchasePrice, 
      purchaseDate, 
      notes,
      platform,
      category 
    } = body

    if (!userId || !name || !symbol || !type || !quantity || !purchasePrice) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Buscar o crear usuario
    let dbUser = await prisma.user.findUnique({
      where: { supabase_id: userId }
    })

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          supabase_id: userId,
          email: `user_${userId}@temp.com`,
          name: `User ${userId.slice(0, 8)}`,
        }
      })
    }

    // Obtener precio actual de Finnhub
    let currentPrice = new Decimal(purchasePrice)
    try {
      const priceResult = await priceService.getPrice(
        symbol, 
        type.toLowerCase() as 'stock' | 'crypto'
      )
      
      if (priceResult.success && priceResult.data) {
        currentPrice = new Decimal(priceResult.data.price)
      }
    } catch (error) {
      console.warn(`Could not fetch current price for ${symbol}`)
    }

    // Calcular valores
    const quantityDecimal = new Decimal(quantity)
    const purchasePriceDecimal = new Decimal(purchasePrice)
    const totalInvested = quantityDecimal.mul(purchasePriceDecimal)
    const currentValue = quantityDecimal.mul(currentPrice)
    const profitLoss = currentValue.sub(totalInvested)
    const profitLossPercentage = totalInvested.gt(0) 
      ? profitLoss.div(totalInvested).mul(100) 
      : new Decimal(0)

    // Limitar porcentaje para evitar overflow
    const clampedPercentage = profitLossPercentage.gt(999) 
      ? new Decimal(999) 
      : profitLossPercentage.lt(-999) 
      ? new Decimal(-999) 
      : profitLossPercentage

    const investment = await prisma.investment.create({
      data: {
        user_id: dbUser.id,
        name,
        symbol: symbol.toUpperCase(),
        type: type.toUpperCase(),
        platform: platform || 'other',
        category: category || null,
        quantity: quantityDecimal,
        purchase_price: purchasePriceDecimal,
        current_price: currentPrice,
        purchase_date: new Date(purchaseDate),
        total_invested: totalInvested,
        current_value: currentValue,
        profit_loss: profitLoss,
        profit_loss_percentage: clampedPercentage,
        notes: notes || null,
      }
    })

    return NextResponse.json({ 
      success: true, 
      investment 
    })
  } catch (error) {
    console.error('Error creating investment:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar inversión
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'ID y userId son requeridos' },
        { status: 400 }
      )
    }

    // Buscar usuario
    const dbUser = await prisma.user.findUnique({
      where: { supabase_id: userId }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que la inversión existe y pertenece al usuario
    const existingInvestment = await prisma.investment.findFirst({
      where: {
        id: id,
        user_id: dbUser.id,
        is_active: true
      }
    })

    if (!existingInvestment) {
      return NextResponse.json(
        { error: 'Inversión no encontrada' },
        { status: 404 }
      )
    }

    // Soft delete
    await prisma.investment.update({
      where: { id: id },
      data: { is_active: false }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Inversión eliminada correctamente' 
    })
  } catch (error) {
    console.error('Error deleting investment:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
