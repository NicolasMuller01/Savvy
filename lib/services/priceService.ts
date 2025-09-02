// Servicio para obtener precios en tiempo real usando Finnhub.io

interface PriceData {
  symbol: string
  name: string
  price: number
  change24h: number
  changePercent: number
  lastUpdated: string
}

interface ApiResponse {
  success: boolean
  data?: PriceData
  error?: string
}

interface FinnhubQuote {
  c: number  // current price
  h: number  // high price of the day
  l: number  // low price of the day
  o: number  // open price of the day
  pc: number // previous close price
  t: number  // timestamp
}

interface FinnhubSymbol {
  description: string
  displaySymbol: string
  symbol: string
  type: string
}

interface CompanyProfile {
  logo: string
  name: string
  country: string
  currency: string
  exchange: string
  finnhubIndustry: string
}

// Lista de exchanges/plataformas populares
export const EXCHANGES = [
  { id: 'binance', name: 'Binance', type: 'crypto' },
  { id: 'coinbase', name: 'Coinbase', type: 'crypto' },
  { id: 'kraken', name: 'Kraken', type: 'crypto' },
  { id: 'cocos_capital', name: 'Cocos Capital', type: 'traditional' },
  { id: 'etoro', name: 'eToro', type: 'both' },
  { id: 'interactive_brokers', name: 'Interactive Brokers', type: 'traditional' },
  { id: 'td_ameritrade', name: 'TD Ameritrade', type: 'traditional' },
  { id: 'robinhood', name: 'Robinhood', type: 'both' },
  { id: 'fidelity', name: 'Fidelity', type: 'traditional' },
  { id: 'charles_schwab', name: 'Charles Schwab', type: 'traditional' },
  { id: 'bitso', name: 'Bitso', type: 'crypto' },
  { id: 'buda', name: 'Buda.com', type: 'crypto' },
  { id: 'other', name: 'Otro', type: 'both' },
]

class PriceService {
  private static instance: PriceService
  private cache: Map<string, { data: PriceData; timestamp: number }> = new Map()
  private symbolCache: Map<string, FinnhubSymbol[]> = new Map()
  private symbolCacheTimestamps: Map<string, number> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutos
  private readonly SYMBOL_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 horas
  private readonly FINNHUB_API_KEY = process.env.FINNHUB_API_KEY
  private readonly FINNHUB_BASE_URL = process.env.FINNHUB_BASE_URL

  static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService()
    }
    return PriceService.instance
  }

  // Obtener precio de acción usando Finnhub
  private async getStockPrice(symbol: string): Promise<ApiResponse> {
    try {
      const response = await fetch(
        `${this.FINNHUB_BASE_URL}/quote?symbol=${symbol.toUpperCase()}&token=${this.FINNHUB_API_KEY}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: FinnhubQuote = await response.json()

      if (!data.c || data.c === 0) {
        return { success: false, error: `No se encontraron datos para ${symbol}` }
      }

      const change = data.c - data.pc
      const changePercent = data.pc > 0 ? (change / data.pc) * 100 : 0

      return {
        success: true,
        data: {
          symbol: symbol.toUpperCase(),
          name: symbol.toUpperCase(),
          price: data.c,
          change24h: change,
          changePercent: changePercent,
          lastUpdated: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error(`Error obteniendo precio de ${symbol}:`, error)
      return { 
        success: false, 
        error: `Error obteniendo precio de ${symbol}: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      }
    }
  }

  // Obtener precio de criptomoneda usando Finnhub
  private async getCryptoPrice(symbol: string): Promise<ApiResponse> {
    try {
      // Mapeo de símbolos crypto comunes a formato Finnhub
      const cryptoMapping: Record<string, string> = {
        'BTC': 'BTCUSDT',
        'ETH': 'ETHUSDT',
        'ADA': 'ADAUSDT',
        'DOT': 'DOTUSDT',
        'XRP': 'XRPUSDT',
        'LTC': 'LTCUSDT',
        'BCH': 'BCHUSDT',
        'LINK': 'LINKUSDT',
        'BNB': 'BNBUSDT',
        'SOL': 'SOLUSDT',
        'MATIC': 'MATICUSDT',
        'AVAX': 'AVAXUSDT',
        'ATOM': 'ATOMUSDT',
        'UNI': 'UNIUSDT',
        'DOGE': 'DOGEUSDT'
      }
      
      // Obtener el símbolo correcto para Finnhub
      const normalizedSymbol = symbol.replace('/', '').toUpperCase()
      const finnhubSymbol = cryptoMapping[normalizedSymbol] || `${normalizedSymbol}USDT`
      const cryptoSymbol = `BINANCE:${finnhubSymbol}`
      
      console.log(`Buscando precio crypto: ${symbol} -> ${cryptoSymbol}`)
      
      const response = await fetch(
        `${this.FINNHUB_BASE_URL}/quote?symbol=${cryptoSymbol}&token=${this.FINNHUB_API_KEY}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: FinnhubQuote = await response.json()
      console.log(`Respuesta Finnhub para ${cryptoSymbol}:`, data)

      if (!data.c || data.c === 0) {
        return { success: false, error: `No se encontraron datos para ${symbol}` }
      }

      const change = data.c - data.pc
      const changePercent = data.pc > 0 ? (change / data.pc) * 100 : 0

      return {
        success: true,
        data: {
          symbol: symbol.toUpperCase(),
          name: symbol.toUpperCase(),
          price: data.c,
          change24h: change,
          changePercent: changePercent,
          lastUpdated: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error(`Error obteniendo precio de crypto ${symbol}:`, error)
      return { 
        success: false, 
        error: `Error obteniendo precio de ${symbol}: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      }
    }
  }

  // Obtener lista de acciones disponibles
  async getAvailableStocks(exchange: string = 'US'): Promise<FinnhubSymbol[]> {
    const cacheKey = `stocks_${exchange}`
    const cached = this.symbolCache.get(cacheKey)
    const cachedTimestamp = this.symbolCacheTimestamps.get(cacheKey)
    
    if (cached && cachedTimestamp && Date.now() - cachedTimestamp < this.SYMBOL_CACHE_DURATION) {
      return cached
    }

    try {
      const response = await fetch(
        `${this.FINNHUB_BASE_URL}/stock/symbol?exchange=${exchange}&token=${this.FINNHUB_API_KEY}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const symbols: FinnhubSymbol[] = await response.json()
      
      // Filtrar solo acciones principales (evitar warrants, etc.)
      const filteredSymbols = symbols.filter(symbol => 
        symbol.type === 'Common Stock' && 
        !symbol.symbol.includes('.') &&
        symbol.description && 
        symbol.description.length > 0
      ).slice(0, 1000) // Limitar a 1000 símbolos más populares

      this.symbolCache.set(cacheKey, filteredSymbols)
      this.symbolCacheTimestamps.set(cacheKey, Date.now())

      return filteredSymbols
    } catch (error) {
      console.error('Error obteniendo símbolos de acciones:', error)
      return []
    }
  }

  // Obtener lista de criptomonedas disponibles
  async getAvailableCryptos(): Promise<string[]> {
    // Lista curada de las criptomonedas más populares, organizada alfabéticamente
    return [
      'AAVE', 'ADA', 'ALGO', 'ATOM', 'AVAX', 'AXS', 'BAT', 'BCH', 'BNB', 'BTC',
      'BUSD', 'CAKE', 'CHZ', 'COMP', 'CRO', 'CRV', 'DOGE', 'DOT', 'EGLD', 'ENJ',
      'EOS', 'ETC', 'ETH', 'FIL', 'FTM', 'GRT', 'HBAR', 'ICP', 'KSM', 'LINK',
      'LTC', 'LUNA', 'MANA', 'MATIC', 'MKR', 'NEAR', 'OMG', 'ONE', 'SAND', 'SHIB',
      'SNX', 'SOL', 'SUSHI', 'TRX', 'UNI', 'USDC', 'USDT', 'VET', 'XLM', 'XMR',
      'XRP', 'XTZ', 'YFI', 'ZEC', 'ZIL'
    ]
  }

  // Buscar símbolos por nombre
  async searchSymbols(query: string, type: 'stock' | 'crypto' = 'stock'): Promise<FinnhubSymbol[]> {
    if (type === 'crypto') {
      try {
        // Primero intentar con lista local para búsquedas simples
        const localCryptos = await this.getAvailableCryptos()
        const localResults = localCryptos
          .filter(crypto => crypto.toLowerCase().includes(query.toLowerCase()))
          .map(crypto => ({
            symbol: crypto,
            displaySymbol: crypto,
            description: `${crypto} (Cryptocurrency)`,
            type: 'crypto'
          }))

        // Si hay resultados locales, devolverlos primero
        if (localResults.length > 0) {
          return localResults.slice(0, 10)
        }

        // Si no hay resultados locales, buscar en la API
        const response = await fetch(
          `${this.FINNHUB_BASE_URL}/crypto/symbol?exchange=BINANCE&token=${this.FINNHUB_API_KEY}`
        )

        if (!response.ok) {
          return localResults
        }

        const data = await response.json()
        return data
          .filter((crypto: any) => {
            const displaySymbol = crypto.displaySymbol || crypto.symbol
            
            // Solo pares con USDT, USD, o sin par (símbolos principales)
            if (displaySymbol.includes('/')) {
              const [base, quote] = displaySymbol.split('/')
              const validQuotes = ['USDT', 'USD', 'BUSD', 'FDUSD']
              return base.toLowerCase().includes(query.toLowerCase()) && 
                     validQuotes.includes(quote) &&
                     base.length <= 6
            }
            
            return false
          })
          .slice(0, 15)
          .map((crypto: any) => {
            const displaySymbol = crypto.displaySymbol || crypto.symbol
            const cleanSymbol = displaySymbol.includes('/') ? displaySymbol.split('/')[0] : displaySymbol
            
            return {
              symbol: cleanSymbol,
              displaySymbol: cleanSymbol,
              description: `${cleanSymbol} (Cryptocurrency)`,
              type: 'crypto'
            }
          })
      } catch (error) {
        console.error('Error buscando criptomonedas:', error)
        // Fallback a lista local
        const cryptos = await this.getAvailableCryptos()
        return cryptos
          .filter(crypto => crypto.toLowerCase().includes(query.toLowerCase()))
          .map(crypto => ({
            symbol: crypto,
            displaySymbol: crypto,
            description: `${crypto} (Cryptocurrency)`,
            type: 'crypto'
          }))
      }
    }

    try {
      const response = await fetch(
        `${this.FINNHUB_BASE_URL}/search?q=${encodeURIComponent(query)}&token=${this.FINNHUB_API_KEY}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.result || []
    } catch (error) {
      console.error('Error buscando símbolos:', error)
      return []
    }
  }

  // Método principal para obtener precio
  async getPrice(symbol: string, type: 'stock' | 'crypto'): Promise<ApiResponse> {
    const cacheKey = `${type}_${symbol.toUpperCase()}`
    
    // Verificar caché
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return { success: true, data: cached.data }
    }

    let result: ApiResponse
    if (type === 'crypto') {
      result = await this.getCryptoPrice(symbol)
    } else {
      result = await this.getStockPrice(symbol)
    }

    // Guardar en caché si fue exitoso
    if (result.success && result.data) {
      this.cache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now()
      })
    }

    return result
  }

  // Obtener múltiples precios
  async getPrices(symbols: Array<{symbol: string, type: 'stock' | 'crypto'}>): Promise<PriceData[]> {
    const promises = symbols.map(({symbol, type}) => this.getPrice(symbol, type))
    const results = await Promise.allSettled(promises)
    
    return results
      .map((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          return result.value.data!
        }
        console.warn(`Failed to get price for ${symbols[index].symbol}:`, 
          result.status === 'rejected' ? result.reason : result.value.error)
        return null
      })
      .filter((data): data is PriceData => data !== null)
  }

  // Limpiar caché
  clearCache(): void {
    this.cache.clear()
    this.symbolCache.clear()
  }

  // Obtener perfil de empresa/crypto con logo
  async getCompanyProfile(symbol: string, type: 'stock' | 'crypto'): Promise<CompanyProfile | null> {
    try {
      if (type === 'crypto') {
        // Para criptomonedas, usar un fallback con logos conocidos
        const logoBaseUrl = process.env.FINNHUB_LOGO_BASE_URL || 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo';
        const cryptoLogos: Record<string, string> = {
          'BTC': `${logoBaseUrl}/BTC.png`,
          'ETH': `${logoBaseUrl}/ETH.png`,
          'BNB': `${logoBaseUrl}/BNB.png`,
          'ADA': `${logoBaseUrl}/ADA.png`,
          'SOL': `${logoBaseUrl}/SOL.png`,
          'DOGE': `${logoBaseUrl}/DOGE.png`,
          'DOT': `${logoBaseUrl}/DOT.png`,
          'MATIC': `${logoBaseUrl}/MATIC.png`,
          'LTC': `${logoBaseUrl}/LTC.png`,
          'LINK': `${logoBaseUrl}/LINK.png`,
          'UNI': `${logoBaseUrl}/UNI.png`,
          'AVAX': `${logoBaseUrl}/AVAX.png`,
          'XRP': `${logoBaseUrl}/XRP.png`,
          'USDC': `${logoBaseUrl}/USDC.png`,
          'USDT': `${logoBaseUrl}/USDT.png`
        }

        const placeholderUrl = process.env.PLACEHOLDER_LOGO_URL || 'https://via.placeholder.com';
        return {
          logo: cryptoLogos[symbol.toUpperCase()] || `${placeholderUrl}/32/6366f1/ffffff?text=${symbol.charAt(0)}`,
          name: symbol.toUpperCase(),
          country: 'Global',
          currency: 'USD',
          exchange: 'Crypto',
          finnhubIndustry: 'Cryptocurrency'
        }
      }

      // Para acciones, usar la API de perfil
      const response = await fetch(
        `${this.FINNHUB_BASE_URL}/stock/profile2?symbol=${symbol.toUpperCase()}&token=${this.FINNHUB_API_KEY}`
      )

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      
      if (!data.logo) {
        return null
      }

      return {
        logo: data.logo,
        name: data.name || symbol.toUpperCase(),
        country: data.country || 'Unknown',
        currency: data.currency || 'USD',
        exchange: data.exchange || 'Unknown',
        finnhubIndustry: data.finnhubIndustry || 'Unknown'
      }
    } catch (error) {
      console.error(`Error obteniendo perfil de ${symbol}:`, error)
      return null
    }
  }
}

export default PriceService
export { type PriceData, type ApiResponse, type FinnhubSymbol }
