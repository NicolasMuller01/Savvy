import { prisma } from '@/lib/prisma'

// Función auxiliar para encontrar o crear categoría por nombre
async function findOrCreateCategory(userId: string, categoryName: string, type: 'INCOME' | 'EXPENSE') {
  if (!categoryName) return null
  
  // Buscar categoría existente
  let category = await prisma.category.findFirst({
    where: {
      user_id: userId,
      name: categoryName,
      type,
    },
  })
  
  // Si no existe, crearla
  if (!category) {
    // Mapear nombres a colores e iconos por defecto
    const categoryDefaults: Record<string, { color: string; icon: string }> = {
      'Alimentación': { color: '#34d399', icon: '🍽️' },
      'Transporte': { color: '#60a5fa', icon: '🚗' },
      'Vivienda': { color: '#f87171', icon: '🏠' },
      'Entretenimiento': { color: '#a78bfa', icon: '🎮' },
      'Salud': { color: '#fbbf24', icon: '🏥' },
      'Compras': { color: '#ec4899', icon: '🛍️' },
      'Educación': { color: '#10b981', icon: '📚' },
      'Sueldo': { color: '#22c55e', icon: '💰' },
      'Freelance': { color: '#3b82f6', icon: '💼' },
      'Regalo': { color: '#fbbf24', icon: '🎁' },
      'Venta': { color: '#0ea5e9', icon: '💸' },
      'Otro': { color: '#6366f1', icon: '📥' },
    }
    
    const defaults = categoryDefaults[categoryName] || { color: '#6b7280', icon: '📝' }
    
    category = await prisma.category.create({
      data: {
        user_id: userId,
        name: categoryName,
        color: defaults.color,
        icon: defaults.icon,
        type,
        is_default: false,
      },
    })
  }
  
  return category
}

export interface CreateExpenseData {
  title: string
  description?: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category_id?: string
  category?: string  // Agregamos opción para pasar nombre de categoría
  budget_id?: string
  date: Date
  location?: string
  is_recurring?: boolean
  recurring_period?: string
  tags?: string[]
}

export interface UpdateExpenseData {
  title?: string
  description?: string
  amount?: number
  type?: 'INCOME' | 'EXPENSE'
  category_id?: string
  category?: string  // Agregamos opción para pasar nombre de categoría
  budget_id?: string
  date?: Date
  location?: string
  is_recurring?: boolean
  recurring_period?: string
  tags?: string[]
}

// Crear nuevo gasto/ingreso
export async function createExpense(userId: string, data: CreateExpenseData) {
  try {
    console.log('🔍 SERVICE: Creating expense with data:', data)
    console.log('🔍 SERVICE: Type received:', data.type)
    
    // Validar que el amount no exceda el límite de la base de datos (Decimal(12,2))
    if (data.amount >= 1000000000) {
      throw new Error('El monto no puede exceder $999,999,999.99')
    }
    
    let categoryId = data.category_id
    
    // Si se proporciona nombre de categoría en lugar de ID, buscar o crear la categoría
    if (data.category && !categoryId) {
      const category = await findOrCreateCategory(userId, data.category, data.type)
      categoryId = category?.id
    }
    
    console.log('🔍 SERVICE: About to create expense in DB with type:', data.type)

    const expense = await prisma.expense.create({
      data: {
        user_id: userId,
        title: data.title,
        description: data.description,
        amount: data.amount,
        type: data.type,
        category_id: categoryId,
        budget_id: data.budget_id,
        date: data.date,
        location: data.location,
        is_recurring: data.is_recurring || false,
        recurring_period: data.recurring_period,
        tags: data.tags || [],
      },
      include: {
        category: true,
        budget: true,
      },
    })

    console.log('🔍 SERVICE: Expense created in DB:', expense)
    console.log('🔍 SERVICE: Expense created with type:', expense.type)

    // Si es un gasto y tiene presupuesto asignado, actualizar el monto gastado
    if (data.type === 'EXPENSE' && data.budget_id) {
      await updateBudgetSpentAmount(data.budget_id)
    }

    return expense
  } catch (error) {
    console.error('Error creating expense:', error)
    throw error
  }
}

// Obtener gastos/ingresos del usuario
export async function getUserExpenses(
  userId: string,
  options: {
    type?: 'INCOME' | 'EXPENSE'
    category_id?: string
    start_date?: Date
    end_date?: Date
    limit?: number
    offset?: number
  } = {}
) {
  try {
    const where: any = { user_id: userId }

    if (options.type) where.type = options.type
    if (options.category_id) where.category_id = options.category_id
    if (options.start_date || options.end_date) {
      where.date = {}
      if (options.start_date) where.date.gte = options.start_date
      if (options.end_date) where.date.lte = options.end_date
    }

    return await prisma.expense.findMany({
      where,
      include: {
        category: true,
        budget: true,
      },
      orderBy: { date: 'desc' },
      take: options.limit,
      skip: options.offset,
    })
  } catch (error) {
    console.error('Error getting user expenses:', error)
    throw error
  }
}

// Actualizar gasto/ingreso
export async function updateExpense(
  expenseId: string,
  userId: string,
  data: UpdateExpenseData
) {
  try {
    const oldExpense = await prisma.expense.findFirst({
      where: { id: expenseId, user_id: userId },
    })

    if (!oldExpense) {
      throw new Error('Expense not found')
    }

    let categoryId = data.category_id
    
    // Si se proporciona nombre de categoría en lugar de ID, buscar o crear la categoría
    if (data.category && !categoryId) {
      const category = await findOrCreateCategory(userId, data.category, data.type || oldExpense.type)
      categoryId = category?.id
    }

    // Preparar datos para actualización, excluyendo 'category' ya que no es parte del modelo
    const { category, ...updateData } = data
    
    // Validar que el amount no exceda el límite de la base de datos (Decimal(12,2))
    if (updateData.amount && updateData.amount >= 1000000000) {
      throw new Error('El monto no puede exceder $999,999,999.99')
    }
    
    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...updateData,
        category_id: categoryId,
        updated_at: new Date(),
      },
      include: {
        category: true,
        budget: true,
      },
    })

    // Actualizar presupuestos afectados
    if (oldExpense.budget_id) {
      await updateBudgetSpentAmount(oldExpense.budget_id)
    }
    if (data.budget_id && data.budget_id !== oldExpense.budget_id) {
      await updateBudgetSpentAmount(data.budget_id)
    }

    return expense
  } catch (error) {
    console.error('Error updating expense:', error)
    throw error
  }
}

// Eliminar gasto/ingreso
export async function deleteExpense(expenseId: string, userId: string) {
  try {
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, user_id: userId },
    })

    if (!expense) {
      throw new Error('Expense not found')
    }

    await prisma.expense.delete({
      where: { id: expenseId },
    })

    // Actualizar presupuesto si estaba asignado
    if (expense.budget_id) {
      await updateBudgetSpentAmount(expense.budget_id)
    }

    return true
  } catch (error) {
    console.error('Error deleting expense:', error)
    throw error
  }
}

// Obtener resumen de gastos/ingresos
export async function getExpenseSummary(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const [totalIncome, totalExpenses, expensesByCategory] = await Promise.all([
      // Total de ingresos
      prisma.expense.aggregate({
        where: {
          user_id: userId,
          type: 'INCOME',
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),

      // Total de gastos
      prisma.expense.aggregate({
        where: {
          user_id: userId,
          type: 'EXPENSE',
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),

      // Gastos por categoría con detalles de la categoría
      prisma.expense.findMany({
        where: {
          user_id: userId,
          type: 'EXPENSE',
          date: { gte: startDate, lte: endDate },
        },
        include: {
          category: true,
        },
      }),
    ])

    // Agrupar gastos por categoría manualmente
    const categoryTotals: Record<string, { name: string; total: number; count: number }> = {}
    
    expensesByCategory.forEach(expense => {
      const categoryName = expense.category?.name || 'Sin categoría'
      if (!categoryTotals[categoryName]) {
        categoryTotals[categoryName] = {
          name: categoryName,
          total: 0,
          count: 0,
        }
      }
      categoryTotals[categoryName].total += Number(expense.amount)
      categoryTotals[categoryName].count += 1
    })

    const expensesByCategoryArray = Object.values(categoryTotals)

    return {
      totalIncome: Number(totalIncome._sum.amount) || 0,
      totalExpenses: Number(totalExpenses._sum.amount) || 0,
      balance: (Number(totalIncome._sum.amount) || 0) - (Number(totalExpenses._sum.amount) || 0),
      expensesByCategory: expensesByCategoryArray,
    }
  } catch (error) {
    console.error('Error getting expense summary:', error)
    throw error
  }
}

// Función auxiliar para actualizar el monto gastado de un presupuesto
async function updateBudgetSpentAmount(budgetId: string) {
  try {
    const totalSpent = await prisma.expense.aggregate({
      where: {
        budget_id: budgetId,
        type: 'EXPENSE',
      },
      _sum: { amount: true },
    })

    await prisma.budget.update({
      where: { id: budgetId },
      data: { spent_amount: totalSpent._sum.amount || 0 },
    })
  } catch (error) {
    console.error('Error updating budget spent amount:', error)
  }
}
