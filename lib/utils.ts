import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea números con punto para miles y coma para decimales
 * Ejemplo: 1234.56 → 1.234,56
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'decimal',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

/**
 * Formatea números como moneda con símbolo $
 * Ejemplo: 1234.56 → $1.234,56
 */
export function formatMoney(amount: number, decimals: number = 2): string {
  return `$${formatCurrency(amount, decimals)}`
}

/**
 * Formatea números para gráficos en miles
 * Ejemplo: 1234 → $1,2k
 */
export function formatChartValue(value: number): string {
  const thousands = value / 1000
  return `$${formatCurrency(thousands, 0)}k`
}
