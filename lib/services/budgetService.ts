import { prisma } from '@/lib/prisma'

export interface CreateBudgetData {
  name: string
  description?: string
  target_amount: number
  category_id?: string
  start_date: Date
  end_date: Date
  is_recurring?: boolean
  recurring_period?: string
  alert_threshold?: number
}

export interface UpdateBudgetData {
  name?: string
  description?: string
  target_amount?: number
  category_id?: string
  start_date?: Date
  end_date?: Date
  is_recurring?: boolean
  recurring_period?: string
  alert_threshold?: number
}

// Crear nuevo presupuesto
export async function createBudget(userId: string, data: CreateBudgetData) {
  try {
    const budget = await prisma.budget.create({
      data: {
        user_id: userId,
        name: data.name,
        description: data.description,
        target_amount: data.target_amount,
        spent_amount: 0,
        category_id: data.category_id,
        start_date: data.start_date,
        end_date: data.end_date,
        is_recurring: data.is_recurring || false,
        recurring_period: data.recurring_period,
        alert_threshold: data.alert_threshold || 80,
      },
      include: {
        category: true,
        expenses: true,
      },
    })

    return budget
  } catch (error) {
    console.error('Error creating budget:', error)
    throw error
  }
}

// Obtener presupuestos del usuario
export async function getUserBudgets(
  userId: string,
  options: {
    category_id?: string
    is_active?: boolean
    start_date?: Date
    end_date?: Date
  } = {}
) {
  try {
    const where: any = { user_id: userId }

    if (options.category_id) where.category_id = options.category_id
    
    if (options.is_active !== undefined) {
      const now = new Date()
      if (options.is_active) {
        where.start_date = { lte: now }
        where.end_date = { gte: now }
      } else {
        where.OR = [
          { start_date: { gt: now } },
          { end_date: { lt: now } }
        ]
      }
    }

    if (options.start_date || options.end_date) {
      where.start_date = {}
      if (options.start_date) where.start_date.gte = options.start_date
      if (options.end_date) where.start_date.lte = options.end_date
    }

    return await prisma.budget.findMany({
      where,
      include: {
        category: true,
        expenses: {
          orderBy: { date: 'desc' },
          take: 5, // Solo los últimos 5 gastos
        },
      },
      orderBy: { start_date: 'desc' },
    })
  } catch (error) {
    console.error('Error getting user budgets:', error)
    throw error
  }
}

// Obtener presupuesto por ID
export async function getBudgetById(budgetId: string, userId: string) {
  try {
    return await prisma.budget.findFirst({
      where: { id: budgetId, user_id: userId },
      include: {
        category: true,
        expenses: {
          orderBy: { date: 'desc' },
        },
      },
    })
  } catch (error) {
    console.error('Error getting budget by ID:', error)
    throw error
  }
}

// Actualizar presupuesto
export async function updateBudget(
  budgetId: string,
  userId: string,
  data: UpdateBudgetData
) {
  try {
    const budget = await prisma.budget.update({
      where: { 
        id: budgetId,
        user_id: userId
      },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: {
        category: true,
        expenses: true,
      },
    })

    return budget
  } catch (error) {
    console.error('Error updating budget:', error)
    throw error
  }
}

// Eliminar presupuesto
export async function deleteBudget(budgetId: string, userId: string) {
  try {
    // Primero verificar que el presupuesto existe y pertenece al usuario
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, user_id: userId },
    })

    if (!budget) {
      throw new Error('Budget not found')
    }

    // Eliminar las referencias en gastos (setear budget_id a null)
    await prisma.expense.updateMany({
      where: { budget_id: budgetId },
      data: { budget_id: null },
    })

    // Eliminar el presupuesto
    await prisma.budget.delete({
      where: { id: budgetId },
    })

    return true
  } catch (error) {
    console.error('Error deleting budget:', error)
    throw error
  }
}

// Obtener resumen de presupuestos
export async function getBudgetSummary(userId: string) {
  try {
    const now = new Date()
    
    const [activeBudgets, totalBudgets, overBudgetCount] = await Promise.all([
      // Presupuestos activos
      prisma.budget.findMany({
        where: {
          user_id: userId,
          start_date: { lte: now },
          end_date: { gte: now },
        },
        include: { category: true },
      }),

      // Total de presupuestos
      prisma.budget.count({
        where: { user_id: userId },
      }),

      // Presupuestos que exceden el límite
      prisma.budget.count({
        where: {
          user_id: userId,
          start_date: { lte: now },
          end_date: { gte: now },
          spent_amount: {
            gt: prisma.$queryRaw`target_amount * (alert_threshold / 100.0)`,
          },
        },
      }),
    ])

    const totalTargetAmount = activeBudgets.reduce((sum: number, budget: any) => sum + budget.target_amount, 0)
    const totalSpentAmount = activeBudgets.reduce((sum: number, budget: any) => sum + budget.spent_amount, 0)

    return {
      activeBudgets: activeBudgets.length,
      totalBudgets,
      overBudgetCount,
      totalTargetAmount,
      totalSpentAmount,
      utilizationPercentage: totalTargetAmount > 0 ? (totalSpentAmount / totalTargetAmount) * 100 : 0,
      budgets: activeBudgets,
    }
  } catch (error) {
    console.error('Error getting budget summary:', error)
    throw error
  }
}

// Verificar alertas de presupuesto
export async function checkBudgetAlerts(userId: string) {
  try {
    const now = new Date()
    
    const alertBudgets = await prisma.budget.findMany({
      where: {
        user_id: userId,
        start_date: { lte: now },
        end_date: { gte: now },
      },
      include: { category: true },
    })

    const alerts = alertBudgets
      .filter((budget: any) => {
        const alertAmount = budget.target_amount * (budget.alert_threshold / 100)
        return budget.spent_amount >= alertAmount
      })
      .map((budget: any) => ({
        budgetId: budget.id,
        budgetName: budget.name,
        categoryName: budget.category?.name,
        targetAmount: budget.target_amount,
        spentAmount: budget.spent_amount,
        alertThreshold: budget.alert_threshold,
        utilizationPercentage: (budget.spent_amount / budget.target_amount) * 100,
        isOverBudget: budget.spent_amount > budget.target_amount,
      }))

    return alerts
  } catch (error) {
    console.error('Error checking budget alerts:', error)
    throw error
  }
}

// Recalcular montos gastados de todos los presupuestos del usuario
export async function recalculateBudgetAmounts(userId: string) {
  try {
    const budgets = await prisma.budget.findMany({
      where: { user_id: userId },
    })

    for (const budget of budgets) {
      const totalSpent = await prisma.expense.aggregate({
        where: {
          budget_id: budget.id,
          type: 'EXPENSE',
        },
        _sum: { amount: true },
      })

      await prisma.budget.update({
        where: { id: budget.id },
        data: { spent_amount: totalSpent._sum.amount || 0 },
      })
    }

    return true
  } catch (error) {
    console.error('Error recalculating budget amounts:', error)
    throw error
  }
}
