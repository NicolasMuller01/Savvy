import { prisma } from '@/lib/prisma'

export interface CreateCategoryData {
  name: string
  description?: string
  color?: string
  icon?: string
  type: 'INCOME' | 'EXPENSE' | 'BOTH'
  is_default?: boolean
}

export interface UpdateCategoryData {
  name?: string
  description?: string
  color?: string
  icon?: string
  type?: 'INCOME' | 'EXPENSE' | 'BOTH'
  is_default?: boolean
}

// Crear nueva categoría
export async function createCategory(userId: string, data: CreateCategoryData) {
  try {
    const category = await prisma.category.create({
      data: {
        user_id: userId,
        name: data.name,
        description: data.description,
        color: data.color || '#6B7280',
        icon: data.icon || '📁',
        type: data.type,
        is_default: data.is_default || false,
      },
    })

    return category
  } catch (error) {
    throw error
  }
}

// Obtener categorías del usuario
export async function getUserCategories(
  userId: string,
  options: {
    type?: 'INCOME' | 'EXPENSE' | 'BOTH'
    include_default?: boolean
    include_usage_stats?: boolean
  } = {}
) {
  try {
    const where: any = { user_id: userId }

    if (options.type) {
      where.OR = [
        { type: options.type },
        { type: 'BOTH' }
      ]
    }

    const categories = await prisma.category.findMany({
      where,
      include: options.include_usage_stats ? {
        expenses: {
          select: {
            id: true,
            amount: true,
            type: true,
          },
        },
        budgets: {
          select: {
            id: true,
            target_amount: true,
            spent_amount: true,
          },
        },
      } : undefined,
      orderBy: [
        { is_default: 'desc' },
        { name: 'asc' }
      ],
    })

    // Si se incluyen estadísticas de uso, calcularlas
    if (options.include_usage_stats) {
      return categories.map((category: any) => {
        const expenseCount = category.expenses?.length || 0
        const totalExpenseAmount = category.expenses?.reduce((sum: number, exp: any) => sum + exp.amount, 0) || 0
        const budgetCount = category.budgets?.length || 0
        const totalBudgetAmount = category.budgets?.reduce((sum: number, budget: any) => sum + budget.target_amount, 0) || 0

        return {
          ...category,
          usage_stats: {
            expense_count: expenseCount,
            total_expense_amount: totalExpenseAmount,
            budget_count: budgetCount,
            total_budget_amount: totalBudgetAmount,
          },
        }
      })
    }

    return categories
  } catch (error) {
    console.error('Error getting user categories:', error)
    throw error
  }
}

// Obtener categoría por ID
export async function getCategoryById(categoryId: string, userId: string) {
  try {
    return await prisma.category.findFirst({
      where: { id: categoryId, user_id: userId },
      include: {
        expenses: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        budgets: {
          orderBy: { start_date: 'desc' },
          take: 5,
        },
      },
    })
  } catch (error) {
    console.error('Error getting category by ID:', error)
    throw error
  }
}

// Actualizar categoría
export async function updateCategory(
  categoryId: string,
  userId: string,
  data: UpdateCategoryData
) {
  try {
    const category = await prisma.category.update({
      where: { 
        id: categoryId,
        user_id: userId
      },
      data: {
        ...data,
        updated_at: new Date(),
      },
    })

    return category
  } catch (error) {
    console.error('Error updating category:', error)
    throw error
  }
}

// Eliminar categoría
export async function deleteCategory(categoryId: string, userId: string) {
  try {
    // Verificar que la categoría existe y pertenece al usuario
    const category = await prisma.category.findFirst({
      where: { id: categoryId, user_id: userId },
      include: {
        expenses: true,
        budgets: true,
      },
    })

    if (!category) {
      throw new Error('Category not found')
    }

    // No permitir eliminar categorías por defecto
    if (category.is_default) {
      throw new Error('Cannot delete default category')
    }

    // Verificar si tiene gastos o presupuestos asociados
    if (category.expenses.length > 0 || category.budgets.length > 0) {
      throw new Error('Cannot delete category with associated expenses or budgets')
    }

    // Eliminar la categoría
    await prisma.category.delete({
      where: { id: categoryId },
    })

    return true
  } catch (error) {
    console.error('Error deleting category:', error)
    throw error
  }
}

// Obtener categorías por defecto para crear inicialmente
export function getDefaultCategories(): CreateCategoryData[] {
  return [
    // Categorías de gastos
    { name: 'Alimentación', description: 'Supermercado, restaurantes, comida', color: '#EF4444', icon: '🍽️', type: 'EXPENSE', is_default: true },
    { name: 'Transporte', description: 'Combustible, transporte público, Uber', color: '#3B82F6', icon: '🚗', type: 'EXPENSE', is_default: true },
    { name: 'Vivienda', description: 'Alquiler, hipoteca, servicios', color: '#8B5CF6', icon: '🏠', type: 'EXPENSE', is_default: true },
    { name: 'Salud', description: 'Médicos, medicamentos, seguros', color: '#10B981', icon: '🏥', type: 'EXPENSE', is_default: true },
    { name: 'Entretenimiento', description: 'Cine, streaming, hobbies', color: '#F59E0B', icon: '🎬', type: 'EXPENSE', is_default: true },
    { name: 'Educación', description: 'Cursos, libros, capacitación', color: '#6366F1', icon: '📚', type: 'EXPENSE', is_default: true },
    { name: 'Ropa', description: 'Vestimenta y accesorios', color: '#EC4899', icon: '👕', type: 'EXPENSE', is_default: true },
    { name: 'Tecnología', description: 'Dispositivos, software, internet', color: '#06B6D4', icon: '💻', type: 'EXPENSE', is_default: true },
    { name: 'Servicios', description: 'Peluquería, limpieza, reparaciones', color: '#84CC16', icon: '🔧', type: 'EXPENSE', is_default: true },
    { name: 'Otros Gastos', description: 'Gastos varios sin categoría específica', color: '#6B7280', icon: '📁', type: 'EXPENSE', is_default: true },

    // Categorías de ingresos
    { name: 'Salario', description: 'Sueldo principal', color: '#059669', icon: '💰', type: 'INCOME', is_default: true },
    { name: 'Freelance', description: 'Trabajos independientes', color: '#0891B2', icon: '💼', type: 'INCOME', is_default: true },
    { name: 'Inversiones', description: 'Dividendos, ganancias de capital', color: '#7C3AED', icon: '📈', type: 'INCOME', is_default: true },
    { name: 'Bonos', description: 'Aguinaldo, bonificaciones', color: '#DC2626', icon: '🎁', type: 'INCOME', is_default: true },
    { name: 'Otros Ingresos', description: 'Ingresos varios', color: '#6B7280', icon: '💵', type: 'INCOME', is_default: true },

    // Categorías mixtas
    { name: 'Regalos', description: 'Dar y recibir regalos', color: '#F97316', icon: '🎁', type: 'BOTH', is_default: true },
  ]
}

// Crear categorías por defecto para un nuevo usuario
export async function createDefaultCategories(userId: string) {
  try {
    const defaultCategories = getDefaultCategories()
    const createdCategories = []

    for (const categoryData of defaultCategories) {
      const category = await createCategory(userId, categoryData)
      createdCategories.push(category)
    }

    return createdCategories
  } catch (error) {
    console.error('Error creating default categories:', error)
    throw error
  }
}

// Obtener estadísticas de uso de categorías
export async function getCategoryStats(userId: string, startDate?: Date, endDate?: Date) {
  try {
    const dateFilter: any = {}
    if (startDate || endDate) {
      dateFilter.date = {}
      if (startDate) dateFilter.date.gte = startDate
      if (endDate) dateFilter.date.lte = endDate
    }

    const categories = await prisma.category.findMany({
      where: { user_id: userId },
      include: {
        expenses: {
          where: dateFilter,
          select: {
            amount: true,
            type: true,
          },
        },
      },
    })

    return categories.map((category: any) => {
      const expenses = category.expenses.filter((exp: any) => exp.type === 'EXPENSE')
      const income = category.expenses.filter((exp: any) => exp.type === 'INCOME')

      const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0)
      const totalIncome = income.reduce((sum: number, exp: any) => sum + exp.amount, 0)

      return {
        id: category.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
        type: category.type,
        expense_count: expenses.length,
        income_count: income.length,
        total_expenses: totalExpenses,
        total_income: totalIncome,
        net_amount: totalIncome - totalExpenses,
      }
    })
  } catch (error) {
    console.error('Error getting category stats:', error)
    throw error
  }
}

// Verificar si una categoría se puede eliminar (no tiene gastos ni presupuestos)
export async function canDeleteCategory(categoryId: string, userId: string) {
  try {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, user_id: userId },
      include: {
        expenses: true,
        budgets: true,
      },
    })

    if (!category) {
      return { canDelete: false, reason: 'Category not found' }
    }

    if (category.is_default) {
      return { canDelete: false, reason: 'Cannot delete default category' }
    }

    if (category.expenses.length > 0) {
      return { canDelete: false, reason: `Category has ${category.expenses.length} associated expenses` }
    }

    if (category.budgets.length > 0) {
      return { canDelete: false, reason: `Category has ${category.budgets.length} associated budgets` }
    }

    return { canDelete: true, reason: null }
  } catch (error) {
    console.error('Error checking if category can be deleted:', error)
    return { canDelete: false, reason: 'Error checking category' }
  }
}
