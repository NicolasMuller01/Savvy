import { NextRequest, NextResponse } from 'next/server'
import { getExpenseSummary } from '@/lib/services'
import { prisma } from '@/lib/prisma'

// GET - Obtener resumen de gastos/ingresos para un mes específico
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const month = searchParams.get('month') // formato: "2025-08"
    
    if (!userId || !month) {
      return NextResponse.json(
        { error: 'User ID and month are required' },
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

    const [year, monthNum] = month.split('-')
    const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0)

    console.log('📊 API Summary - Month filter:', {
      month,
      year: parseInt(year),
      monthNum: parseInt(monthNum),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    })

    const summary = await getExpenseSummary(user.id, startDate, endDate)

    return NextResponse.json({
      success: true,
      summary,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get expense summary' },
      { status: 500 }
    )
  }
}
