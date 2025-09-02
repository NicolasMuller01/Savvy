// Servicios principales
export * from './userService'
export * from './categoryService'
export * from './expenseService'
export * from './budgetService'
export * from './investmentService'

// Re-exports útiles para el frontend
export type {
  CreateUserData,
  UpdateUserData,
} from './userService'

export type {
  CreateCategoryData,
  UpdateCategoryData,
} from './categoryService'

export type {
  CreateExpenseData,
  UpdateExpenseData,
} from './expenseService'

export type {
  CreateBudgetData,
  UpdateBudgetData,
} from './budgetService'

export type {
  CreateInvestmentData,
  UpdateInvestmentData,
  PriceUpdateData,
} from './investmentService'
