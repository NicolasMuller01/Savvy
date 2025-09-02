import { NextRequest, NextResponse } from 'next/server'
import PriceService from '@/lib/services/priceService'

const priceService = PriceService.getInstance()

// GET - Obtener símbolos disponibles o precio de símbolo específico
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'stock' o 'crypto'
    const query = searchParams.get('q') // Término de búsqueda
    const symbol = searchParams.get('symbol') // Símbolo específico para precio
    const exchange = searchParams.get('exchange') || 'US' // Exchange para acciones

    // Si se solicita precio de símbolo específico
    if (symbol) {
      const symbolType = searchParams.get('type') || 'stock'
      const priceResult = await priceService.getPrice(symbol, symbolType.toLowerCase() as 'stock' | 'crypto')
      
      if (!priceResult.success) {
        return NextResponse.json(
          { error: priceResult.error || 'Símbolo no encontrado' },
          { status: 404 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        price: priceResult.data 
      })
    }

    if (type === 'crypto') {
      if (query) {
        // Buscar criptomonedas específicas
        const results = await priceService.searchSymbols(query, 'crypto')
        return NextResponse.json({ symbols: results })
      } else {
        // Obtener lista de criptomonedas populares
        const cryptos = await priceService.getAvailableCryptos()
        const symbols = cryptos.map(crypto => ({
          symbol: crypto,
          displaySymbol: crypto,
          description: crypto,
          type: 'crypto'
        }))
        return NextResponse.json({ symbols })
      }
    } else if (type === 'stock') {
      if (query) {
        // Buscar acciones específicas
        const results = await priceService.searchSymbols(query, 'stock')
        return NextResponse.json({ symbols: results })
      } else {
        // Obtener lista de acciones por exchange
        const stocks = await priceService.getAvailableStocks(exchange)
        return NextResponse.json({ symbols: stocks.slice(0, 100) }) // Limitar a 100
      }
    } else {
      // Obtener ambos tipos
      const [cryptos, stocks] = await Promise.all([
        priceService.getAvailableCryptos(),
        priceService.getAvailableStocks(exchange)
      ])

      const allSymbols = [
        ...cryptos.map(crypto => ({
          symbol: crypto,
          displaySymbol: crypto,
          description: `${crypto} (Cryptocurrency)`,
          type: 'crypto'
        })),
        ...stocks.slice(0, 50).map(stock => ({
          symbol: stock.symbol,
          displaySymbol: stock.displaySymbol,
          description: stock.description,
          type: 'stock'
        }))
      ]

      return NextResponse.json({ symbols: allSymbols })
    }
  } catch (error) {
    console.error('Error fetching symbols:', error)
    return NextResponse.json(
      { error: 'Error obteniendo símbolos' },
      { status: 500 }
    )
  }
}

// POST - Obtener precio actual de un símbolo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbol, type } = body

    if (!symbol || !type) {
      return NextResponse.json(
        { error: 'Symbol y type son requeridos' },
        { status: 400 }
      )
    }

    if (!['stock', 'crypto'].includes(type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Tipo debe ser stock o crypto' },
        { status: 400 }
      )
    }

    const priceResult = await priceService.getPrice(symbol, type.toLowerCase() as 'stock' | 'crypto')

    if (!priceResult.success) {
      return NextResponse.json(
        { error: priceResult.error || 'Error obteniendo precio' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      price: priceResult.data 
    })
  } catch (error) {
    console.error('Error fetching price:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
