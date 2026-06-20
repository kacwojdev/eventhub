import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import prisma from '../lib/prisma'
import { signUserToken } from '../lib/jwt'

const router = Router()

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/register', async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() })
    return
  }
  const { name, email, password } = result.data
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({ data: { name, email, passwordHash } })
    const token = signUserToken(user.id)
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(409).json({ error: 'Email already in use' })
      return
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/login', async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() })
    return
  }
  const { email, password } = result.data
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }
    const token = signUserToken(user.id)
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
