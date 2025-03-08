import { PrismaClient } from "@prisma/client"

declare global {
  var prisma: PrismaClient | undefined
}

const prismaGlobal = global as typeof globalThis & {
  prisma: PrismaClient | undefined
}

export const prisma =
  prismaGlobal.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  prismaGlobal.prisma = prisma
}

