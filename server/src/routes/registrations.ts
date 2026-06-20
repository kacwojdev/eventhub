import { Router, Response } from 'express'
import { Prisma } from '@prisma/client'
import prisma from '../lib/prisma'
import { requireUser, AuthRequest } from '../middleware/auth'

const router = Router()

router.post('/events/:id/register', requireUser, async (req: AuthRequest, res: Response) => {
  const eventId = parseInt(String(req.params.id), 10)
  if (isNaN(eventId)) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }
  const userId = req.userId!

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: true } } },
    })
    if (!event) {
      res.status(404).json({ error: 'Event not found' })
      return
    }
    if (event._count.registrations >= event.capacity) {
      res.status(409).json({ error: 'Event is full' })
      return
    }
    const registration = await prisma.registration.create({ data: { userId, eventId } })
    res.status(201).json(registration)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(409).json({ error: 'Already registered' })
      return
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/events/:id/register', requireUser, async (req: AuthRequest, res: Response) => {
  const eventId = parseInt(String(req.params.id), 10)
  if (isNaN(eventId)) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }
  const userId = req.userId!

  try {
    const registration = await prisma.registration.findUnique({
      where: { userId_eventId: { userId, eventId } },
    })
    if (!registration) {
      res.status(404).json({ error: 'Registration not found' })
      return
    }
    await prisma.registration.delete({ where: { userId_eventId: { userId, eventId } } })
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/me/registrations', requireUser, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!
  try {
    const registrations = await prisma.registration.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { event: { date: 'asc' } },
    })
    res.json(registrations)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
