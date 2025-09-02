import { NextRequest, NextResponse } from 'next/server'
import PriceService from '@/lib/services/priceService'

const priceService = PriceService.getInstance()

// GET - Obtener perfil de empresa/crypto con logo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const type = searchParams.get('type') || 'stock'

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol es requerido' },
        { status: 400 }
      )
    }

    if (!['stock', 'crypto'].includes(type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Tipo debe ser stock o crypto' },
        { status: 400 }
      )
    }

    const profile = await priceService.getCompanyProfile(symbol, type.toLowerCase() as 'stock' | 'crypto')

    if (!profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      profile 
    })
  } catch (error) {
    console.error('Error fetching company profile:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
