import { Investment } from '@/types'

const API_BASE_URL = process.env.INVESTMENTS_API_URL || '/api/investments'

export class InvestmentService {
  // Obtener todas las inversiones del usuario
  static async getInvestments(userId: string): Promise<Investment[]> {
    try {
      const response = await fetch(`${API_BASE_URL}?userId=${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch investments')
      }
      const data = await response.json()
      
      // Mapear datos de la base de datos al formato del frontend
      return data.investments.map((investment: any) => ({
        id: investment.id,
        name: investment.name,
        symbol: investment.symbol,
        type: investment.type.toLowerCase(),
        platform: investment.platform || 'unknown',
        category: investment.category || '',
        quantity: parseFloat(investment.quantity.toString()),
        purchasePrice: parseFloat(investment.purchase_price.toString()),
        currentPrice: investment.current_price 
          ? parseFloat(investment.current_price.toString()) 
          : parseFloat(investment.purchase_price.toString()),
        purchaseDate: investment.purchase_date.split('T')[0],
        notes: investment.notes || '',
        lastUpdated: investment.updated_at
      }))
    } catch (error) {
      console.error('Error fetching investments:', error)
      throw error
    }
  }

  // Crear nueva inversión
  static async createInvestment(userId: string, investment: Omit<Investment, 'id' | 'lastUpdated'>): Promise<Investment> {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          name: investment.name,
          symbol: investment.symbol,
          type: investment.type.toUpperCase(),
          platform: investment.platform,
          category: investment.category,
          quantity: investment.quantity,
          purchasePrice: investment.purchasePrice,
          purchaseDate: investment.purchaseDate,
          notes: investment.notes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create investment')
      }

      const data = await response.json()
      
      // Mapear respuesta al formato del frontend
      return {
        id: data.investment.id,
        name: data.investment.name,
        symbol: data.investment.symbol,
        type: data.investment.type.toLowerCase(),
        platform: investment.platform || 'unknown',
        category: data.investment.category || '',
        quantity: parseFloat(data.investment.quantity.toString()),
        purchasePrice: parseFloat(data.investment.purchase_price.toString()),
        currentPrice: data.investment.current_price 
          ? parseFloat(data.investment.current_price.toString()) 
          : parseFloat(data.investment.purchase_price.toString()),
        change24h: 0, // Default value
        changePercent: 0, // Default value
        purchaseDate: data.investment.purchase_date.split('T')[0],
        notes: data.investment.notes || '',
        lastUpdated: data.investment.updated_at
      }
    } catch (error) {
      console.error('Error creating investment:', error)
      throw error
    }
  }

  // Actualizar inversión existente
  static async updateInvestment(id: string, userId: string, investment: Partial<Investment>): Promise<Investment> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          name: investment.name,
          symbol: investment.symbol,
          type: investment.type?.toUpperCase(),
          platform: investment.platform,
          category: investment.category,
          quantity: investment.quantity,
          purchasePrice: investment.purchasePrice,
          currentPrice: investment.currentPrice,
          purchaseDate: investment.purchaseDate,
          notes: investment.notes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update investment')
      }

      const data = await response.json()
      
      return {
        id: data.investment.id,
        name: data.investment.name,
        symbol: data.investment.symbol,
        type: data.investment.type.toLowerCase(),
        platform: data.investment.platform || 'unknown',
        category: data.investment.category || '',
        quantity: parseFloat(data.investment.quantity.toString()),
        purchasePrice: parseFloat(data.investment.purchase_price.toString()),
        currentPrice: data.investment.current_price 
          ? parseFloat(data.investment.current_price.toString()) 
          : parseFloat(data.investment.purchase_price.toString()),
        change24h: 0, // Default value
        changePercent: 0, // Default value
        purchaseDate: data.investment.purchase_date.split('T')[0],
        notes: data.investment.notes || '',
        lastUpdated: data.investment.updated_at
      }
    } catch (error) {
      console.error('Error updating investment:', error)
      throw error
    }
  }

  // Eliminar inversión (simplificado)
  static async deleteInvestment(id: string, userId: string): Promise<void> {
    try {
      console.log('Deleting investment:', { id, userId })
      const url = `${API_BASE_URL}/${id}?userId=${userId}`
      console.log('DELETE URL:', url)
      
      const response = await fetch(url, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Delete request failed:', errorData)
        throw new Error(errorData.error || 'Failed to delete investment')
      }
      
      console.log('Investment deleted successfully')
    } catch (error) {
      console.error('Error deleting investment:', error)
      throw error
    }
  }
}
