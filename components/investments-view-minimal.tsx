"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, RefreshCw, TrendingUp, TrendingDown, Edit, DollarSign } from "lucide-react"
import { EXCHANGES } from "@/lib/services/priceService"
import { InvestmentService } from "@/lib/services/investmentService"
import { Investment } from "@/types"
import { useAuth } from "@/contexts/AuthContext"
import { PieChart, Cell, ResponsiveContainer, Pie, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'

// API URLs from environment variables
const COMPANY_PROFILE_API = process.env.NEXT_PUBLIC_API_BASE_URL ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/company-profile` : '/api/company-profile';
const SYMBOLS_API = process.env.NEXT_PUBLIC_API_BASE_URL ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/symbols` : '/api/symbols';

interface InvestmentsViewProps {
  investments: Investment[]
  setInvestments: (investments: Investment[]) => void
}

const formatCurrency = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '$0.00'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Función para obtener color según el tipo de activo usando el tema del sistema
const getAssetTypeColor = (type: string) => {
  // Todos los tipos usan el color primario del tema seleccionado por el usuario
  return 'bg-primary'
}

// Función para obtener color de fondo suave según el tipo de activo
const getAssetTypeBgColor = (type: string) => {
  // Todos los tipos usan el color primario del tema con opacidad baja
  return 'bg-primary/10 border-primary/20'
}

// Función para obtener colores de hover según el tipo de activo
const getAssetTypeHoverColor = (type: string) => {
  // Todos los tipos usan el hover del tema del sistema
  return 'hover:bg-primary/10 hover:border-primary/30'
}

// Función para obtener clase del botón de tipo de activo
const getAssetTypeButtonClass = (type: string, isActive: boolean) => {
  if (isActive) {
    return 'bg-primary text-primary-foreground border-primary shadow-lg'
  }
  return 'hover:border-primary/30 hover:bg-primary/10'
}

// Función para obtener clase del icono del tipo de activo
const getAssetTypeIconClass = (type: string, isActive: boolean) => {
  if (isActive) {
    return 'bg-primary-foreground text-primary'
  }
  return 'bg-primary text-primary-foreground'
}

// Función para obtener color de texto según el tipo de activo
const getAssetTypeTextColor = (type: string) => {
  // Todos los tipos usan el color primario del tema del sistema
  return 'text-primary'
}

// Función para obtener colores del botón de editar según el tipo de activo
const getAssetTypeEditButtonClass = (type: string) => {
  // Todos los tipos usan el color primario del tema del sistema
  return 'text-primary hover:text-primary/80 border-primary/20 hover:border-primary/30'
}

// Función para obtener icono del activo
const getAssetIcon = (symbol: string, type: string, symbolLogos: Record<string, string>) => {
  const logoUrl = symbolLogos[symbol]
  
  if (logoUrl) {
    return (
      <div className="w-8 h-8 rounded-full overflow-hidden">
        <img 
          src={logoUrl} 
          alt={symbol}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Si falla cargar el logo, mostrar icono de respaldo
            e.currentTarget.style.display = 'none'
            e.currentTarget.nextElementSibling?.removeAttribute('style')
          }}
        />
        <div 
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAssetTypeColor(type)}`}
          style={{ display: 'none' }}
        >
          {symbol.slice(0, 2)}
        </div>
      </div>
    )
  } else {
    // Icono de respaldo si no hay logo
    const iconSymbols = {
      crypto: '₿',
      stock: '📈',
      etf: '📊',
      vehiculo: '🚗',
      propiedad: '🏠',
      other: '💼'
    }
    
    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAssetTypeColor(type)}`}>
        {iconSymbols[type.toLowerCase() as keyof typeof iconSymbols] || symbol.slice(0, 2)}
      </div>
    )
  }
}

// Función para obtener texto de búsqueda según tipo de activo
const getSearchText = (type: string) => {
  switch (type.toUpperCase()) {
    case 'STOCK': return 'acciones'
    case 'CRYPTO': return 'criptomonedas'
    case 'ETF': return 'ETFs'
    case 'VEHICULO': return 'vehículos'
    case 'PROPIEDAD': return 'propiedades'
    case 'OTHER': return 'otros activos'
    default: return 'activos'
  }
}

// Función para obtener ejemplo de búsqueda según tipo
const getSearchExample = (type: string) => {
  switch (type.toUpperCase()) {
    case 'STOCK': return 'AAPL, TSLA'
    case 'CRYPTO': return 'BTC, ETH'
    case 'ETF': return 'SPY, QQQ'
    case 'VEHICULO': return 'Toyota, BMW'
    case 'PROPIEDAD': return 'Casa, Depto'
    case 'OTHER': return 'Oro, Arte'
    default: return 'AAPL, BTC'
  }
}


const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6']

// Función para resetear el formulario
const resetForm = () => ({
  name: "",
  symbol: "",
  type: "STOCK" as "STOCK" | "CRYPTO" | "ETF" | "VEHICULO" | "PROPIEDAD" | "OTHER",
  quantity: "1",
  purchasePrice: "",
  currentPrice: ""
})

export function InvestmentsView({ investments, setInvestments }: InvestmentsViewProps) {
  const { user } = useAuth()
  const [showAddInvestment, setShowAddInvestment] = useState(false)
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Formulario simplificado
  const [newInvestment, setNewInvestment] = useState(resetForm())

  // Búsqueda de símbolos
  const [symbolSearch, setSymbolSearch] = useState("")
  const [availableSymbols, setAvailableSymbols] = useState<any[]>([])
  const [searchingSymbols, setSearchingSymbols] = useState(false)
  const [isCustomSymbol, setIsCustomSymbol] = useState(false)
  const [symbolLogos, setSymbolLogos] = useState<Record<string, string>>({})

  // Estados para modales de confirmación
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [investmentToDelete, setInvestmentToDelete] = useState<Investment | null>(null)

  // Cargar logo del símbolo
  const loadSymbolLogo = async (symbol: string, type: string) => {
    console.log('Loading logo for:', symbol, type)
    try {
      const response = await fetch(`${COMPANY_PROFILE_API}?symbol=${symbol}&type=${type}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Logo response for', symbol, ':', data)
        if (data.success && data.profile.logo) {
          setSymbolLogos(prev => ({
            ...prev,
            [symbol]: data.profile.logo
          }))
          console.log('Logo loaded for', symbol, ':', data.profile.logo)
        }
      } else {
        console.log('Logo request failed for', symbol, ':', response.status)
      }
    } catch (error) {
      console.error('Error loading logo for', symbol, ':', error)
    }
  }

  // Buscar símbolos en la API
  const searchSymbols = async (query: string) => {
    if (query.length < 1) {
      setAvailableSymbols([])
      return
    }

    setSearchingSymbols(true)
    try {
      const response = await fetch(`${SYMBOLS_API}?q=${encodeURIComponent(query)}&type=${newInvestment.type.toLowerCase()}`)
      
      if (response.ok) {
        const data = await response.json()
        setAvailableSymbols(data.symbols || [])
      }
    } catch (error) {
      console.error('Error searching symbols:', error)
    } finally {
      setSearchingSymbols(false)
    }
  }

  // Cargar opciones populares al hacer clic en el input
  const loadPopularSymbols = async () => {
    if (availableSymbols.length > 0) return // Ya hay símbolos cargados
    
    setSearchingSymbols(true)
    try {
      // Cargar símbolos populares basados en el tipo
      const popularQuery = newInvestment.type === 'CRYPTO' ? 'B' : 
                       newInvestment.type === 'STOCK' ? 'A' : 
                       newInvestment.type === 'ETF' ? 'S' : '' // Empezar con letras comunes para cada tipo
      
      const response = await fetch(`${SYMBOLS_API}?q=${popularQuery}&type=${newInvestment.type.toLowerCase()}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableSymbols(data.symbols?.slice(0, 25) || []) // Mostrar top 25
      }
    } catch (error) {
      console.error('Error loading popular symbols:', error)
    } finally {
      setSearchingSymbols(false)
    }
  }

  // Seleccionar símbolo de la API o permitir personalizado
  const selectSymbol = async (selectedSymbol: any) => {
    // Obtener precio actual del símbolo primero
    let currentPrice = ""
    try {
      const response = await fetch(`${SYMBOLS_API}?symbol=${selectedSymbol.symbol}&type=${selectedSymbol.type || newInvestment.type.toLowerCase()}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Price data received:', data)
        if (data.success && data.price && data.price.price) {
          currentPrice = data.price.price.toString()
        }
      }
    } catch (error) {
      console.error('Error getting current price:', error)
    }
    
    setNewInvestment({
      ...newInvestment,
      name: selectedSymbol.description || selectedSymbol.symbol,
      symbol: selectedSymbol.symbol,
      currentPrice,
      purchasePrice: currentPrice // Usar precio actual como costo total por defecto (cantidad 1)
    })
    
    // Cargar logo
    await loadSymbolLogo(selectedSymbol.symbol, selectedSymbol.type || newInvestment.type.toLowerCase())
    
    setSymbolSearch("")
    setAvailableSymbols([])
    setIsCustomSymbol(false)
  }

  useEffect(() => {
    const loadInvestments = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const fetchedInvestments = await InvestmentService.getInvestments(user.id)
        setInvestments(fetchedInvestments)
        
        // Cargar logos para las inversiones existentes
        for (const investment of fetchedInvestments) {
          await loadSymbolLogo(investment.symbol, investment.type)
        }
        
        setError(null)
      } catch (error) {
        setError('Error al cargar inversiones')
      } finally {
        setLoading(false)
      }
    }

    loadInvestments()
  }, [user?.id, setInvestments])

  // Agregar inversión simplificado
  const addInvestment = async () => {
    if (!user?.id) return
    
    // Validación básica
    if (!newInvestment.quantity || !newInvestment.purchasePrice) {
      setError('Cantidad y precio de compra son requeridos')
      return
    }

    // Para símbolos personalizados, validar campos adicionales
    if (isCustomSymbol) {
      if (!newInvestment.name || !newInvestment.symbol || !newInvestment.currentPrice) {
        setError('Para símbolos personalizados, nombre, símbolo y precio actual son requeridos')
        return
      }
    } else {
      if (!newInvestment.name || !newInvestment.symbol) {
        setError('Selecciona un símbolo de la lista o marca como personalizado')
        return
      }
    }

    try {
      const quantity = parseFloat(newInvestment.quantity)
      const totalCost = parseFloat(newInvestment.purchasePrice)
      const unitPurchasePrice = quantity > 0 ? totalCost / quantity : totalCost
      
      const investmentData = {
        name: newInvestment.name,
        symbol: newInvestment.symbol,
        type: newInvestment.type.toLowerCase() as "stock" | "crypto" | "etf" | "vehiculo" | "propiedad" | "other",
        platform: 'other',
        quantity: quantity,
        purchasePrice: unitPurchasePrice, // Precio unitario calculado
        currentPrice: parseFloat(newInvestment.currentPrice || (unitPurchasePrice.toString())),
        change24h: 0,
        changePercent: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: ''
      }

      const createdInvestment = await InvestmentService.createInvestment(user.id, investmentData)
      setInvestments([...investments, createdInvestment])
      
      // Reset form
      setNewInvestment(resetForm())
      setShowAddInvestment(false)
      setIsCustomSymbol(false)
      setSymbolSearch("")
      setAvailableSymbols([])
      setError(null)
    } catch (error) {
      setError('Error al agregar inversión')
    }
  }

  // Eliminar inversión
  const deleteInvestment = async () => {
    if (!user?.id || !investmentToDelete) return
    
    try {
      await InvestmentService.deleteInvestment(investmentToDelete.id, user.id)
      setInvestments(investments.filter(inv => inv.id !== investmentToDelete.id))
      setError(null)
      setShowDeleteModal(false)
      setInvestmentToDelete(null)
    } catch (error) {
      console.error('Error deleting investment:', error)
      setError('Error al eliminar inversión: ' + (error as Error).message)
      setShowDeleteModal(false)
      setInvestmentToDelete(null)
    }
  }

  // Abrir modal de confirmación para eliminar
  const confirmDelete = (investment: Investment) => {
    setInvestmentToDelete(investment)
    setShowDeleteModal(true)
  }

  // Iniciar edición
  const startEdit = (investment: Investment) => {
    setEditingInvestment(investment)
    // Convertir precio unitario de vuelta a costo total para la interfaz
    const totalCost = investment.quantity * investment.purchasePrice
    setNewInvestment({
      name: investment.name,
      symbol: investment.symbol,
      type: investment.type.toUpperCase() as "STOCK" | "CRYPTO" | "ETF" | "VEHICULO" | "PROPIEDAD" | "OTHER",
      quantity: investment.quantity.toString(),
      purchasePrice: totalCost.toString(), // Mostrar costo total en la interfaz
      currentPrice: investment.currentPrice.toString()
    })
    setIsCustomSymbol(true) // Siempre editar como personalizado
    setShowAddInvestment(true)
  }

  // Actualizar inversión
  const updateInvestment = async () => {
    if (!user?.id || !editingInvestment) return

    try {
      const quantity = parseFloat(newInvestment.quantity)
      const totalCost = parseFloat(newInvestment.purchasePrice)
      const unitPurchasePrice = quantity > 0 ? totalCost / quantity : totalCost
      
      const investmentData = {
        name: newInvestment.name,
        symbol: newInvestment.symbol,
        type: newInvestment.type.toLowerCase() as 'crypto' | 'stock' | 'etf' | 'vehiculo' | 'propiedad' | 'other',
        quantity: quantity,
        purchasePrice: unitPurchasePrice, // Precio unitario calculado
        currentPrice: parseFloat(newInvestment.currentPrice || (unitPurchasePrice.toString())),
        change24h: 0,
        changePercent: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: ''
      }
      
      await InvestmentService.updateInvestment(editingInvestment.id, user.id, investmentData)
      
      // Recargar inversiones para obtener datos actualizados
      const fetchedInvestments = await InvestmentService.getInvestments(user.id)
      setInvestments(fetchedInvestments)

      // Reset form
      setNewInvestment(resetForm())
      setShowAddInvestment(false)
      setEditingInvestment(null)
      setIsCustomSymbol(false)
      setError(null)
    } catch (error) {
      setError('Error al actualizar inversión')
    }
  }

  // Calcular totales
  const totalInvestment = investments.reduce((sum, inv) => sum + (inv.quantity * inv.purchasePrice), 0)
  const currentValue = investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0)
  const totalGainLoss = currentValue - totalInvestment
  const totalGainLossPercentage = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0

  // Datos para gráfico de líneas (rendimiento en el tiempo)
  const chartData = (() => {
    if (investments.length === 0) return []
    
    return investments.map((inv, index) => {
      const gainLoss = (inv.quantity * inv.currentPrice) - (inv.quantity * inv.purchasePrice)
      const gainLossPercentage = inv.purchasePrice > 0 ? (gainLoss / (inv.quantity * inv.purchasePrice)) * 100 : 0
      
      return {
        name: inv.symbol,
        rendimiento: gainLossPercentage,
        valor: inv.quantity * inv.currentPrice,
        color: COLORS[index % COLORS.length]
      }
    }).sort((a, b) => b.rendimiento - a.rendimiento) // Ordenar por rendimiento
  })()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 text-sm">Cargando inversiones...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>
  }

  console.log({newInvestment});

  return (
    <div className="space-y-6">
      {/* Header con totales y gráfico */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Inversiones</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setInvestments([])}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Dialog open={showAddInvestment} onOpenChange={setShowAddInvestment}>
              <DialogTrigger asChild>
                <Button size="sm" className={`text-white hover:opacity-90 ${getAssetTypeColor(newInvestment.type)}`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Activo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingInvestment ? 'Editar Inversión' : 'Nueva Inversión'}</DialogTitle>
                </DialogHeader>
                
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {error}
                  </div>
                )}
                
                <div className="space-y-4">
                  {/* Tipo de Activo - PRIMERO */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Tipo de Activo</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={newInvestment.type === "CRYPTO" ? "default" : "outline"}
                        onClick={() => {
                          setNewInvestment({...newInvestment, type: "CRYPTO", name: "", symbol: "", currentPrice: ""})
                          setSymbolSearch("")
                          setAvailableSymbols([])
                          setIsCustomSymbol(false)
                        }}
                        className={`flex flex-col items-center gap-1 h-16 transition-all ${getAssetTypeButtonClass("CRYPTO", newInvestment.type === "CRYPTO")}`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getAssetTypeIconClass("CRYPTO", newInvestment.type === "CRYPTO")}`}>₿</div>
                        <span className="text-xs font-medium">Crypto</span>
                      </Button>
                      <Button
                        type="button"
                        variant={newInvestment.type === "STOCK" ? "default" : "outline"}
                        onClick={() => {
                          setNewInvestment({...newInvestment, type: "STOCK", name: "", symbol: "", currentPrice: ""})
                          setSymbolSearch("")
                          setAvailableSymbols([])
                          setIsCustomSymbol(false)
                        }}
                        className={`flex flex-col items-center gap-1 h-16 transition-all ${getAssetTypeButtonClass("STOCK", newInvestment.type === "STOCK")}`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getAssetTypeIconClass("STOCK", newInvestment.type === "STOCK")}`}>📈</div>
                        <span className="text-xs font-medium">Acciones</span>
                      </Button>
                      <Button
                        type="button"
                        variant={newInvestment.type === "ETF" ? "default" : "outline"}
                        onClick={() => {
                          setNewInvestment({...newInvestment, type: "ETF", name: "", symbol: "", currentPrice: ""})
                          setSymbolSearch("")
                          setAvailableSymbols([])
                          setIsCustomSymbol(false)
                        }}
                        className={`flex flex-col items-center gap-1 h-16 transition-all ${getAssetTypeButtonClass("ETF", newInvestment.type === "ETF")}`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getAssetTypeIconClass("ETF", newInvestment.type === "ETF")}`}>📊</div>
                        <span className="text-xs font-medium">ETF</span>
                      </Button>
                      <Button
                        type="button"
                        variant={newInvestment.type === "VEHICULO" ? "default" : "outline"}
                        onClick={() => {
                          setNewInvestment({...newInvestment, type: "VEHICULO", name: "", symbol: "", currentPrice: "1"})
                          setSymbolSearch("")
                          setAvailableSymbols([])
                          setIsCustomSymbol(false)
                        }}
                        className={`flex flex-col items-center gap-1 h-16 transition-all ${getAssetTypeButtonClass("VEHICULO", newInvestment.type === "VEHICULO")}`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getAssetTypeIconClass("VEHICULO", newInvestment.type === "VEHICULO")}`}>🚗</div>
                        <span className="text-xs font-medium">Vehículo</span>
                      </Button>
                      <Button
                        type="button"
                        variant={newInvestment.type === "PROPIEDAD" ? "default" : "outline"}
                        onClick={() => {
                          setNewInvestment({...newInvestment, type: "PROPIEDAD", name: "", symbol: "", currentPrice: "1"})
                          setSymbolSearch("")
                          setAvailableSymbols([])
                          setIsCustomSymbol(false)
                        }}
                        className={`flex flex-col items-center gap-1 h-16 transition-all ${getAssetTypeButtonClass("PROPIEDAD", newInvestment.type === "PROPIEDAD")}`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getAssetTypeIconClass("PROPIEDAD", newInvestment.type === "PROPIEDAD")}`}>🏠</div>
                        <span className="text-xs font-medium">Propiedad</span>
                      </Button>
                      <Button
                        type="button"
                        variant={newInvestment.type === "OTHER" ? "default" : "outline"}
                        onClick={() => {
                          setNewInvestment({...newInvestment, type: "OTHER", name: "", symbol: "", currentPrice: "1"})
                          setSymbolSearch("")
                          setAvailableSymbols([])
                          setIsCustomSymbol(false)
                        }}
                        className={`flex flex-col items-center gap-1 h-16 transition-all ${getAssetTypeButtonClass("OTHER", newInvestment.type === "OTHER")}`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getAssetTypeIconClass("OTHER", newInvestment.type === "OTHER")}`}>💼</div>
                        <span className="text-xs font-medium">Otro</span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Búsqueda de símbolos o manual */}
                  <div className="space-y-2">
                    {/* Solo mostrar búsqueda para tipos financieros */}
                    {['STOCK', 'CRYPTO', 'ETF'].includes(newInvestment.type) ? (
                      <>
                        <div className="flex items-center justify-between">
                          <Label>Buscar Símbolo de {
                            newInvestment.type === "CRYPTO" ? "Criptomoneda" : 
                            newInvestment.type === "STOCK" ? "Acción" :
                            newInvestment.type === "ETF" ? "ETF" :
                            "Activo"
                          }</Label>
                          <div className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={isCustomSymbol}
                              onChange={(e) => {
                                setIsCustomSymbol(e.target.checked)
                                if (e.target.checked) {
                                  setSymbolSearch("")
                                  setAvailableSymbols([])
                                }
                              }}
                            />
                            <label>Personalizado</label>
                          </div>
                        </div>
                        
                        {!isCustomSymbol ? (
                          <>
                            <div className="relative">
                              <Input
                                value={symbolSearch}
                                onChange={(e) => {
                                  setSymbolSearch(e.target.value)
                                  searchSymbols(e.target.value)
                                }}
                                onFocus={() => {
                                  if (symbolSearch === "") {
                                    loadPopularSymbols()
                                  }
                                }}
                                placeholder={`Buscar ${getSearchText(newInvestment.type)}... (ej: ${getSearchExample(newInvestment.type)})`}
                              />
                              {searchingSymbols && (
                                <div className="absolute right-2 top-2">
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                </div>
                              )}
                            </div>
                            
                            {/* Lista de símbolos disponibles */}
                            {availableSymbols.length > 0 && (
                              <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-1 bg-white shadow-sm">
                                <div className="text-xs text-gray-500 pb-2 border-b">
                                  Selecciona un {getSearchText(newInvestment.type).slice(0, -1)} de la lista:
                                </div>
                                {availableSymbols.slice(0, 15).map((symbol, index) => (
                                  <div
                                    key={index}
                                    className={`p-3 cursor-pointer rounded-md border border-transparent transition-all ${getAssetTypeHoverColor(newInvestment.type)}`}
                                    onClick={() => selectSymbol(symbol)}
                                  >
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                          getAssetTypeColor(symbol.type)
                                        }`}>
                                          {symbol.symbol.slice(0, 2)}
                                        </div>
                                        <div>
                                          <div className="font-medium text-gray-900">{symbol.symbol}</div>
                                          <div className="text-gray-500 text-xs">{symbol.description}</div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge 
                                          variant="secondary" 
                                          className={`text-xs text-white ${getAssetTypeColor(symbol.type)}`}
                                        >
                                          {symbol.type.toLowerCase() === 'crypto' ? 'Crypto' : 
                                           symbol.type.toLowerCase() === 'stock' ? 'Stock' :
                                           symbol.type.toLowerCase() === 'etf' ? 'ETF' :
                                           symbol.type.toLowerCase() === 'vehiculo' ? 'Vehículo' :
                                           symbol.type.toLowerCase() === 'propiedad' ? 'Propiedad' : 'Otro'}
                                        </Badge>
                                        <div className={`text-xs ${getAssetTypeTextColor(newInvestment.type)}`}>Seleccionar →</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {availableSymbols.length > 15 && (
                                  <div className="text-center text-xs text-gray-500 py-2 border-t">
                                    Y {availableSymbols.length - 15} resultados más... Refina tu búsqueda
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {symbolSearch.length >= 1 && availableSymbols.length === 0 && !searchingSymbols && (
                              <div className="text-center text-sm text-gray-500 py-4 border rounded bg-gray-50">
                                No se encontraron {getSearchText(newInvestment.type)} con "{symbolSearch}". 
                                <br />
                                <button 
                                  type="button"
                                  className={`${getAssetTypeTextColor(newInvestment.type)} underline mt-1`}
                                  onClick={() => setIsCustomSymbol(true)}
                                >
                                  Crear símbolo personalizado
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Nombre</Label>
                              <Input
                                value={newInvestment.name}
                                onChange={(e) => setNewInvestment({...newInvestment, name: e.target.value})}
                                placeholder="Mi Inversión"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Símbolo</Label>
                              <Input
                                value={newInvestment.symbol}
                                onChange={(e) => setNewInvestment({...newInvestment, symbol: e.target.value.toUpperCase()})}
                                placeholder="CUSTOM"
                              />
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Formulario simple para activos físicos/otros */
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Nombre del {
                            newInvestment.type === "VEHICULO" ? "Vehículo" :
                            newInvestment.type === "PROPIEDAD" ? "Propiedad" :
                            "Activo"
                          }</Label>
                          <Input
                            value={newInvestment.name}
                            onChange={(e) => {
                              const name = e.target.value
                              // Auto-generar símbolo simple basado en el nombre
                              const symbol = name.toUpperCase().replace(/\s+/g, '').slice(0, 8) || 
                                            (newInvestment.type === "VEHICULO" ? "VEH" :
                                             newInvestment.type === "PROPIEDAD" ? "PROP" : "OTHER")
                              setNewInvestment({
                                ...newInvestment, 
                                name, 
                                symbol,
                                currentPrice: newInvestment.currentPrice || "1" // Precio por defecto para activos físicos
                              })
                            }}
                            placeholder={
                              newInvestment.type === "VEHICULO" ? "Toyota Corolla 2020" :
                              newInvestment.type === "PROPIEDAD" ? "Casa en Centro" :
                              "Nombre del activo"
                            }
                          />
                          {newInvestment.name && (
                            <div className="text-xs text-gray-600">
                              Símbolo generado: <span className="font-mono">{newInvestment.symbol}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mostrar información del símbolo seleccionado */}
                    {newInvestment.name && newInvestment.symbol && (
                      <div className={`p-3 border rounded ${getAssetTypeBgColor(newInvestment.type)}`}>
                        <div className="text-sm font-medium">{newInvestment.name}</div>
                        <div className="text-xs text-gray-600">{newInvestment.symbol}</div>
                        {newInvestment.currentPrice && (
                          <div className="text-xs text-green-600">Precio actual: {formatCurrency(parseFloat(newInvestment.currentPrice) || 0)}</div>
                        )}
                      </div>
                    )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cantidad</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newInvestment.quantity}
                        onChange={(e) => {
                          const quantity = e.target.value
                          const currentPrice = parseFloat(newInvestment.currentPrice) || 0
                          const quantityNum = parseFloat(quantity) || 0
                          
                          // Calcular el costo total automáticamente
                          const totalCost = currentPrice > 0 ? (quantityNum * currentPrice).toString() : ""
                          
                          setNewInvestment({
                            ...newInvestment, 
                            quantity,
                            // Actualizar precio de compra con el costo total
                            purchasePrice: totalCost || newInvestment.purchasePrice
                          })
                        }}
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Costo Total de Compra</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newInvestment.purchasePrice}
                        onChange={(e) => setNewInvestment({...newInvestment, purchasePrice: e.target.value})}
                        placeholder={
                          newInvestment.quantity && newInvestment.currentPrice 
                            ? ((parseFloat(newInvestment.quantity) || 0) * (parseFloat(newInvestment.currentPrice) || 0)).toString()
                            : "0.00"
                        }
                      />
                    </div>
                  </div>

                  {/* Precio actual para símbolos personalizados y activos físicos */}
                  {(isCustomSymbol || ['VEHICULO', 'PROPIEDAD', 'OTHER'].includes(newInvestment.type)) && (
                    <div className="space-y-2">
                      <Label>Precio Actual</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newInvestment.currentPrice}
                        onChange={(e) => setNewInvestment({...newInvestment, currentPrice: e.target.value})}
                        placeholder={
                          newInvestment.type === "VEHICULO" ? "25000.00" :
                          newInvestment.type === "PROPIEDAD" ? "150000.00" :
                          "1000.00"
                        }
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddInvestment(false)
                        setEditingInvestment(null)
                        setError(null)
                        setIsCustomSymbol(false)
                        setSymbolSearch("")
                        setAvailableSymbols([])
                        setNewInvestment(resetForm())
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={editingInvestment ? updateInvestment : addInvestment}>
                      {editingInvestment ? 'Actualizar' : 'Agregar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Resumen con layout responsivo */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8">
          {/* Métricas */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
              <div>
                <p className="text-sm text-gray-500">Invertido</p>
                <p className="text-xl font-semibold">{formatCurrency(totalInvestment)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Actual</p>
                <p className="text-xl font-semibold">{formatCurrency(currentValue)}</p>
              </div>
              
              <div className="sm:col-span-1">
                <p className="text-sm text-gray-500">Ganancia</p>
                <div className="flex items-center gap-1">
                  {totalGainLoss >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <div className={totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                    <p className="text-xl font-semibold">{formatCurrency(totalGainLoss)}</p>
                    <p className="text-sm">{totalGainLossPercentage.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Gráfico responsivo */}
          {totalInvestment > 0 && (
            <div className="flex justify-center lg:justify-end">
              <div className="w-48 h-32 lg:w-56 lg:h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{fontSize: 10}} />
                    <YAxis tick={{fontSize: 10}} />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'rendimiento' ? `${value.toFixed(1)}%` : formatCurrency(value),
                        name === 'rendimiento' ? 'Rendimiento' : 'Valor'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rendimiento" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Lista simple de inversiones */}
      <div className="space-y-3">
        {investments.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 mb-4">No hay inversiones...</p>
          </Card>
        ) : (
          investments.map((investment) => {
            const gainLoss = (investment.quantity * investment.currentPrice) - (investment.quantity * investment.purchasePrice)
            const gainLossPercentage = investment.purchasePrice > 0 ? (gainLoss / (investment.quantity * investment.purchasePrice)) * 100 : 0
            const currentValue = investment.quantity * investment.currentPrice

            return (
              <Card key={investment.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {/* Icono del activo */}
                    {getAssetIcon(investment.symbol, investment.type, symbolLogos)}
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{investment.symbol}</h4>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs text-white ${getAssetTypeColor(investment.type)}`}
                        >
                          {investment.type.toLowerCase() === 'crypto' ? 'Crypto' : 
                           investment.type.toLowerCase() === 'stock' ? 'Stock' :
                           investment.type.toLowerCase() === 'etf' ? 'ETF' :
                           investment.type.toLowerCase() === 'vehiculo' ? 'Vehículo' :
                           investment.type.toLowerCase() === 'propiedad' ? 'Propiedad' : 'Otro'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {investment.quantity} × {formatCurrency(investment.currentPrice)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Valor y ganancia */}
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(currentValue)}</p>
                      <div className={`flex items-center gap-1 text-sm ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {gainLoss >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>{gainLossPercentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(investment)}
                        className={getAssetTypeEditButtonClass(investment.type)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => confirmDelete(investment)}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Modal de confirmación para eliminar */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          
          {investmentToDelete && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                {getAssetIcon(investmentToDelete.symbol, investmentToDelete.type, symbolLogos)}
                <div>
                  <div className="font-medium">{investmentToDelete.symbol}</div>
                  <div className="text-sm text-gray-500">{investmentToDelete.name}</div>
                  <div className="text-sm text-red-600">
                    {investmentToDelete.quantity} × {formatCurrency(investmentToDelete.currentPrice)} = {formatCurrency(investmentToDelete.quantity * investmentToDelete.currentPrice)}
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                ¿Estás seguro de que quieres eliminar esta inversión? Esta acción no se puede deshacer.
              </p>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={deleteInvestment}>
                  Eliminar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
