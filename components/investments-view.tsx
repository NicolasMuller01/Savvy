"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Plus, Trash2, ArrowUpRight, TrendingUp } from "lucide-react"
import { PieChart, Pie, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from "recharts"

interface Investment {
  id: string
  name: string
  symbol: string
  type: "crypto" | "stock" | "etf" | "bond" | "other"
  quantity: number
  purchasePrice: number
  currentPrice: number
  purchaseDate: string
  notes?: string
}

interface InvestmentsViewProps {
  investments: Investment[]
  setInvestments: (investments: Investment[]) => void
}

const assetTypes = [
  { value: "crypto", label: "Crypto", icon: "₿" },
  { value: "stock", label: "Stocks", icon: "📈" },
  { value: "etf", label: "ETFs", icon: "📊" },
  { value: "bond", label: "Bonds", icon: "🏛️" },
  { value: "other", label: "Other", icon: "💼" },
]

const chartColors = [
  "#60a5fa", // azul
  "#34d399", // verde
  "#fbbf24", // amarillo
  "#f87171", // rojo
  "#a78bfa", // violeta
]

export function InvestmentsView({ investments, setInvestments }: InvestmentsViewProps) {
  const [showAddInvestment, setShowAddInvestment] = useState(false)

  const addInvestment = (investment: Omit<Investment, "id">) => {
    // Validar que los valores numéricos no excedan los límites
    if (investment.purchasePrice >= 1000000000 || investment.currentPrice >= 1000000000) {
      console.error('El precio no puede exceder $999,999,999.99')
      return
    }
    
    if (investment.quantity >= 1000000000) {
      console.error('La cantidad no puede exceder 999,999,999.99')
      return
    }

    const newInvestment: Investment = {
      ...investment,
      id: Date.now().toString(),
    }
    setInvestments([...investments, newInvestment])
    setShowAddInvestment(false)
  }

  const deleteInvestment = (id: string) => {
    setInvestments(investments.filter((inv) => inv.id !== id))
  }

  const totalValue = investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0)
  const totalGainLoss = investments.reduce((sum, inv) => {
    const gainLoss = (inv.currentPrice - inv.purchasePrice) * inv.quantity
    return sum + gainLoss
  }, 0)
  const totalGainLossPercentage = investments.reduce((sum, inv) => {
    const totalInvested = inv.purchasePrice * inv.quantity
    return sum + totalInvested
  }, 0) > 0 ? (totalGainLoss / investments.reduce((sum, inv) => {
    const totalInvested = inv.purchasePrice * inv.quantity
    return sum + totalInvested
  }, 0)) * 100 : 0

  const chartData = investments.map((inv, index) => ({
    name: inv.symbol,
    value: inv.quantity * inv.currentPrice,
    fill: chartColors[index % chartColors.length],
  }))

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Inversiones</h1>
          <Dialog open={showAddInvestment} onOpenChange={setShowAddInvestment}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="border-[var(--primary-border)] text-[var(--primary)] hover:border-[var(--primary)] transition-all duration-200 cursor-pointer w-full sm:w-auto text-xs sm:text-sm"
                style={{
                  backgroundColor: 'var(--primary-hover)',
                }}
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Agregar Activo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nueva Inversión</DialogTitle>
              </DialogHeader>
              <AddInvestmentForm onAdd={addInvestment} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content with scroll */}
      <div className="flex-1 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 overflow-y-auto space-y-4 sm:space-y-6">
        {/* Portfolio Overview */}
        <Card className="p-3 sm:p-4">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">Valor Total del Portafolio</p>
            <p className="text-2xl sm:text-3xl font-bold text-white">${totalValue.toFixed(2)}</p>
            <div className={`flex items-center justify-center gap-1 mt-2 ${
              totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {totalGainLoss >= 0 ? <TrendingUp className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4 rotate-180" />}
              <span className="text-sm sm:text-base font-medium">
                ${Math.abs(totalGainLoss).toFixed(2)} ({totalGainLossPercentage >= 0 ? '+' : ''}{totalGainLossPercentage.toFixed(2)}%)
              </span>
            </div>
          </div>
        </Card>

        {/* Charts */}
        {investments.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Portfolio Distribution */}
            <Card className="p-3 sm:p-4">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Distribución del Portafolio</h3>
              <ChartContainer
                config={{
                  value: {
                    label: "Valor",
                  },
                }}
                className="h-[200px] sm:h-[250px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </Card>

            {/* Performance Chart */}
            <Card className="p-3 sm:p-4">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Rendimiento por Activo</h3>
              <ChartContainer
                config={{
                  gainLoss: {
                    label: "Ganancia/Pérdida",
                    color: "#10b981",
                  },
                }}
                className="h-[200px] sm:h-[250px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={investments.map(inv => ({
                    name: inv.symbol,
                    gainLoss: (inv.currentPrice - inv.purchasePrice) * inv.quantity
                  }))}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="gainLoss" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </Card>
          </div>
        )}

        {/* Investments List */}
        <Card className="p-3 sm:p-4">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Mis Inversiones</h3>
          
          {investments.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-slate-400 mb-4">
                <TrendingUp className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm sm:text-base">No tienes inversiones aún</p>
                <p className="text-xs sm:text-sm mt-2">Agrega tu primera inversión para comenzar a hacer seguimiento de tu portafolio</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {investments.map((investment) => {
                const gainLoss = (investment.currentPrice - investment.purchasePrice) * investment.quantity
                const gainLossPercentage = ((investment.currentPrice - investment.purchasePrice) / investment.purchasePrice) * 100
                const totalValue = investment.quantity * investment.currentPrice

                return (
                  <Card key={investment.id} className="p-3 sm:p-4 bg-slate-700/30 border-slate-600/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                          <div>
                            <h4 className="text-base sm:text-lg font-semibold text-white">{investment.symbol}</h4>
                            <p className="text-xs sm:text-sm text-slate-400">{investment.name}</p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className="text-xs bg-slate-600/30 border-slate-500/50 text-slate-300 w-fit"
                          >
                            {assetTypes.find(t => t.value === investment.type)?.label || investment.type}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                          <div>
                            <p className="text-slate-400">Cantidad</p>
                            <p className="text-white font-medium">{investment.quantity}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Precio Compra</p>
                            <p className="text-white font-medium">${investment.purchasePrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Precio Actual</p>
                            <p className="text-white font-medium">${investment.currentPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Valor Total</p>
                            <p className="text-white font-medium">${totalValue.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className={`flex items-center gap-1 ${
                            gainLoss >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {gainLoss >= 0 ? <TrendingUp className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3 rotate-180" />}
                            <span className="font-medium text-xs sm:text-sm">
                              ${Math.abs(gainLoss).toFixed(2)} ({gainLossPercentage >= 0 ? '+' : ''}{gainLossPercentage.toFixed(2)}%)
                            </span>
                          </div>
                          {investment.notes && (
                            <p className="text-xs text-slate-400 truncate">{investment.notes}</p>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        onClick={() => deleteInvestment(investment.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 self-start sm:self-center"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// Datos disponibles para inversiones
const availableAssets = {
  crypto: [
    { symbol: "BTC", name: "Bitcoin" },
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "SOL", name: "Solana" },
    { symbol: "USDT", name: "Tether" },
  ],
  stock: [
    { symbol: "AAPL", name: "Apple Inc." },
    { symbol: "MSFT", name: "Microsoft Corp." },
    { symbol: "TSLA", name: "Tesla Inc." },
    { symbol: "GOOGL", name: "Alphabet Inc." },
  ],
}

function AddInvestmentForm({ onAdd }: { onAdd: (investment: Omit<Investment, "id">) => void }) {
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    type: "stock" as Investment["type"],
    quantity: 0,
    purchasePrice: 0,
    currentPrice: 0,
    purchaseDate: new Date().toISOString().split("T")[0],
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones client-side
    if (formData.purchasePrice >= 1000000000 || formData.currentPrice >= 1000000000) {
      console.error('El precio no puede exceder $999,999,999.99')
      return
    }
    
    if (formData.quantity >= 1000000000) {
      console.error('La cantidad no puede exceder 999,999,999.99')
      return
    }

    if (!formData.name || !formData.symbol || formData.quantity <= 0 || formData.purchasePrice <= 0 || formData.currentPrice <= 0) {
      console.error('Por favor completa todos los campos requeridos')
      return
    }

    onAdd(formData)
    setFormData({
      name: "",
      symbol: "",
      type: "stock",
      quantity: 0,
      purchasePrice: 0,
      currentPrice: 0,
      purchaseDate: new Date().toISOString().split("T")[0],
      notes: "",
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-slate-300">Nombre del Activo</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Apple Inc."
            className="bg-slate-700/50 border-slate-600/50 text-white"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="symbol" className="text-slate-300">Símbolo</Label>
          <Input
            id="symbol"
            value={formData.symbol}
            onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
            placeholder="Ej: AAPL"
            className="bg-slate-700/50 border-slate-600/50 text-white"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="type" className="text-slate-300">Tipo de Activo</Label>
        <Select value={formData.type} onValueChange={(value: Investment["type"]) => setFormData({ ...formData, type: value })}>
          <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {assetTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.icon} {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="quantity" className="text-slate-300">Cantidad</Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            min="0"
            max="999999999.99"
            value={formData.quantity || ""}
            onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="bg-slate-700/50 border-slate-600/50 text-white"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="purchasePrice" className="text-slate-300">Precio de Compra</Label>
          <Input
            id="purchasePrice"
            type="number"
            step="0.01"
            min="0"
            max="999999999.99"
            value={formData.purchasePrice || ""}
            onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="bg-slate-700/50 border-slate-600/50 text-white"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="currentPrice" className="text-slate-300">Precio Actual</Label>
          <Input
            id="currentPrice"
            type="number"
            step="0.01"
            min="0"
            max="999999999.99"
            value={formData.currentPrice || ""}
            onChange={(e) => setFormData({ ...formData, currentPrice: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="bg-slate-700/50 border-slate-600/50 text-white"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="purchaseDate" className="text-slate-300">Fecha de Compra</Label>
        <Input
          id="purchaseDate"
          type="date"
          value={formData.purchaseDate}
          onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
          className="bg-slate-700/50 border-slate-600/50 text-white"
          required
        />
      </div>

      <div>
        <Label htmlFor="notes" className="text-slate-300">Notas (Opcional)</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Añade notas sobre esta inversión..."
          className="bg-slate-700/50 border-slate-600/50 text-white"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => setFormData({
          name: "",
          symbol: "",
          type: "stock",
          quantity: 0,
          purchasePrice: 0,
          currentPrice: 0,
          purchaseDate: new Date().toISOString().split("T")[0],
          notes: "",
        })}>
          Cancelar
        </Button>
        <Button type="submit">
          Agregar Inversión
        </Button>
      </div>
    </form>
  )
}
