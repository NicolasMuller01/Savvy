"use client"

import React, { useState } from "react"
import { useBudgetData } from "@/hooks/useBudgetData"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { formatMoney } from "@/lib/utils"
import toast from 'react-hot-toast'
import { 
  Plus, 
  Trash2, 
  Edit2,
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  PieChart as PieChartIcon
} from "lucide-react"
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis } from "recharts"

interface Expense {
  id: string
  title: string
  amount: number
  category: string | { name: string; id: string } | any
  type: "EXPENSE" | "INCOME"
  date: string
}

const categories = [
  { name: "Alimentación", icon: "🍽️", color: "#10b981" },
  { name: "Transporte", icon: "🚗", color: "#3b82f6" },
  { name: "Vivienda", icon: "🏠", color: "#ef4444" },
  { name: "Entretenimiento", icon: "🎮", color: "#8b5cf6" },
  { name: "Salud", icon: "🏥", color: "#f59e0b" },
  { name: "Compras", icon: "🛍️", color: "#ec4899" },
  { name: "Servicios", icon: "⚡", color: "#06b6d4" },
  { name: "Educación", icon: "📚", color: "#06b6d4" },
  { name: "Otros", icon: "📦", color: "#6b7280" },
]

// Componente de loading sutil para números
const LoadingNumber = ({ isLoading, children }: { isLoading: boolean; children: React.ReactNode }) => {
  if (isLoading) {
    return (
      <span className="inline-flex items-center">
        <span className="opacity-50">---</span>
        <span className="ml-2 w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin inline-block"></span>
      </span>
    )
  }
  return <>{children}</>
}

const incomeCategories = [
  { name: "Sueldo", icon: "💼", color: "#22c55e" },
  { name: "Regalo", icon: "🎁", color: "#fbbf24" },
  { name: "Venta", icon: "💸", color: "#0ea5e9" },
  { name: "Otro", icon: "📥", color: "#6366f1" },
]

export default function BudgetOverview() {
  const [showAddIncome, setShowAddIncome] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<any>(null)
  
  // Estados de carga para las operaciones
  const [isAddingExpense, setIsAddingExpense] = useState(false)
  const [isEditingExpense, setIsEditingExpense] = useState(false)
  const [isDeletingExpense, setIsDeletingExpense] = useState(false)

  // Navegación mensual
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ]
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Formato para la API: "YYYY-MM"
  const selectedMonthStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`
  
  // Hook para datos del presupuesto
  const { expenses, summary, loading, loadingComponents, error, addExpense, editExpense, deleteExpense, refetch, refreshComponents } = useBudgetData(selectedMonthStr)

  const handlePrevMonth = () => {
    console.log('📅 Previous month - Current:', selectedMonth, selectedYear)
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(selectedYear - 1)
      console.log('📅 Changed to:', 11, selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
      console.log('📅 Changed to:', selectedMonth - 1, selectedYear)
    }
  }

  const handleNextMonth = () => {
    console.log('📅 Next month - Current:', selectedMonth, selectedYear)
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(selectedYear + 1)
      console.log('📅 Changed to:', 0, selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
      console.log('📅 Changed to:', selectedMonth + 1, selectedYear)
    }
  }

  // Separar ingresos y gastos
  const incomes = expenses.filter(exp => exp.type === "INCOME")
  const expensesList = expenses.filter(exp => exp.type === "EXPENSE")

  // Debug logs temporales
  console.log('🔍 Debug - Expenses:', expenses.length)
  console.log('🔍 Debug - Incomes:', incomes.length) 
  console.log('🔍 Debug - ExpensesList:', expensesList.length)
  console.log('🔍 Debug - Types in expenses:', expenses.map(exp => ({ id: exp.id, title: exp.title, type: exp.type })))

  const totalIncome = summary.totalIncome
  const totalExpenses = summary.totalExpenses
  const remainingBudget = summary.balance
  const spendingPercentage = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0

  // Chart data for expenses breakdown
  const chartData = summary.expensesByCategory?.length > 0 
    ? summary.expensesByCategory.map((category: any, index: number) => {
        const categoryInfo = categories.find(cat => cat.name === category.name) || categories[index % categories.length]
        return {
          name: category.name || 'Sin categoría',
          value: Number(category.total) || 0,
          fill: categoryInfo.color,
          icon: categoryInfo.icon,
        }
      }).filter(item => item.value > 0)
    : []

  const handleAddExpense = async (expenseData: any) => {
    if (isAddingExpense) return // Prevenir múltiples clics
    
    setIsAddingExpense(true)
    
    try {
      console.log('💰 Adding expense with data:', expenseData)
      console.log('💰 Original type:', expenseData.type)
      console.log('💰 Type check - is income?:', expenseData.type === "income")
      console.log('💰 Type check - is expense?:', expenseData.type === "expense")
      console.log('💰 Final type conversion:', expenseData.type === "income" ? "INCOME" : "EXPENSE")
      
      const finalData = {
        ...expenseData,
        type: expenseData.type === "income" ? "INCOME" : "EXPENSE"
      }
      
      console.log('💰 Final data being sent to API:', finalData)
      
      const success = await addExpense(finalData)
      
      console.log('💰 Add expense result:', success)
      
      if (success) {
        // Mostrar toast de éxito
        const isIncome = expenseData.type === "income"
        toast.success(`${isIncome ? 'Ingreso' : 'Gasto'} agregado correctamente`, {
          icon: isIncome ? '💰' : '💸',
        })
        
        // Cerrar modal solo si la operación fue exitosa
        setShowAddExpense(false)
        setShowAddIncome(false)
      } else {
        // Mostrar error al usuario
        toast.error("Error al agregar el registro. Por favor intenta de nuevo.")
      }
    } finally {
      setIsAddingExpense(false)
    }
  }

  const handleEditExpense = async (expenseData: any) => {
    if (!editingItem?.id || isEditingExpense) return
    
    setIsEditingExpense(true)
    
    try {
      const success = await editExpense(editingItem.id, {
        ...expenseData,
        type: expenseData.type === "income" ? "INCOME" : "EXPENSE"
      })
      
      if (success) {
        // Mostrar toast de éxito
        const isIncome = expenseData.type === "income"
        toast.success(`${isIncome ? 'Ingreso' : 'Gasto'} editado correctamente`, {
          icon: '✏️',
        })
        
        // Cerrar modal solo si la operación fue exitosa
        setShowEditModal(false)
        setEditingItem(null)
      } else {
        // Mostrar error al usuario
        toast.error("Error al editar el registro. Por favor intenta de nuevo.")
      }
    } finally {
      setIsEditingExpense(false)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    const item = expenses?.find(exp => exp.id === expenseId)
    setItemToDelete(item)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete || isDeletingExpense) return
    
    setIsDeletingExpense(true)
    
    try {
      const success = await deleteExpense(itemToDelete.id)
      
      if (success) {
        // Mostrar toast de éxito
        const isIncome = itemToDelete.type === "INCOME"
        toast.success(`${isIncome ? 'Ingreso' : 'Gasto'} eliminado correctamente`, {
          icon: '🗑️',
        })
        
        // Cerrar modal solo si la operación fue exitosa
        setShowDeleteModal(false)
        setItemToDelete(null)
      } else {
        // Mostrar error al usuario
        toast.error("Error al eliminar el registro. Por favor intenta de nuevo.")
      }
    } finally {
      setIsDeletingExpense(false)
    }
  }

  const openEditModal = (item: any) => {
    setEditingItem(item)
    setShowEditModal(true)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-96">
        <div className="text-center space-y-4 p-8 bg-red-500/10 rounded-xl border border-red-500/20">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-2">Error al cargar</h3>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden relative">
      {/* Loading Overlay para cambio de mes */}
      {loading && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-300 font-medium">Cargando {months[selectedMonth]} {selectedYear}...</p>
          </div>
        </div>
      )}
      
      <div className="h-full overflow-y-auto overflow-x-hidden p-3 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700/30 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-sm z-10 -mx-3 sm:-mx-6 px-3 sm:px-6 gap-3 sm:gap-0">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Presupuesto</h2>
            <p className="text-sm sm:text-base text-slate-400">Gestiona tus finanzas mensuales</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Dialog open={showAddIncome} onOpenChange={(open) => !isAddingExpense && setShowAddIncome(open)}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-[var(--primary-border)] text-[var(--primary)] hover:border-[var(--primary)] transition-all duration-200 cursor-pointer w-full sm:w-auto text-sm"
                  style={{
                    backgroundColor: 'var(--primary-hover)',
                  }}
                  disabled={isAddingExpense}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Agregar Ingreso
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Agregar Nuevo Ingreso</DialogTitle>
                </DialogHeader>
                <AddExpenseForm onAdd={handleAddExpense} type="income" isLoading={isAddingExpense} />
              </DialogContent>
            </Dialog>
            
            <Dialog open={showAddExpense} onOpenChange={(open) => !isAddingExpense && setShowAddExpense(open)}>
              <DialogTrigger asChild>
                <Button 
                  className="text-white transition-all duration-200 cursor-pointer w-full sm:w-auto text-sm"
                  style={{
                    background: 'linear-gradient(to right, var(--primary), var(--primary-dark))',
                    boxShadow: '0 8px 32px var(--primary-glow)'
                  }}
                  disabled={isAddingExpense}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Gasto
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Agregar Nuevo Gasto</DialogTitle>
                </DialogHeader>
                <AddExpenseForm onAdd={handleAddExpense} type="expense" isLoading={isAddingExpense} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Month Selector */}
        <div className="flex items-center justify-center gap-4 py-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handlePrevMonth}
            className="h-10 w-10 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white border border-slate-700/50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
          </Button>
          
          <div className="px-6 py-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl border border-slate-600/30 backdrop-blur-sm">
            <span className="text-xl font-bold text-white">{months[selectedMonth]} {selectedYear}</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleNextMonth}
            className="h-10 w-10 rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white border border-slate-700/50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </Button>
        </div>

        {/* Balance destacado - Minimalista */}
        <Card className="p-8 bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-slate-400 font-medium">Balance del Mes</p>
              <p className={`text-4xl font-bold ${remainingBudget >= 0 ? "text-white" : "text-red-400"}`}>
                <LoadingNumber isLoading={loadingComponents.summary}>
                  {formatMoney(Math.abs(remainingBudget))}
                </LoadingNumber>
              </p>
              <p className={`text-sm ${remainingBudget >= 0 ? "text-slate-300" : "text-red-300"}`}>
                {remainingBudget >= 0 ? "Disponible" : "Sobregiro"}
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Metrics - Minimalista */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="p-4 bg-slate-800/40 border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-400 mb-1">Ingresos</p>
                <p className="text-lg sm:text-xl font-semibold text-white">
                  <LoadingNumber isLoading={loadingComponents.summary}>
                    {formatMoney(totalIncome)}
                  </LoadingNumber>
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-slate-400" />
            </div>
          </Card>

          <Card className="p-4 bg-slate-800/40 border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Gastos</p>
                <p className="text-xl font-semibold text-white">
                  <LoadingNumber isLoading={loadingComponents.summary}>
                    {formatMoney(totalExpenses)}
                  </LoadingNumber>
                </p>
              </div>
              <TrendingDown className="h-5 w-5 text-slate-400" />
            </div>
          </Card>

          <Card className="p-4 bg-slate-800/40 border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Transacciones</p>
                <p className="text-xl font-semibold text-white">
                  {expenses?.length || 0}
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-slate-400" />
            </div>
          </Card>
        </div>

        {/* Transactions List with enhanced dark design */}
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6 bg-slate-800/30 border-slate-700/50 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-light))' }}
              ></div>
              Ingresos del Mes
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {incomes.length === 0 ? (
                <div className="text-center py-8">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ 
                      backgroundColor: 'var(--primary-hover)', 
                      borderColor: 'var(--primary-border)',
                      border: '1px solid'
                    }}
                  >
                    <DollarSign className="h-8 w-8" style={{ color: 'var(--primary)' }} />
                  </div>
                  <p className="text-slate-400">No hay ingresos registrados este mes</p>
                </div>
              ) : (
                incomes.map((income) => (
                  <div 
                    key={income.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl transition-all duration-200 gap-2 sm:gap-0"
                    style={{
                      background: 'linear-gradient(to right, var(--primary-hover), transparent)',
                      borderColor: 'var(--primary-border)',
                      border: '1px solid'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--primary-border)'}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: 'var(--primary-hover)',
                          borderColor: 'var(--primary-border)',
                          border: '1px solid'
                        }}
                      >
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: 'var(--primary)' }} />
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-medium text-white">{income.title}</p>
                        <p className="text-xs sm:text-sm text-slate-400">
                          {typeof income.category === 'object' ? income.category?.name : income.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                      <span className="font-bold text-emerald-400 text-base sm:text-lg">
                        +{formatMoney(income.amount)}
                      </span>
                      <div className="flex gap-1 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal({ ...income, type: 'income' })}
                          className="h-6 w-6 sm:h-8 sm:w-8 p-0 cursor-pointer hover:text-[var(--primary)]"
                          style={{ '--hover-bg': 'var(--primary-hover)' } as any}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(income.id)}
                          className="h-6 w-6 sm:h-8 sm:w-8 p-0 cursor-pointer text-red-400 hover:text-red-300"
                          style={{ '--hover-bg': 'rgba(239, 68, 68, 0.2)' } as any}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-4 bg-slate-800/30 border-slate-700/50 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-red-400 to-pink-400 rounded-full"></div>
              Gastos del Mes
              {loadingComponents.expenses && (
                <div className="w-4 h-4 border border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              )}
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {expensesList.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                    <TrendingDown className="h-8 w-8 text-red-400" />
                  </div>
                  <p className="text-slate-400">No hay gastos registrados este mes</p>
                </div>
              ) : (
                expensesList.map((expense) => (
                  <div key={expense.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-red-500/5 to-transparent rounded-xl border border-red-500/10 hover:border-red-500/20 transition-all duration-200 gap-2 sm:gap-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500/20 rounded-lg flex items-center justify-center border border-red-500/30">
                        <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-medium text-white">{expense.title}</p>
                        <p className="text-xs sm:text-sm text-slate-400">
                          {typeof expense.category === 'object' ? expense.category?.name : expense.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                      <span className="font-bold text-red-400 text-base sm:text-lg">
                        -{formatMoney(expense.amount)}
                      </span>
                      <div className="flex gap-1 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal({ ...expense, type: 'expense' })}
                          className="h-6 w-6 sm:h-8 sm:w-8 p-0 cursor-pointer hover:text-[var(--primary)]"
                          style={{ '--hover-bg': 'var(--primary-hover)' } as any}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="h-6 w-6 sm:h-8 sm:w-8 p-0 cursor-pointer text-red-400 hover:text-red-300"
                          style={{ '--hover-bg': 'rgba(239, 68, 68, 0.2)' } as any}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
        
        {/* Gráfico de distribución por categorías */}
        <Card className="p-3 sm:p-6 bg-slate-800/40 border-slate-700/50">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
            Distribución por Categorías
            {loadingComponents.chart && (
              <div className="w-4 h-4 border border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            )}
          </h3>
          {chartData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Gráfico circular */}
              <div className="">
                <ChartContainer
                  config={{
                    value: {
                      label: "Monto",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        innerRadius={30}
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-800 border border-slate-600 rounded-lg p-2 sm:p-3 shadow-lg">
                                <p className="text-white font-medium text-sm">{payload[0].name}</p>
                                <p className="text-slate-300 text-sm">
                                  {formatMoney(Number(payload[0].value) || 0)}
                                </p>
                              </div>
                            )
                          }
                          return null
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              
              {/* Lista de categorías */}
              <div className="space-y-2 sm:space-y-3 overflow-y-auto custom-scrollbar max-h-[200px] sm:max-h-none">
                {chartData.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-slate-900/30 rounded-lg">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.fill }}
                      ></div>
                      <span className="text-slate-300 text-sm sm:text-base">{category.name}</span>
                    </div>
                    <span className="font-medium text-white text-sm sm:text-base">
                      {formatMoney(category.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto">
                  <PieChartIcon className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-slate-400 text-sm">No hay gastos para mostrar</p>
              </div>
            </div>
          )}
        </Card>
      </div>
      

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={(open) => !isDeletingExpense && setShowDeleteModal(open)}>
        <DialogContent className="bg-slate-900/95 border-slate-700/50 backdrop-blur-sm shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300">
              ¿Estás seguro de que quieres eliminar este {itemToDelete?.type === 'INCOME' ? 'ingreso' : 'gasto'}?
            </p>
            {itemToDelete && (
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-white font-medium">{itemToDelete.title}</p>
                <p className="text-slate-400 text-sm">
                  {formatMoney(itemToDelete.amount || 0)} - {typeof itemToDelete.category === 'object' ? itemToDelete.category?.name : itemToDelete.category}
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 cursor-pointer"
                disabled={isDeletingExpense}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                disabled={isDeletingExpense}
              >
                {isDeletingExpense ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={(open) => !isEditingExpense && setShowEditModal(open)}>
        <DialogContent className="bg-slate-900/95 border-slate-700/50 backdrop-blur-sm shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              Editar {editingItem?.type === 'income' ? 'Ingreso' : 'Gasto'}
            </DialogTitle>
          </DialogHeader>
          {editingItem && (
            <EditExpenseForm 
              onEdit={handleEditExpense} 
              type={editingItem.type}
              initialData={editingItem}
              isLoading={isEditingExpense}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AddExpenseForm({ onAdd, type, isLoading }: { onAdd: (expenseData: any) => Promise<void>; type: 'expense' | 'income'; isLoading?: boolean }) {
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.amount || !formData.category || isLoading) return

    const amount = Number.parseFloat(formData.amount)
    
    // Validar que el monto no exceda el límite
    if (amount >= 1000000000) {
      toast.error('El monto no puede exceder $999,999,999.99')
      return
    }

    await onAdd({
      title: formData.title,
      amount: amount,
      category: formData.category,
      type: type,
      date: formData.date,
    })

    if (!isLoading) {
      setFormData({
        title: "",
        amount: "",
        category: "",
        date: new Date().toISOString().split("T")[0],
      })
    }
  }

  const categoriesOptions = type === 'income' ? incomeCategories : categories

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-slate-300 font-medium">Descripción</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={`Descripción del ${type === 'income' ? 'ingreso' : 'gasto'}`}
            className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 transition-all duration-200"
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--focus-border)'
              e.currentTarget.style.boxShadow = `0 0 0 3px var(--focus-ring)`
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = ''
              e.currentTarget.style.boxShadow = ''
            }}
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-slate-300 font-medium">Monto</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            max="999999999.99"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-emerald-500/50 focus:ring-emerald-500/20"
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category" className="text-slate-300 font-medium">Categoría</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} disabled={isLoading}>
            <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-white focus:border-emerald-500/50 focus:ring-emerald-500/20">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {categoriesOptions.map((category) => (
                <SelectItem key={category.name} value={category.name} className="text-white hover:bg-slate-700 focus:bg-slate-700">
                  <span className="flex items-center gap-3">
                    <span className="text-lg">{category.icon}</span>
                    <span>{category.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="date" className="text-slate-300 font-medium">Fecha</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="bg-slate-800/50 border-slate-600/50 text-white focus:border-emerald-500/50 focus:ring-emerald-500/20"
            disabled={isLoading}
            required
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full cursor-pointer text-white shadow-lg transition-all duration-200"
          style={{
            background: type === 'income' 
              ? 'linear-gradient(to right, var(--primary), var(--primary-dark))' 
              : 'linear-gradient(to right, var(--primary), var(--primary-dark))',
            boxShadow: `0 8px 32px var(--primary-glow)`
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = type === 'income'
                ? 'linear-gradient(to right, var(--primary-dark), var(--primary))'
                : 'linear-gradient(to right, var(--primary-dark), var(--primary))'
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = type === 'income'
                ? 'linear-gradient(to right, var(--primary), var(--primary-dark))'
                : 'linear-gradient(to right, var(--primary), var(--primary-dark))'
            }
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Agregando...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Agregar {type === 'income' ? 'Ingreso' : 'Gasto'}
            </>
          )}
        </Button>
      </form>
    </div>
  )
}

function EditExpenseForm({ onEdit, type, initialData, isLoading }: { 
  onEdit: (expenseData: any) => Promise<void>; 
  type: 'expense' | 'income';
  initialData: any;
  isLoading?: boolean;
}) {
  const [formData, setFormData] = useState({
    title: initialData.title || "",
    amount: initialData.amount?.toString() || "",
    category: (typeof initialData.category === 'object' ? initialData.category?.name : initialData.category) || "",
    date: initialData.date ? new Date(initialData.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.amount || !formData.category || isLoading) return

    const amount = Number.parseFloat(formData.amount)
    
    // Validar que el monto no exceda el límite
    if (amount >= 1000000000) {
      toast.error('El monto no puede exceder $999,999,999.99')
      return
    }

    await onEdit({
      title: formData.title,
      amount: amount,
      category: formData.category,
      type: type,
      date: formData.date,
    })
  }

  const categoriesOptions = type === 'income' ? incomeCategories : categories

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="edit-title" className="text-slate-300 font-medium">Descripción</Label>
          <Input
            id="edit-title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={`Descripción del ${type === 'income' ? 'ingreso' : 'gasto'}`}
            className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-emerald-500/50 focus:ring-emerald-500/20"
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-amount" className="text-slate-300 font-medium">Monto</Label>
          <Input
            id="edit-amount"
            type="number"
            step="0.01"
            max="999999999.99"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-emerald-500/50 focus:ring-emerald-500/20"
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-category" className="text-slate-300 font-medium">Categoría</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-white focus:border-emerald-500/50 focus:ring-emerald-500/20">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {categoriesOptions.map((category) => (
                <SelectItem key={category.name} value={category.name} className="text-white hover:bg-slate-700 focus:bg-slate-700">
                  <span className="flex items-center gap-3">
                    <span className="text-lg">{category.icon}</span>
                    <span>{category.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-date" className="text-slate-300 font-medium">Fecha</Label>
          <Input
            id="edit-date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="bg-slate-800/50 border-slate-600/50 text-white focus:border-emerald-500/50 focus:ring-emerald-500/20"
            disabled={isLoading}
            required
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full cursor-pointer text-white shadow-lg transition-all duration-200"
          style={{
            background: type === 'income' 
              ? 'linear-gradient(to right, var(--primary), var(--primary-dark))' 
              : 'linear-gradient(to right, var(--primary), var(--primary-dark))',
            boxShadow: `0 8px 32px var(--primary-glow)`
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = type === 'income'
                ? 'linear-gradient(to right, var(--primary-dark), var(--primary))'
                : 'linear-gradient(to right, var(--primary-dark), var(--primary))'
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = type === 'income'
                ? 'linear-gradient(to right, var(--primary), var(--primary-dark))'
                : 'linear-gradient(to right, var(--primary), var(--primary-dark))'
            }
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Actualizando...
            </>
          ) : (
            <>
              <Edit2 className="h-4 w-4 mr-2" />
              Actualizar {type === 'income' ? 'Ingreso' : 'Gasto'}
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
