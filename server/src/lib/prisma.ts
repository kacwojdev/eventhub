// server/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'

const adapter = new PrismaBetterSqlite3({
  url: path.join(__dirname, '../../prisma/dev.db'),
})

declare global { var __prisma: PrismaClient | undefined }

const prisma = global.__prisma ?? new PrismaClient({ adapter })
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma

export default prisma
