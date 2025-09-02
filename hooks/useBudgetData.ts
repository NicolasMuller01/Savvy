import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// API constants
const EXPENSES_API_URL = process.env.EXPENSES_API_URL || '/api/expenses'

interface ExpenseSummary {
  totalIncome: number
  totalExpenses: number
  balance: number
  expensesByCategory: any[]
}

interface BudgetData {
  expenses: any[]
  summary: ExpenseSummary
  loading: boolean
  loadingComponents: {
    summary: boolean
    expenses: boolean
    chart: boolean
  }
  error: string | null
}

export function useBudgetData(selectedMonth: string) {
  const { user } = useAuth()
  const [isFetching, setIsFetching] = useState(false)
  const [data, setData] = useState<BudgetData>({
    expenses: [],
    summary: {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      expensesByCategory: [],
    },
    loading: false,
    loadingComponents: {
      summary: false,
      expenses: false,
      chart: false,
    },
    error: null,
  })

  const fetchData = async (showLoading = true) => {
    if (!user?.id || isFetching) return

    console.log('🔄 Fetching data for month:', selectedMonth)
    setIsFetching(true)

    if (showLoading) {
      setData(prev => ({ ...prev, loading: true, error: null }))
    }

    try {
      // Obtener gastos/ingresos del mes
      const expensesResponse = await fetch(`/api/expenses?userId=${user.id}&month=${selectedMonth}`)
      const expensesData = await expensesResponse.json()

      // Obtener resumen del mes
      const summaryResponse = await fetch(`/api/expenses/summary?userId=${user.id}&month=${selectedMonth}`)
      const summaryData = await summaryResponse.json()

      if (expensesResponse.ok && summaryResponse.ok) {
        setData({
          expenses: expensesData.expenses || [],
          summary: summaryData.summary || {
            totalIncome: 0,
            totalExpenses: 0,
            balance: 0,
            expensesByCategory: [],
          },
          loading: false,
          loadingComponents: {
            summary: false,
            expenses: false,
            chart: false,
          },
          error: null,
        })
        setIsFetching(false)
      } else {
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Error loading budget data',
        }))
        setIsFetching(false)
      }
    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Error loading budget data',
      }))
      setIsFetching(false)
    }
  }

  // Función para refrescar componentes específicos después de operaciones CRUD
  const refreshComponents = async (components: ('summary' | 'expenses' | 'chart')[]) => {
    if (!user?.id) return

    // Activar loading para los componentes específicos
    setData(prev => ({
      ...prev,
      loadingComponents: {
        ...prev.loadingComponents,
        ...components.reduce((acc, comp) => ({ ...acc, [comp]: true }), {})
      }
    }))

    try {
      // Obtener solo los datos necesarios
      const expensesResponse = await fetch(`/api/expenses?userId=${user.id}&month=${selectedMonth}`)
      const summaryResponse = await fetch(`/api/expenses/summary?userId=${user.id}&month=${selectedMonth}`)
      
      const expensesData = await expensesResponse.json()
      const summaryData = await summaryResponse.json()

      if (expensesResponse.ok && summaryResponse.ok) {
        setData(prev => ({
          ...prev,
          expenses: components.includes('expenses') ? expensesData.expenses || [] : prev.expenses,
          summary: components.includes('summary') || components.includes('chart') ? 
            summaryData.summary || prev.summary : prev.summary,
          loadingComponents: {
            summary: false,
            expenses: false,
            chart: false,
          },
        }))
      } else {
        // En caso de error, solo desactivar loading
        setData(prev => ({
          ...prev,
          loadingComponents: {
            summary: false,
            expenses: false,
            chart: false,
          },
        }))
      }
    } catch (error) {
      setData(prev => ({
        ...prev,
        loadingComponents: {
          summary: false,
          expenses: false,
          chart: false,
        },
      }))
    }
  }

  const addExpense = async (expenseData: any) => {
    if (!user?.id) return false

    try {
      // Crear expense temporal para actualización optimista
      const tempExpense = {
        id: `temp-${Date.now()}`,
        ...expenseData,
        date: new Date(expenseData.date).toISOString(),
        user_id: user.id,
      }

      // Actualizar estado local inmediatamente
      setData(prev => ({
        ...prev,
        expenses: [...(prev.expenses || []), tempExpense],
      }))

      const response = await fetch(EXPENSES_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          expenseData: {
            ...expenseData,
            date: new Date(expenseData.date),
          },
        }),
      })

      if (response.ok) {
        // Success - remove temp expense and add real one
        const newExpense = await response.json()
        setData(prev => ({
          ...prev,
          expenses: prev.expenses?.map(e => 
            e.id === tempExpense.id ? newExpense : e
          ) || [],
        }))
        
        // Refrescar componentes específicos después de agregar
        setTimeout(() => refreshComponents(['summary', 'chart']), 100)
        return true
      } else {
        // Revertir cambio si falla
        setData(prev => ({
          ...prev,
          expenses: prev.expenses?.filter(e => e.id !== tempExpense.id) || [],
        }))
        return false
      }
    } catch (error) {
      console.error('Error adding expense:', error)
      return false
    }
  }

  const editExpense = async (expenseId: string, expenseData: any) => {
    if (!user?.id) return false

    try {
      // Actualizar estado local inmediatamente
      setData(prev => ({
        ...prev,
        expenses: prev.expenses?.map(expense => 
          expense.id === expenseId 
            ? { ...expense, ...expenseData, date: new Date(expenseData.date).toISOString() }
            : expense
        ) || [],
      }))

      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          expenseData: {
            ...expenseData,
            date: new Date(expenseData.date),
          },
        }),
      })

      if (response.ok) {
        // Success - optimistic update already applied for edit
        
        // Refrescar componentes específicos después de editar
        setTimeout(() => refreshComponents(['summary', 'chart']), 100)
        return true
      } else {
        // Revertir cambio si falla
        refreshComponents(['summary', 'chart'])
        return false
      }
    } catch (error) {
      return false
    }
  }

  const deleteExpense = async (expenseId: string) => {
    if (!user?.id) return false

    try {
      // Actualizar estado local inmediatamente
      setData(prev => ({
        ...prev,
        expenses: prev.expenses?.filter(expense => expense.id !== expenseId) || [],
      }))

      const response = await fetch(`/api/expenses/${expenseId}?userId=${user.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Success - optimistic update already applied for delete
        
        // Refrescar componentes específicos después de eliminar
        setTimeout(() => refreshComponents(['summary', 'chart']), 100)
        return true
      } else {
        // Revertir cambio si falla
        refreshComponents(['summary', 'chart'])
        return false
      }
    } catch (error) {
      return false
    }
  }

  useEffect(() => {
    console.log('🔄 useBudgetData useEffect triggered for month:', selectedMonth)
    // Solo hacer fetch inicial
    fetchData(true)
  }, [user?.id, selectedMonth])

  return {
    ...data,
    refetch: fetchData,
    refreshComponents,
    addExpense,
    editExpense,
    deleteExpense,
  }
}
