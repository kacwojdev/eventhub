import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import multer from 'multer'
import path from 'path'
import prisma from '../lib/prisma'
import { signAdminToken } from '../lib/jwt'
import { requireAdmin, AuthRequest } from '../middleware/auth'
import { Prisma } from '@prisma/client'

const router = Router()

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../../uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only images allowed'))
  },
})

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  date: z.string().datetime(),
  capacity: z.coerce.number().int().positive(),
})

router.post('/login', async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() })
    return
  }
  const { email, password } = result.data
  try {
    const admin = await prisma.admin.findUnique({ where: { email } })
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }
    res.json({ token: signAdminToken(admin.id) })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/events', requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      include: { _count: { select: { registrations: true } } },
      orderBy: { date: 'asc' },
    })
    res.json(events)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/events', requireAdmin, async (req: AuthRequest, res: Response) => {
  const result = eventSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() })
    return
  }
  try {
    const event = await prisma.event.create({
      data: { ...result.data, date: new Date(result.data.date) },
    })
    res.status(201).json(event)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/events/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id), 10)
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return }
  const result = eventSchema.partial().safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() })
    return
  }
  try {
    const data = result.data
    const event = await prisma.event.update({
      where: { id },
      data: { ...data, ...(data.date ? { date: new Date(data.date) } : {}) },
    })
    res.json(event)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(404).json({ error: 'Event not found' })
      return
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/events/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id), 10)
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return }
  try {
    await prisma.registration.deleteMany({ where: { eventId: id } })
    await prisma.event.delete({ where: { id } })
    res.status(204).send()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(404).json({ error: 'Event not found' })
      return
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/events/:id/participants', requireAdmin, async (req: AuthRequest, res: Response) => {
  const eventId = parseInt(String(req.params.id), 10)
  if (isNaN(eventId)) { res.status(400).json({ error: 'Invalid id' }); return }
  try {
    const registrations = await prisma.registration.findMany({
      where: { eventId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    })
    res.json(registrations)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/events/:id/image', requireAdmin, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message || 'Upload failed' })
      return
    }
    next()
  })
}, async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id), 10)
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return }
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }
  const imageUrl = `/uploads/${req.file.filename}`
  try {
    const event = await prisma.event.update({ where: { id }, data: { imageUrl } })
    res.json(event)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(404).json({ error: 'Event not found' })
      return
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
