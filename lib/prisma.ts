import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? (() => {
  // Verificar si DATABASE_URL está configurado
  if (!process.env.DATABASE_URL) {
    // Retornar un objeto mock para desarrollo
    return {} as PrismaClient
  }
  
  if (process.env.DATABASE_URL.includes('[YOUR-PASSWORD]')) {
    // Retornar un objeto mock para desarrollo
    return {} as PrismaClient
  }

  try {
    return new PrismaClient()
  } catch (error) {
    // Retornar un objeto mock para desarrollo
    return {} as PrismaClient
  }
})()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
